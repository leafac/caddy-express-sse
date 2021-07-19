const express = require("express");
const app = express();

app.get("/", (req ,res) => {
  res.type("text/event-stream").flushHeaders();

  // res.writeHead(200, {
  //   'Content-Type': 'text/event-stream',
  //   'Cache-Control': 'no-cache',
  //   'X-Accel-Buffering': 'no',
  //   'Transfer-Encoding': 'chunked',
  // }).flushHeaders();
});

app.listen(4000);
