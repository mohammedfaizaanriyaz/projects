// Starts the actual production entry point with deliberately unavailable,
// test-only database settings. No real database or USDA request is made.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import net from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const reservation = net.createServer();
reservation.listen(0, "127.0.0.1");
await once(reservation, "listening");
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const child = spawn(process.execPath, ["backend/server.js"], {
  cwd: root,
  env: {
    ...process.env,
    NODE_ENV: "production", HOST: "127.0.0.1", PORT: String(port),
    FRONTEND_ORIGIN: "https://example.invalid", TRUST_PROXY_HOPS: "0",
    DB_HOST: "127.0.0.1", DB_PORT: "1", DB_USER: "test_only_unavailable",
    DB_PASSWORD: "test-only-not-a-real-password", DB_NAME: "test_only_unavailable",
    DB_SSL: "false", DB_SSL_CA: "", DB_CONNECTION_LIMIT: "1",
    JWT_SECRET: randomBytes(48).toString("hex"), USDA_API_KEY: "test-only-not-used",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
child.stdout.on("data", (chunk) => { output += chunk; });
child.stderr.on("data", (chunk) => { output += chunk; });
const stopped = once(child, "exit");
const base = `http://127.0.0.1:${port}`;
const get = (path) => fetch(`${base}${path}`, { signal: AbortSignal.timeout(15000) });
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error(`Server exited early: ${output}`);
    try { ready = (await get("/api/live")).ok; } catch { /* Wait for the listener. */ }
    if (ready) break;
    await delay(50);
  }
  assert.ok(ready, "Production server starts");
  const page = await get("/");
  assert.equal(page.status, 200);
  assert.match(page.headers.get("content-security-policy"), /script-src 'self'/);
  const html = await page.text();
  assert.match(html, /<div id="root"><\/div>/);
  const asset = html.match(/src="(\/assets\/[^"]+\.js)"/)[1];
  const bundle = await get(asset);
  assert.equal(bundle.status, 200);
  assert.match(bundle.headers.get("cache-control"), /immutable/);
  assert.equal((await get("/api/auth/me")).status, 401);
  assert.equal((await get("/api/not-a-route")).status, 404);
  const health = await get("/api/health");
  assert.equal(health.status, 503, "Missing database fails readiness, not liveness");
  assert.ok(!JSON.stringify(await health.json()).includes("test_only_unavailable"));
  assert.equal((await get("/api/live")).status, 200);
  console.log("PASS: production start, built UI/assets, security headers, API errors, and unavailable-database readiness.");
} finally {
  child.kill("SIGTERM");
  const deadline = setTimeout(() => child.kill("SIGKILL"), 18000);
  const [code, signal] = await stopped;
  clearTimeout(deadline);
  assert.equal(signal, null, "Server exits gracefully without forced termination");
  assert.equal(code, 0, "Graceful shutdown succeeds");
  console.log("PASS: SIGTERM drains the server and closes the database pool.");
}
