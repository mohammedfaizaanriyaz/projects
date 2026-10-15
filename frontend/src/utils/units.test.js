import { describe, expect, it } from "vitest";
import { CM_PER_INCH, KG_PER_POUND, feetInchesToHeightCm, heightToFeetInches, storedMeasurement } from "./units";
describe("unit conversion", () => {
  it("converts pounds into kilograms without altering the measurement", () => {
    expect(storedMeasurement(150, "lb")).toBeCloseTo(150 * KG_PER_POUND, 2);
  });
  it("converts feet and inches to cm", () => {
    expect(feetInchesToHeightCm(5, 6)).toBeCloseTo(66 * CM_PER_INCH, 2);
    const values = heightToFeetInches(167.64);
    expect(values.feet).toBe(5);
    expect(values.inches).toBeCloseTo(6, 2);
  });
  it("rejects invalid imperial input", () => {
    expect(() => feetInchesToHeightCm(5, 12)).toThrow();
  });
});
