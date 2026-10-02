// ============================================================
// ROUND TO TWO DECIMAL PLACES
// ============================================================

function roundToTwo(value) {
    return Number(
        Number(value).toFixed(2)
    );
}


// ============================================================
// CALCULATE AGE
// ============================================================

function calculateAge(
    dob,
    referenceDate = new Date()
) {
    if (!dob) {
        return null;
    }

    const birthDate =
        new Date(dob);

    const currentDate =
        new Date(referenceDate);

    if (
        Number.isNaN(
            birthDate.getTime()
        ) ||
        Number.isNaN(
            currentDate.getTime()
        )
    ) {
        return null;
    }

    let age =
        currentDate.getUTCFullYear() -
        birthDate.getUTCFullYear();

    const currentMonth =
        currentDate.getUTCMonth();

    const birthMonth =
        birthDate.getUTCMonth();

    const currentDay =
        currentDate.getUTCDate();

    const birthDay =
        birthDate.getUTCDate();

    const birthdayNotReached =
        currentMonth < birthMonth ||
        (
            currentMonth === birthMonth &&
            currentDay < birthDay
        );

    if (birthdayNotReached) {
        age--;
    }

    if (age < 0) {
        return null;
    }

    return age;
}


// ============================================================
// BMI
// ============================================================

function calculateBMI(
    weightKg,
    heightCm
) {
    const heightM =
        heightCm / 100;

    if (heightM <= 0) {
        return null;
    }

    return roundToTwo(
        weightKg /
        (heightM * heightM)
    );
}


// ============================================================
// BMI CATEGORY
// Adult BMI categories are only used for age 20+
// ============================================================

function getBMICategory(
    bmi,
    dob,
    referenceDate = new Date()
) {
    if (bmi === null) {
        return null;
    }

    const age =
        calculateAge(
            dob,
            referenceDate
        );

    if (
        age === null ||
        age < 20
    ) {
        return null;
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


// ============================================================
// HEALTHY WEIGHT RANGE
// Adult BMI range is only used for age 20+
// ============================================================

function calculateHealthyWeightRange(
    heightCm,
    dob,
    referenceDate = new Date()
) {
    const age =
        calculateAge(
            dob,
            referenceDate
        );

    if (
        age === null ||
        age < 20
    ) {
        return null;
    }

    const heightM =
        heightCm / 100;

    if (heightM <= 0) {
        return null;
    }

    return {
        minimum_kg:
            roundToTwo(
                18.5 *
                heightM *
                heightM
            ),

        maximum_kg:
            roundToTwo(
                24.9 *
                heightM *
                heightM
            )
    };
}


// ============================================================
// BODY FAT
// U.S. NAVY FORMULA
// ============================================================

function calculateBodyFat(
    gender,
    heightCm,
    waistCm,
    neckCm,
    hipCm
) {
    // Accept positive numbers and numeric strings.
    // Reject missing values, booleans, objects and infinity.
    function positiveMeasurement(value) {
        if (typeof value !== "number" && typeof value !== "string") {
            return null;
        }

        if (typeof value === "string" && value.trim() === "") {
            return null;
        }

        const number = Number(value);

        return Number.isFinite(number) && number > 0
            ? number
            : null;
    }

    if (typeof gender !== "string") {
        return null;
    }

    const normalizedGender = gender.trim().toLowerCase();
    const height = positiveMeasurement(heightCm);
    const waist = positiveMeasurement(waistCm);
    const neck = positiveMeasurement(neckCm);

    if (height === null || waist === null || neck === null) {
        return null;
    }

    let density;

    if (normalizedGender === "male") {
        if (waist <= neck) {
            return null;
        }

        density =
            1.0324 -
            0.19077 * Math.log10(waist - neck) +
            0.15456 * Math.log10(height);
    } else if (normalizedGender === "female") {
        const hip = positiveMeasurement(hipCm);

        if (hip === null || waist + hip <= neck) {
            return null;
        }

        density =
            1.29579 -
            0.35004 * Math.log10(waist + hip - neck) +
            0.221 * Math.log10(height);
    } else {
        return null;
    }

    // Avoid division by zero or an invalid calculated density.
    if (!Number.isFinite(density) || density <= 0) {
        return null;
    }

    const bodyFat = 495 / density - 450;

    // Reject impossible results instead of displaying them.
    if (!Number.isFinite(bodyFat) || bodyFat <= 0 || bodyFat >= 100) {
        return null;
    }

    const rounded = Number(bodyFat.toFixed(2));

    // Rounding must not turn a boundary value into 0% or 100%.
    return rounded > 0 && rounded < 100 ? rounded : null;
}

// ============================================================
// EXPORT
// ============================================================

module.exports = {
    calculateAge,
    calculateBMI,
    getBMICategory,
    calculateHealthyWeightRange,
    calculateBodyFat
};