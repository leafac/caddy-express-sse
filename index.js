const express = require("express");
const app = express();

app.get("/", (req ,res) => {
  res.type("text/event-stream").flushHeaders();

  // From https://github.com/caddyserver/caddy/issues/3765. Seems to be break even if you request directly without passing through Caddy.
  // res.writeHead(200, {
  //   'Content-Type': 'text/event-stream',
  //   'Cache-Control': 'no-cache',
  //   'X-Accel-Buffering': 'no',
  //   'Transfer-Encoding': 'chunked',
  // });

  // Works the same as my original line above.
  // res.writeHead(200, {
  //   'Content-Type': 'text/event-stream',
  //   'Cache-Control': 'no-cache',
  //   'X-Accel-Buffering': 'no',
  //   'Transfer-Encoding': 'chunked',
  // }).flushHeaders();
});

app.listen(4000);
