const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });
const config = require("./config/validateEnv")();
const { createApp } = require("./app");
const pool = require("./db");
const app = createApp({ config });
const server = app.listen(config.port, process.env.HOST || "0.0.0.0", () => {
  console.log(JSON.stringify({ event: "server_started", port: config.port, mode: process.env.NODE_ENV || "development" }));
});
server.requestTimeout = 45000;
server.headersTimeout = 15000;

let closing = false;
function shutdown(signal) {
  if (closing) return;
  closing = true;
  console.log(JSON.stringify({ event: "server_stopping", signal }));
  const deadline = setTimeout(() => process.exit(1), 15000).unref();
  server.close(async () => {
    try { await pool.end(); clearTimeout(deadline); process.exit(0); }
    catch { process.exit(1); }
  });
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
server.on("error", (error) => {
  console.error(JSON.stringify({ event: "server_start_failed", code: error.code }));
  process.exit(1);
});
