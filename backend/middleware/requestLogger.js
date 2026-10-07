const { randomUUID } = require("node:crypto");

module.exports = (req, res, next) => {
  req.requestId = randomUUID();
  res.set("X-Request-Id", req.requestId);
  const started = performance.now();
  res.on("finish", () => console.log(JSON.stringify({
    event: "request", requestId: req.requestId, method: req.method,
    path: req.originalUrl.split("?")[0], status: res.statusCode,
    durationMs: Math.round(performance.now() - started),
  })));
  next();
};
