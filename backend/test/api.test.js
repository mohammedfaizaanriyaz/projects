const { test, after, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const fs = require("node:fs");
const path = require("node:path");
process.env.JWT_SECRET = "test-only-0123456789abcdef0123456789abcdef";
process.env.NODE_ENV = "test";
const { createApp } = require("../app");
const pool = require("../db");
const userService = require("../services/userService");
const authService = require("../services/authService");
const profiles = require("../services/profileService");
const weights = require("../services/weightService");
const tasks = require("../services/taskService");
const logs = require("../services/nutritionLogService");
const { checkDatabase } = require("../config/checkDatabase");

const config = { production: false, origin: "http://localhost:5173", trustProxy: 0 };
const app = () => createApp({ config, logRequests: false, database: { query: async () => [] } });
const account = { user_id: 1, name: "Test", email: "test@example.com" };
function signedIn() {
  mock.method(userService, "findUserById", async () => account);
  return `auth_token=${authService.createToken(1)}`;
}
const profile = { profile_id: 10, user_id: 1, profile_name: "Me", dob: "2000-01-01", gender: "male", height_cm: 170 };
afterEach(() => mock.restoreAll());
after(() => pool.end());

test("liveness, readiness, no-store and security headers", async () => {
  const response = await request(app()).get("/api/health").expect(200);
  assert.equal(response.body.schema, "ready");
  assert.equal(response.headers["cache-control"], "no-store");
  assert.equal(response.headers["x-content-type-options"], "nosniff");
  assert.equal(response.headers["x-powered-by"], undefined);
  const failed = createApp({ config, logRequests: false, database: { query: async () => { throw new Error("private detail"); } } });
  await request(failed).get("/api/live").expect(200);
  const health = await request(failed).get("/api/health").expect(503);
  assert.ok(!JSON.stringify(health.body).includes("private detail"));
});

test("readiness columns match the unmodified schema files", async () => {
  const sql = ["init.sql", "002_add_nutrition_logs.sql"].map((file) => fs.readFileSync(path.resolve(__dirname, "../../db/db-init", file), "utf8")).join("\n");
  const tables = Object.fromEntries([...sql.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)\s*\(([\s\S]*?)\n\);/g)].map((match) => [match[1], match[2]]));
  await checkDatabase({ query: async (query) => {
    const match = /^SELECT (.+) FROM (\w+) LIMIT 0$/.exec(query);
    assert.ok(match, "Only read-only schema queries are allowed");
    for (const column of match[1].split(", ")) assert.match(tables[match[2]], new RegExp(`\\b${column}\\s+`, "i"), `${match[2]}.${column}`);
  } });
});

test("API writes require a protection header and trusted browser origin", async () => {
  await request(app()).post("/api/auth/logout").expect(403);
  await request(app()).post("/api/auth/logout").set("X-Vyra-Request", "1").set("Origin", "https://attacker.example").expect(403);
  const res = await request(app()).post("/api/auth/logout").set("X-Vyra-Request", "1").set("Origin", config.origin).expect(200);
  assert.match(res.headers["set-cookie"][0], /HttpOnly/);
  assert.match(res.headers["set-cookie"][0], /SameSite=Lax/);
});

test("authentication rejects missing, malformed and oversize inputs before database access", async () => {
  const database = mock.method(userService, "findUserByEmail", async () => { throw new Error("should not query"); });
  for (const body of [undefined, [], { name: {}, email: "a@example.com", password: "abcdefgh" }, { name: "a".repeat(101), email: "a@example.com", password: "abcdefgh" }, { name: "A", email: `${"a".repeat(260)}@example.com`, password: "abcdefgh" }]) {
    await request(app()).post("/api/auth/register").set("X-Vyra-Request", "1").send(body).expect(400);
  }
  await request(app()).post("/api/auth/login").set("X-Vyra-Request", "1").send({ email: [], password: {} }).expect(400);
  assert.equal(database.mock.callCount(), 0);
});

test("concurrent duplicate signup returns 409 and successful signup sets secure cookies in production", async () => {
  mock.method(userService, "findUserByEmail", async () => null);
  mock.method(authService, "hashPassword", async () => "hash");
  mock.method(userService, "createAccount", async () => { throw Object.assign(new Error("duplicate"), { code: "ER_DUP_ENTRY" }); });
  const body = { name: "Student", email: "student@example.com", password: "testing-password" };
  await request(app()).post("/api/auth/register").set("X-Vyra-Request", "1").send(body).expect(409);
  mock.method(userService, "createAccount", async () => 1);
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    const res = await request(app()).post("/api/auth/register").set("X-Vyra-Request", "1").send(body).expect(201);
    assert.match(res.headers["set-cookie"][0], /Secure/);
    assert.match(res.headers["set-cookie"][0], /HttpOnly/);
    assert.equal(res.body.user.password_hash, undefined);
  } finally { process.env.NODE_ENV = previous; }
});

