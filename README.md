# Caddy Doesn’t Seem to Flush Response Buffer, Breaking Reverse Proxy of Server-Sent Events

> For your convenience, you may also clone the code for this issue from <https://github.com/leafac/caddy-express-sse>

`Caddyfile`

```
localhost

reverse_proxy 127.0.0.1:4000
```

A simple Node.js web server running at `127.0.0.1:4000`:

```javascript
const express = require("express");
const app = express();

app.get("/", (req ,res) => {
  res.type("text/event-stream").flushHeaders();
});

app.listen(4000);
```

Start the server and the reverse proxy:

```console
$ npm install
$ node index.js # Leave running, continue on another terminal
$ caddy run # Leave running, continue on another terminal
```

When I make a request to the server directly (without Caddy), I get the response I expect:

```console
$ curl -Nv http://localhost:4000
*   Trying 127.0.0.1...
* TCP_NODELAY set
* Connected to localhost (127.0.0.1) port 4000 (#0)
> GET / HTTP/1.1
> Host: localhost:4000
> User-Agent: curl/7.64.1
> Accept: */*
> 
< HTTP/1.1 200 OK
< X-Powered-By: Express
< Content-Type: text/event-stream; charset=utf-8
< Date: Mon, 19 Jul 2021 14:25:59 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5
< Transfer-Encoding: chunked
```

Note how the response headers came through.

But when I request via Caddy, the following happens:

```console
$ curl -Nv https://localhost    
*   Trying 127.0.0.1...
* TCP_NODELAY set
* Connected to localhost (127.0.0.1) port 443 (#0)
* ALPN, offering h2
* ALPN, offering http/1.1
* successfully set certificate verify locations:
*   CAfile: /etc/ssl/cert.pem
  CApath: none
* TLSv1.2 (OUT), TLS handshake, Client hello (1):
* TLSv1.2 (IN), TLS handshake, Server hello (2):
* TLSv1.2 (IN), TLS handshake, Certificate (11):
* TLSv1.2 (IN), TLS handshake, Server key exchange (12):
* TLSv1.2 (IN), TLS handshake, Server finished (14):
* TLSv1.2 (OUT), TLS handshake, Client key exchange (16):
* TLSv1.2 (OUT), TLS change cipher, Change cipher spec (1):
* TLSv1.2 (OUT), TLS handshake, Finished (20):
* TLSv1.2 (IN), TLS change cipher, Change cipher spec (1):
* TLSv1.2 (IN), TLS handshake, Finished (20):
* SSL connection using TLSv1.2 / ECDHE-ECDSA-CHACHA20-POLY1305
* ALPN, server accepted to use h2
* Server certificate:
*  subject: [NONE]
*  start date: Jul 19 14:23:15 2021 GMT
*  expire date: Jul 20 02:23:15 2021 GMT
*  subjectAltName: host "localhost" matched cert's "localhost"
*  issuer: CN=Caddy Local Authority - ECC Intermediate
*  SSL certificate verify ok.
* Using HTTP2, server supports multi-use
* Connection state changed (HTTP/2 confirmed)
* Copying HTTP/2 data in stream buffer to connection buffer after upgrade: len=0
* Using Stream ID: 1 (easy handle 0x13e80f800)
> GET / HTTP/2
> Host: localhost
> User-Agent: curl/7.64.1
> Accept: */*
> 
* Connection state changed (MAX_CONCURRENT_STREAMS == 250)!
```

Now how the response headers didn’t arrive.

In both cases the connection is kept open, which is the intended behavior.

**Other Things I Tried without Success (They Don’t Seem to Affect the Behavior at All):**

- Change my Caddyfile to use `flush_interval -1` (see <https://caddy.community/t/v2-server-sent-events-from-flask-to-caddy-via-gunicorn/7806/2>).

- Rewrite my Node.js server to read like the following (see <https://github.com/caddyserver/caddy/issues/3765>):

  ```javascript
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no',
    'Transfer-Encoding': 'chunked',
  });
  ```

  (Weirdly enough, writing it this way makes it not work even when I make the request to the Node.js server directly, without Caddy in the middle. Using a `.flushHeaders()` right after the call to `.writeHead()` seems to fix it.)

**My Suspicion:** The `flush_interval` configuration seems to be ignored, regardless of whether it was set explicitly in the `Caddyfile` or it was set by Caddy itself because the response `Content-Type` is `text/event-stream` (see <https://caddyserver.com/docs/caddyfile/directives/reverse_proxy#streaming> and <https://github.com/caddyserver/caddy/blob/master/modules/caddyhttp/reverseproxy/streaming.go#L104-L108>).

<details>
<summary><strong>Versions</strong></summary>

```console
$ node --version
v16.5.0
$ caddy version
v2.4.3 h1:Y1FaV2N4WO3rBqxSYA8UZsZTQdN+PwcoOcAiZTM8C0I=
```

</details>
