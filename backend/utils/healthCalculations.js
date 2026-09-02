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
    if (
        waistCm === null ||
        neckCm === null
    ) {
        return null;
    }

    const normalizedGender =
        String(gender)
            .toLowerCase();

    let bodyFat;

    if (
        normalizedGender === "male"
    ) {
        if (waistCm <= neckCm) {
            return null;
        }

        const density =
            1.0324 -
            0.19077 *
                Math.log10(
                    waistCm - neckCm
                ) +
            0.15456 *
                Math.log10(
                    heightCm
                );

        bodyFat =
            495 / density - 450;

    } else if (
        normalizedGender === "female"
    ) {
        if (
            hipCm === null ||
            waistCm + hipCm <= neckCm
        ) {
            return null;
        }

        const density =
            1.29579 -
            0.35004 *
                Math.log10(
                    waistCm +
                    hipCm -
                    neckCm
                ) +
            0.221 *
                Math.log10(
                    heightCm
                );

        bodyFat =
            495 / density - 450;

    } else {
        return null;
    }

    return roundToTwo(
        bodyFat
    );
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