test("login rate limit rejects repeated attempts with 429", async () => {
  const server = app();
  for (let i = 0; i < 20; i++) await request(server).post("/api/auth/login").set("X-Vyra-Request", "1").send({}).expect(400);
  await request(server).post("/api/auth/login").set("X-Vyra-Request", "1").send({}).expect(429);
});

test("anonymous and other-account access cannot read or change profiles", async () => {
  await request(app()).get("/api/profiles/10").expect(401);
  const cookie = signedIn();
  await request(app()).get("/api/users/2/profiles").set("Cookie", cookie).expect(403);
  mock.method(profiles, "getProfileById", async () => ({ ...profile, user_id: 2 }));
  await request(app()).delete("/api/profiles/10/weight-records/5").set("Cookie", cookie).set("X-Vyra-Request", "1").expect(403);
});

test("weight observations reject future and pre-birth dates; deletion is profile-scoped", async () => {
  const cookie = signedIn();
  mock.method(profiles, "getProfileById", async () => profile);
  mock.method(weights, "getBodyProfile", async () => profile);
  const insert = mock.method(weights, "saveWeightRecord", async () => 7);
  const send = (date) => request(app()).post("/api/profiles/10/weight-records").set("Cookie", cookie).set("X-Vyra-Request", "1").send({ weight_kg: 70, recorded_date: date, time_zone: "Asia/Kolkata" });
  await send("2999-01-01").expect(400);
  await send("1999-01-01").expect(400);
  const valid = await send("2026-01-02").expect(201);
  assert.equal(insert.mock.callCount(), 1); assert.equal(valid.body.record.weight_id, 7);
  const remove = mock.method(weights, "deleteWeightRecord", async () => true);
  await request(app()).delete("/api/profiles/10/weight-records/7").set("Cookie", cookie).set("X-Vyra-Request", "1").expect(200);
  assert.deepEqual(remove.mock.calls[0].arguments, [10, 7]);
});

test("list ownership and task date validation remain enforced", async () => {
  const cookie = signedIn();
  mock.method(tasks, "findTaskListById", async () => null);
  await request(app()).get("/api/users/1/task-lists/900/tasks").set("Cookie", cookie).expect(404);
  await request(app()).patch("/api/users/1/task-lists/5/tasks/7/complete").set("Cookie", cookie).set("X-Vyra-Request", "1").expect(400);
  mock.method(tasks, "findTaskListById", async () => ({ list_id: 5, user_id: 1 }));
  await request(app()).post("/api/users/1/task-lists/5/tasks").set("Cookie", cookie).set("X-Vyra-Request", "1")
    .send({ title: "Walk", due_at: "2026-10-07T10:00:00.000Z", reminder_at: "2026-10-07T11:00:00.000Z" }).expect(400);
});

test("nutrition logs preserve unknown values and reject unsafe decimal input", async () => {
  const cookie = signedIn();
  mock.method(profiles, "getProfileById", async () => profile);
  const create = mock.method(logs, "createNutritionLog", async () => 9);
  mock.method(logs, "getNutritionLogById", async () => ({ log_id: 9, profile_id: 10, quantity: "1.000", weight_grams: "30.000", calories: null }));
  const payload = { food_name: "Food", quantity: 1, unit: "g", weight_grams: 30, meal_type: "lunch", logged_date: "2026-01-01", nutrition: { calories: null, protein_g: 0 } };
  const send = (body) => request(app()).post("/api/profiles/10/nutrition-logs").set("Cookie", cookie).set("X-Vyra-Request", "1").send(body);
  await send({ ...payload, weight_grams: 0 }).expect(400);
  const res = await send(payload).expect(201);
  assert.equal(res.body.log.calories, null);
  assert.equal(create.mock.calls[0].arguments[0].nutrition.calories, null);
  assert.equal(create.mock.calls[0].arguments[0].nutrition.protein_g, 0);
});

test("malformed JSON, oversize bodies and unknown API routes return JSON errors", async () => {
  await request(app()).post("/api/auth/login").set("X-Vyra-Request", "1").set("Content-Type", "application/json").send("{").expect(400);
  await request(app()).post("/api/auth/login").set("X-Vyra-Request", "1").send({ data: "a".repeat(110000) }).expect(413);
  const response = await request(app()).get("/api/unknown").expect(404);
  assert.equal(typeof response.body.error, "string");
});

test("password hashes verify correctly and token algorithms are constrained", async () => {
  const hash = await authService.hashPassword("test-only-password");
  assert.equal(await authService.comparePassword("test-only-password", hash), true);
  assert.equal(await authService.comparePassword("wrong-password", hash), false);
  assert.equal(authService.verifyToken(authService.createToken(1)).userId, 1);
  assert.throws(() => authService.verifyToken("bad-token"));
});
