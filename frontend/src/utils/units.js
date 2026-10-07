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
