const weightService = require("../services/weightService");
const { numberOrNull } = require("../utils/numberUtils");

const {
    calculateBMI,
    getBMICategory,
    calculateBodyFat
} = require("../utils/healthCalculations");

class WeightValidationError extends Error {}

function invalid(message) {
    throw new WeightValidationError(message);
}

function handleError(error, res, next) {
    if (error instanceof WeightValidationError) {
        return res.status(400).json({ error: error.message });
    }

    return next(error);
}

function validateProfileId(value) {
    const text = String(value ?? "");

    if (!/^\d+$/.test(text)) {
        invalid("Invalid profile ID");
    }

    const id = Number(text);

    if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) {
        invalid("Invalid profile ID");
    }

    return id;
}

function validateMeasurement(value, label, optional = false) {
    const blank =
        value === undefined ||
        value === null ||
        (
            typeof value === "string" &&
            value.trim() === ""
        );

    if (blank) {
        if (optional) return null;
        invalid(`${label} is required`);
    }

    if (typeof value !== "number" && typeof value !== "string") {
        invalid(`${label} must be a number`);
    }

    const text = String(value).trim();

    if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {
        invalid(`${label} must have at most 2 decimal places`);
    }

    const number = Number(text);

    if (!Number.isFinite(number) || number < 0.01 || number > 999.99) {
        invalid(`${label} must be between 0.01 and 999.99`);
    }

    return number;
}

function validateRecordedDate(value) {
    if (value === undefined || value === null || value === "") {
        return new Date().toISOString().slice(0, 10);
    }

    if (typeof value !== "string") {
        invalid("Recorded date must be a YYYY-MM-DD date");
    }

    const text = value.trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        invalid("Recorded date must be a YYYY-MM-DD date");
    }

    const date = new Date(`${text}T00:00:00.000Z`);

    if (
        Number.isNaN(date.getTime()) ||
        Number(text.slice(0, 4)) < 1000 ||
        date.toISOString().slice(0, 10) !== text
    ) {
        invalid("Recorded date must be a valid calendar date");
    }

    return text;
}

function storedCalculation(value) {
    if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value <= 0 ||
        value > 999.99
    ) {
        return null;
    }

    return value;
}

// CREATE WEIGHT RECORD
const createWeightRecord = async (req, res, next) => {
    try {
        const profileId = validateProfileId(req.params.profileId);

        if (
            !req.body ||
            typeof req.body !== "object" ||
            Array.isArray(req.body)
        ) {
            invalid("Request body must be an object");
        }

        const {
            weight_kg,
            waist_cm,
            chest_cm,
            neck_cm,
            hip_cm,
            recorded_date
        } = req.body;

        const recordedDate = validateRecordedDate(recorded_date);
        const weight = validateMeasurement(weight_kg, "Weight");

        // Use only measurements supplied for this entry.
        // Do not substitute today's measurements into an old entry.
        const waist = validateMeasurement(waist_cm, "Waist", true);
        const neck = validateMeasurement(neck_cm, "Neck", true);
        const hip = validateMeasurement(hip_cm, "Hip", true);

        // Kept for compatibility with the existing form.
        // Chest is not used by the body-fat formula.
        validateMeasurement(chest_cm, "Chest", true);

        const profile = await weightService.getBodyProfile(profileId);

        if (!profile) {
            return res.status(404).json({
                error: "Profile not found"
            });
        }

        const height = numberOrNull(profile.height_cm);

        // The current schema has no historical height snapshot.
        const bmi = height !== null && height > 0
            ? storedCalculation(calculateBMI(weight, height))
            : null;

        const bodyFat = height !== null && height > 0
            ? storedCalculation(
                calculateBodyFat(
                    profile.gender,
                    height,
                    waist,
                    neck,
                    hip
                )
            )
            : null;

        const weightId = await weightService.saveWeightRecord({
            profileId,
            weight,
            bmi,
            bodyFat,
            recordedDate
        });

        return res.status(201).json({
            message:
                "Weight recorded. Current body measurements were not changed.",
            record: {
                weight_id: weightId,
                profile_id: profileId,
                weight_kg: weight,
                bmi,
                bmi_category: bmi === null
                    ? null
                    : getBMICategory(bmi, profile.dob, recordedDate),
                body_fat_percentage: bodyFat,
                recorded_date: recordedDate
            }
        });
    } catch (error) {
        return handleError(error, res, next);
    }
};

// GET WEIGHT HISTORY
const getWeightHistory = async (req, res, next) => {
    try {
        const profileId = validateProfileId(req.params.profileId);
        const rows = await weightService.getWeightHistory(profileId);

        const records = rows.map((row) => {
            const { dob, ...record } = row;
            const bmi = numberOrNull(row.bmi);

            return {
                ...record,
                weight_kg: Number(row.weight_kg),
                bmi,
                body_fat_percentage: numberOrNull(
                    row.body_fat_percentage
                ),
                bmi_category: bmi === null
                    ? null
                    : getBMICategory(bmi, dob, row.recorded_date)
            };
        });

        return res.status(200).json(records);
    } catch (error) {
        return handleError(error, res, next);
    }
};

module.exports = {
    createWeightRecord,
    getWeightHistory
};