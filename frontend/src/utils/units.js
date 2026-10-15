export const KG_PER_POUND = 0.45359237;
export const CM_PER_INCH = 2.54;

export function displayMeasurement(value, unit) {
  if (value == null || value === "" || !Number.isFinite(Number(value))) return "—";
  const factor = unit === "lb" ? KG_PER_POUND : unit === "in" ? CM_PER_INCH : 1;
  return `${(Number(value) / factor).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}`;
}

export function storedMeasurement(value, unit) {
  if (value === "" || value == null) return null;
  const number = Number(value) * (unit === "lb" ? KG_PER_POUND : unit === "in" ? CM_PER_INCH : 1);
  if (!Number.isFinite(number) || number < 0.01 || number > 999.99) throw new Error("Measurement is outside the supported range.");
  return Number(number.toFixed(2));
}

export function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function heightToFeetInches(heightCm) {
  const n = Number(heightCm);
  if (!Number.isFinite(n) || n <= 0) return null;
  const totalInches = n / CM_PER_INCH;
  let feet = Math.floor(totalInches / 12);
  let inches = Number((totalInches - feet * 12).toFixed(2));
  if (inches >= 12) { feet += 1; inches = 0; }
  return { feet, inches };
}
export function feetInchesToHeightCm(feet, inches) {
  const f = Number(feet), i = Number(inches);
  if (!Number.isInteger(f) || f < 0 || !Number.isFinite(i) || i < 0 || i >= 12) throw new Error("Use whole feet and inches from 0 to under 12.");
  const cm = (f * 12 + i) * CM_PER_INCH;
  if (cm < 1 || cm > 999.99) throw new Error("Height is outside the supported range.");
  return Number(cm.toFixed(2));
}
