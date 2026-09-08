// ============================================================
// CHECK POSITIVE NUMBER
// ============================================================

function isPositiveNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) && number > 0;
}

// ============================================================
// CHECK VALID ID
// ============================================================

function isValidId(value) {
  return Number.isInteger(value) && value > 0;
}

// ============================================================
// CONVERT VALUE TO NUMBER OR NULL
// ============================================================

function numberOrNull(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

// ============================================================
// CONVERT POSITIVE VALUE TO NUMBER OR NULL
// ============================================================

function positiveNumberOrNull(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }

  return number;
}

// ============================================================
// USE NEW VALUE OR EXISTING VALUE
// ============================================================

function newOrExisting(newValue, existingValue) {
  if (newValue !== undefined && newValue !== null && newValue !== "") {
    return numberOrNull(newValue);
  }

  return numberOrNull(existingValue);
}

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  isPositiveNumber,
  isValidId,
  numberOrNull,
  positiveNumberOrNull,
  newOrExisting,
};
