const { test, after, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const pool = require("../db");
const profiles = require("../services/profileService");
const nutrition = require("../services/nutritionService");

afterEach(() => mock.restoreAll());
after(() => pool.end());

test("USDA detail requests are shared while portions scale nutrients and keep missing values unknown", async () => {
  const fetch = mock.method(global, "fetch", async () => ({
    ok: true, status: 200, json: async () => ({
      fdcId: 91001, description: "Test food", dataType: "Foundation",
      foodPortions: [{ id: 4, amount: 2, gramWeight: 30, measureUnit: { name: "tablespoon" }, portionDescription: "2 tbsp" }],
      foodNutrients: [
        { nutrient: { id: 1008, unitName: "kcal" }, amount: 200 },
        { nutrient: { id: 1003, unitName: "g" }, amount: 10 },
        { nutrient: { id: 1004, unitName: "g" }, amount: -1 },
      ],
    }),
  }));
  const [spoon, portion] = await Promise.all([
    nutrition.calculateFood({ fdcId: 91001, quantity: 1, unit: "tbsp" }),
    nutrition.calculateFood({ fdcId: 91001, quantity: 1, unit: "portion:4" }),
  ]);
  assert.equal(fetch.mock.callCount(), 1);
  assert.equal(spoon.input.weightGrams, 15);
  assert.equal(spoon.nutrition.calories, 30);
  assert.equal(portion.nutrition.protein_g, 3);
  assert.equal(portion.nutrition.carbs_g, null);
  assert.equal(portion.nutrition.fat_g, null);
  assert.ok(portion.missingNutrients.includes("carbs_g"));
});

test("USDA transport, quota and malformed-response failures become safe actionable errors", async () => {
  mock.method(global, "fetch", async () => { throw new Error("private provider transport detail"); });
  await assert.rejects(nutrition.getFoodDetails(91002), (error) => error.statusCode === 502 && !error.message.includes("private"));
  mock.method(global, "fetch", async () => ({ ok: false, status: 429 }));
  await assert.rejects(nutrition.getFoodDetails(91003), (error) => error.statusCode === 503);
  mock.method(global, "fetch", async () => ({ ok: true, status: 200, json: async () => ({ unexpected: true }) }));
  await assert.rejects(nutrition.getFoodDetails(91004), (error) => error.statusCode === 502);
  // A failed transport result must not poison later retries for the same ID.
  mock.method(global, "fetch", async () => ({ ok: true, status: 200, json: async () => ({ fdcId: 91002, description: "Recovered food" }) }));
  assert.equal((await nutrition.getFoodDetails(91002)).description, "Recovered food");
});

const input = {
  userId: 1, profileName: "Test profile", dob: "2000-01-01", gender: "male",
  height: 170, waist: null, chest: null, neck: null, hip: null, currentWeight: 70,
  recordedDate: "2026-01-02", targetWeight: null, activityLevel: "not_specified", bmi: 24.22, bodyFat: null,
};

function connectionFixture(failBodyInsert = false) {
  const events = [], queries = [];
  const connection = {
    beginTransaction: async () => events.push("begin"),
    commit: async () => events.push("commit"),
    rollback: async () => events.push("rollback"),
    release: () => events.push("release"),
    query: async (sql, parameters) => {
      queries.push({ sql, parameters });
      if (/SELECT user_id/.test(sql)) return [{ user_id: 1 }];
      if (/INSERT INTO body_profile/.test(sql) && failBodyInsert) throw new Error("insert failed");
      return { insertId: queries.length === 2 ? 10n : 20n };
    },
  };
  mock.method(pool, "getConnection", async () => connection);
  return { events, queries };
}

test("profile and initial weight are committed together with the supplied local calendar date", async () => {
  const { events, queries } = connectionFixture();
  const result = await profiles.createProfile(input);
  assert.equal(result.profileId, 10);
  assert.equal(result.weightRecord.weight_id, 20);
  assert.deepEqual(events, ["begin", "commit", "release"]);
  const weight = queries.find((query) => /INSERT INTO weight_records/.test(query.sql));
  assert.deepEqual(weight.parameters, [10, 70, 24.22, null, "2026-01-02"]);
});

test("an incomplete profile creation rolls back and releases its database connection", async () => {
  const { events, queries } = connectionFixture(true);
  await assert.rejects(profiles.createProfile(input), /insert failed/);
  assert.deepEqual(events, ["begin", "rollback", "release"]);
  assert.equal(queries.some((query) => /INSERT INTO weight_records/.test(query.sql)), false);
});
