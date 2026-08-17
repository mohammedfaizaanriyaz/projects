const weightService =
    require("../services/weightService");

const {
    isPositiveNumber,
    isValidId,
    numberOrNull,
    newOrExisting
} = require("../utils/numberUtils");

const {
    calculateBMI,
    getBMICategory,
    calculateBodyFat
} = require("../utils/healthCalculations");

// ============================================================
// CREATE WEIGHT RECORD
// ============================================================

const createWeightRecord = async (
    req,
    res,
    next
) => {
    try {
        const profileId =
            Number(req.params.profileId);

        const {
            weight_kg,
            waist_cm,
            chest_cm,
            neck_cm,
            hip_cm,
            recorded_date
        } = req.body;

        // Validate profile ID
        if (!isValidId(profileId)) {
            return res.status(400).json({
                error: "Invalid profile ID"
            });
        }

        // Validate weight
        if (!isPositiveNumber(weight_kg)) {
            return res.status(400).json({
                error:
                    "Valid weight is required"
            });
        }

        // Get existing body profile
        const profile =
            await weightService
                .getBodyProfile(profileId);

        if (!profile) {
            return res.status(404).json({
                error: "Profile not found"
            });
        }

        const height =
            Number(profile.height_cm);

        const weight =
            Number(weight_kg);

        // Use new measurement if supplied.
        // Otherwise use existing value.
        const waist =
            newOrExisting(
                waist_cm,
                profile.waist_cm
            );

        const chest =
            newOrExisting(
                chest_cm,
                profile.chest_cm
            );

        const neck =
            newOrExisting(
                neck_cm,
                profile.neck_cm
            );

        const hip =
            newOrExisting(
                hip_cm,
                profile.hip_cm
            );

        // Calculate BMI
        const bmi =
            calculateBMI(
                weight,
                height
            );

        // Calculate body fat
        const bodyFat =
            calculateBodyFat(
                profile.gender,
                height,
                waist,
                neck,
                hip
            );

        // Save measurements and weight
        const weightId =
            await weightService
                .saveWeightRecord({
                    profileId,
                    weight,
                    bmi,
                    bodyFat,
                    waist,
                    chest,
                    neck,
                    hip,
                    recordedDate:
                        recorded_date || null
                });

        return res.status(201).json({
            message:
                "Weight recorded successfully",

            record: {
                weight_id:
                    weightId,

                profile_id:
                    profileId,

                weight_kg:
                    weight,

                bmi,

                bmi_category:
                    getBMICategory(bmi),

                body_fat_percentage:
                    bodyFat,

                recorded_date:
                    recorded_date ||
                    new Date()
                        .toISOString()
                        .slice(0, 10)
            }
        });

    } catch (error) {
        next(error);
    }
};

// ============================================================
// GET WEIGHT HISTORY
// ============================================================

const getWeightHistory = async (
    req,
    res,
    next
) => {
    try {
        const profileId =
            Number(req.params.profileId);

        // Validate profile ID
        if (!isValidId(profileId)) {
            return res.status(400).json({
                error: "Invalid profile ID"
            });
        }

        const rows =
            await weightService
                .getWeightHistory(profileId);

        const records =
            rows.map((row) => ({
                ...row,

                weight_kg:
                    Number(row.weight_kg),

                bmi:
                    numberOrNull(row.bmi),

                body_fat_percentage:
                    numberOrNull(
                        row.body_fat_percentage
                    ),

                bmi_category:
                    row.bmi !== null
                        ? getBMICategory(
                            Number(row.bmi)
                        )
                        : null
            }));

        return res.status(200).json(
            records
        );

    } catch (error) {
        next(error);
    }
};

// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
    createWeightRecord,
    getWeightHistory
};