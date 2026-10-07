const { test } = require("node:test");
const assert = require("node:assert/strict");
const { today, calendarDate, observationDate } = require("../utils/calendarDate");
const { resolveWeightInGrams } = require("../utils/unitConverter");
const { calculateBodyFat, getBMICategory } = require("../utils/healthCalculations");
const { createProviderCache } = require("../utils/providerCache");
const validateEnv = require("../config/validateEnv");

test("calendar validation handles leap years and the user's calendar day", () => {
  assert.equal(calendarDate("2024-02-29"), "2024-02-29");
  assert.throws(() => calendarDate("2025-02-29"), /valid calendar/);
  assert.throws(() => observationDate("2999-01-01", "2000-01-01", "Asia/Kolkata"), /future/);
  assert.throws(() => observationDate("1999-01-01", "2000-01-01"), /before/);
  assert.throws(() => today("invalid-zone"), /time zone/);
  assert.equal(today("Asia/Kolkata", new Date("2026-10-06T20:00:00Z")), "2026-10-07");
  assert.equal(today("America/Los_Angeles", new Date("2026-10-07T02:00:00Z")), "2026-10-06");
});

test("mass and USDA portion calculations preserve amounts and reject overflow", () => {
  const food = { foodPortions: [{ id: 12, amount: 2, gramWeight: 30, measureUnit: { name: "tablespoon" }, portionDescription: "2 tbsp" }] };
  assert.equal(resolveWeightInGrams(food, 1, "tbsp"), 15);
  assert.equal(resolveWeightInGrams(food, 1, "portion:12"), 30);
  assert.equal(resolveWeightInGrams(food, 2, "kg"), 2000);
  assert.equal(resolveWeightInGrams(food, 1, "lb"), 453.592);
  for (const value of [0, true, 0.0001, 1e308]) assert.throws(() => resolveWeightInGrams(food, value, "g"));
  assert.throws(() => resolveWeightInGrams(food, 999999999, "kg"), /Converted weight/);
  assert.throws(() => resolveWeightInGrams(food, 0.001, "mg"), /Converted weight/);
  assert.throws(() => resolveWeightInGrams({ foodPortions: [...food.foodPortions, ...food.foodPortions] }, 1, "tbsp"), /ambiguous/);
});

test("body-fat and adult BMI helpers keep unavailable estimates unknown", () => {
  assert.equal(calculateBodyFat("male", 170, 20, 40), null);
  assert.equal(calculateBodyFat("female", 165, 80, 35, null), null);
  assert.equal(getBMICategory(25, "2015-01-01", "2026-01-01"), null);
  assert.equal(getBMICategory(22, "1990-01-01", "2026-01-01"), "Normal");
});

test("provider cache deduplicates requests, bounds concurrency and retries failures", async () => {
  const cache = createProviderCache({ concurrency: 2, hourlyLimit: 20 });
  let calls = 0, active = 0, peak = 0;
  const load = async () => {
    calls++; active++; peak = Math.max(peak, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active--; return { ok: true };
  };
  await Promise.all([cache("same", load), cache("same", load), ...[1, 2, 3].map((key) => cache(key, load))]);
  assert.equal(calls, 4); assert.equal(peak, 2);
  await assert.rejects(cache("failure", async () => { throw new Error("unavailable"); }));
  assert.deepEqual(await cache("failure", load), { ok: true });
  const quota = createProviderCache({ hourlyLimit: 1 });
  await quota("a", load);
  await assert.rejects(quota("b", load), (error) => error.statusCode === 503);
});

test("production configuration fails early for unsafe or incomplete settings", () => {
  const env = { DB_HOST: "127.0.0.1", DB_USER: "test_app", DB_PASSWORD: "test-only", DB_NAME: "test_db", JWT_SECRET: "0123456789abcdef0123456789abcdef0123456789abcdef", USDA_API_KEY: "test-only", NODE_ENV: "production" };
  assert.throws(() => validateEnv(env), /FRONTEND_ORIGIN/);
  assert.throws(() => validateEnv({ ...env, FRONTEND_ORIGIN: "http://example.com" }), /HTTPS/);
  assert.throws(() => validateEnv({ ...env, FRONTEND_ORIGIN: "https://example.com", PORT: "oops" }), /PORT/);
  assert.throws(() => validateEnv({ ...env, FRONTEND_ORIGIN: "https://example.com", TRUST_PROXY_HOPS: "true" }), /TRUST_PROXY/);
  assert.equal(validateEnv({ ...env, FRONTEND_ORIGIN: "https://example.com" }).origin, "https://example.com");
});
