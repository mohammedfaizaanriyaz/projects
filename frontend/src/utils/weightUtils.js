// ============================================================

export function kgToLb(kg) {
  return kg * 2.2046226218;
}

export function lbToKg(lb) {
  return lb / 2.2046226218;
}

export function cmToInch(cm) {
  return cm / 2.54;
}

export function inchToCm(inch) {
  return inch * 2.54;
}

export function round(value, decimals = 2) {
  const power = 10 ** decimals;

  return (
    Math.round(
      Number(value) * power
    ) / power
  );
}

export function weightToKg(value, unit) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }

  if (unit === "lbs") {
    return round(lbToKg(number));
  }

  return round(number);
}

export function lengthToCm(value, unit) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }

  if (unit === "inch") {
    return round(inchToCm(number));
  }

  return round(number);
}
export function feetInchesToCm(
  feet,
  inches
) {
  const f =
    Number(feet || 0);

  const i =
    Number(inches || 0);

  return round(
    (f * 12 + i) * 2.54
  );
}

export function displayWeight(
  kg,
  unit
) {
  if (
    kg === null ||
    kg === undefined
  ) {
    return "—";
  }

  if (unit === "lbs") {
    return `${round(
      kgToLb(Number(kg)),
      1
    )} lbs`;
  }

  return `${round(
    Number(kg),
    1
  )} kg`;
}

export function displayLength(
  cm,
  unit
) {
  if (
    cm === null ||
    cm === undefined
  ) {
    return "—";
  }

  if (unit === "inch") {
    return `${round(
      cmToInch(
        Number(cm)
      ),
      1
    )} in`;
  }

  return `${round(
    Number(cm),
    1
  )} cm`;
}

// ============================================================
// DATE HELPERS
// ============================================================

export function dateValue(value) {
  if (!value) {
    return null;
  }

  return new Date(value);
}

export function formatShortDate(
  value
) {
  const date =
    dateValue(value);

  if (
    !date ||
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
    }
  );
}

export function formatFullDate(
  value
) {
  const date =
    dateValue(value);

  if (
    !date ||
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

// ============================================================
// CHART FILTER
// ============================================================

export function filterHistory(
  history,
  range
) {
  if (range === "ALL") {
    return history;
  }

  const days = {
    "7D": 7,
    "1M": 30,
    "3M": 90,
    "6M": 180,
    "1Y": 365,
  };

  const cutoff =
    new Date();

  cutoff.setDate(
    cutoff.getDate() -
      days[range]
  );

  return history.filter(
    (entry) => {
      const date =
        dateValue(
          entry.recorded_date
        );

      return (
        date &&
        date >= cutoff
      );
    }
  );
}

// ============================================================
// HEALTH HELPERS
// ============================================================

export function calculateBMI(
  weightKg,
  heightCm
) {
  if (
    !weightKg ||
    !heightCm
  ) {
    return null;
  }

  const metres =
    Number(heightCm) /
    100;

  return round(
    Number(weightKg) /
      (metres * metres),
    1
  );
}

export function bmiCategory(bmi) {
  if (bmi === null) {
    return "—";
  }

  if (bmi < 18.5) {
    return "Underweight";
  }

  if (bmi < 25) {
    return "Normal";
  }

  if (bmi < 30) {
    return "Overweight";
  }

  return "Obesity";
}

export function healthyRange(
  heightCm
) {
  if (!heightCm) {
    return null;
  }

  const height =
    Number(heightCm) /
    100;

  return {
    min: round(
      18.5 *
        height *
        height,
      1
    ),

    max: round(
      24.9 *
        height *
        height,
      1
    ),
  };
}

// ============================================================
// EMPTY PROFILE FORM
// ============================================================

export function emptyProfile() {
  return {
    profile_name: "",
    dob: "",
    gender: "",

    heightValue: "",
    heightUnit: "cm",
    heightFeet: "",
    heightInches: "",

    currentWeight: "",
    weightUnit: "kg",

    targetWeight: "",
    targetWeightUnit: "kg",

    waist: "",
    waistUnit: "cm",

    chest: "",
    chestUnit: "cm",

    neck: "",
    neckUnit: "cm",

    hip: "",
    hipUnit: "cm",
  };

}
