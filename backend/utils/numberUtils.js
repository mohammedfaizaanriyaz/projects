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
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : null;
}

// ============================================================
// USE NEW VALUE OR EXISTING VALUE
// ============================================================

function newOrExisting(
    newValue,
    existingValue
) {
    if (
        newValue !== undefined &&
        newValue !== null &&
        newValue !== ""
    ) {
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
    newOrExisting
};