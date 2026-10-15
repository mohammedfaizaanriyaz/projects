// Adult-only estimates. The Mifflin-St Jeor equation uses sex-specific constants.
export const GOALS = Object.freeze({
  fat_loss: "Fat loss",
  recomposition: "Body recomposition",
  muscle_gain: "Muscle gain",
});

export const ACTIVITY_FACTORS = Object.freeze({
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
});

export function ageOnDate(dateOfBirth, today = new Date()) {
  if (typeof dateOfBirth !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return null;
  const dob = new Date(dateOfBirth + "T00:00:00Z");
  if (Number.isNaN(dob.getTime()) || dob.toISOString().slice(0, 10) !== dateOfBirth) return null;
  let age = today.getUTCFullYear() - dob.getUTCFullYear();
  const anniversary = dateOfBirth.slice(5);
  const current = String(today.getUTCMonth() + 1).padStart(2, "0") + "-" + String(today.getUTCDate()).padStart(2, "0");
  if (current < anniversary) age -= 1;
  return age >= 0 && age <= 120 ? age : null;
}

export function recommendGoal() {
  // Do not infer a weight-loss or weight-gain goal from height or BMI.
  return "recomposition";
}

function rounded(value, step = 1) { return Math.round(value / step) * step; }
function validMeasurement(value, low, high) {
  const n = Number(value);
  return value !== "" && value != null && Number.isFinite(n) && n >= low && n <= high;
}

export function calculateAdultTargets({ dob, sex, heightCm, weightKg, activityLevel, goal = "recomposition" }, today = new Date()) {
  const age = ageOnDate(dob, today);
  if (age === null) return { available: false, reason: "Enter a valid date of birth." };
  if (age < 20) return { available: false, reason: "Adult calorie formulas are not appropriate for profiles under 20. Your records and goals remain available without calorie targets." };
  if (!["male", "female"].includes(sex)) return { available: false, reason: "Select the sex used by this equation." };
  if (!validMeasurement(heightCm, 120, 230) || !validMeasurement(weightKg, 35, 300)) {
    return { available: false, reason: "Enter a plausible height (120–230 cm) and weight (35–300 kg) before calculating." };
  }
  const factor = ACTIVITY_FACTORS[activityLevel];
  if (!factor) return { available: false, reason: "Select an activity level to estimate maintenance energy." };
  if (!Object.hasOwn(GOALS, goal)) return { available: false, reason: "Choose a supported goal." };

  const bmr = 10 * Number(weightKg) + 6.25 * Number(heightCm) - 5 * age + (sex === "male" ? 5 : -161);
  const maintenance = bmr * factor;
  const delta = goal === "fat_loss" ? -Math.min(maintenance * 0.10, 300) : goal === "muscle_gain" ? maintenance * 0.05 : 0;
  // A modest change; never recommend an estimated intake below the calculated BMR.
  const target = Math.max(bmr, maintenance + delta);
  const protein = rounded(Number(weightKg) * (goal === "muscle_gain" ? 1.6 : goal === "fat_loss" ? 1.5 : 1.4), 5);
  const fat = rounded(Math.max(Number(weightKg) * 0.8, target * 0.25 / 9), 5);
  const carbs = (target - protein * 4 - fat * 9) / 4;
  if (carbs < 0) return { available: false, reason: "Inputs cannot produce a balanced macro estimate." };

  return {
    available: true,
    age,
    bmr: rounded(bmr, 25),
    tdee: rounded(maintenance, 25),
    targetCalories: rounded(target, 25),
    proteinG: protein,
    carbsG: rounded(carbs, 5),
    fatG: fat,
    activityFactor: factor,
    equation: "Mifflin–St Jeor (adult estimate): 10×kg + 6.25×cm − 5×age + sex constant (+5 / −161).",
    note: "TDEE = estimated BMR × activity factor. Fat loss: up to 10% below maintenance (max 300 kcal); recomposition: maintenance; muscle gain: ~5% above maintenance. Macronutrients are rough starting estimates, not medical advice.",
  };
}

export function validateOverrides(overrides, estimate) {
  if (!estimate?.available) return { valid: false, error: "Adult estimates are unavailable for this profile." };
  const limits = { targetCalories: [Math.max(1500, estimate.bmr), Math.max(3000, estimate.tdee * 1.5)], proteinG: [0, 400], carbsG: [0, 700], fatG: [0, 250] };
  const result = {};
  for (const [key, [min, max]] of Object.entries(limits)) {
    const raw = overrides[key];
    if (raw === "" || raw === undefined || raw === null) continue;
    if (!validMeasurement(raw, min, max)) return { valid: false, error: `Override for ${key} must be between ${Math.ceil(min)} and ${Math.floor(max)}.` };
    result[key] = Number(raw);
  }
  return { valid: true, values: result };
}
