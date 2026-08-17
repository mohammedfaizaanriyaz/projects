// ============================================================
// ROUND TO TWO DECIMAL PLACES
// ============================================================

function roundToTwo(value) {
    return Number(
        Number(value).toFixed(2)
    );
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
// ============================================================

function getBMICategory(bmi) {
    if (bmi === null) {
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
// ============================================================

function calculateHealthyWeightRange(
    heightCm
) {
    const heightM =
        heightCm / 100;

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
    calculateBMI,
    getBMICategory,
    calculateHealthyWeightRange,
    calculateBodyFat
};