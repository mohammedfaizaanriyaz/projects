import { describe, expect, it } from "vitest";
import { ageOnDate, calculateAdultTargets, validateOverrides } from "./goals";

const adult = { dob: "1996-06-15", sex: "female", heightCm: 165, weightKg: 65, activityLevel: "moderately_active", goal: "recomposition" };
const today = new Date("2026-10-16T12:00:00Z");

describe("adult goal calculations", () => {
  it("computes a valid age and handles invalid dates", () => {
    expect(ageOnDate("1996-06-15", today)).toBe(30);
    expect(ageOnDate("2026-02-30", today)).toBeNull();
  });
  it("uses the Mifflin St Jeor equation and activity multiplier", () => {
    const result = calculateAdultTargets(adult, today);
    expect(result.available).toBe(true);
    expect(result.bmr).toBe(1375);
    expect(result.tdee).toBe(2125);
    expect(result.targetCalories).toBe(result.tdee);
    expect(result.proteinG * 4 + result.carbsG * 4 + result.fatG * 9).toBeGreaterThan(0);
  });
  it("does not produce adult calorie targets for minors", () => {
    expect(calculateAdultTargets({ ...adult, dob: "2010-01-01" }, today).available).toBe(false);
  });
  it("rejects implausible measurements and invalid activity", () => {
    expect(calculateAdultTargets({ ...adult, heightCm: 0 }, today).available).toBe(false);
    expect(calculateAdultTargets({ ...adult, activityLevel: "unknown" }, today).available).toBe(false);
  });
  it("keeps goal adjustments modest and validates manual overrides", () => {
    const loss = calculateAdultTargets({ ...adult, goal: "fat_loss" }, today);
    const maintenance = calculateAdultTargets(adult, today);
    expect(loss.targetCalories).toBeLessThan(maintenance.targetCalories);
    expect(loss.targetCalories).toBeGreaterThanOrEqual(loss.bmr);
    expect(validateOverrides({ targetCalories: "200" }, maintenance).valid).toBe(false);
    expect(validateOverrides({ proteinG: "125" }, maintenance).values.proteinG).toBe(125);
  });
});
