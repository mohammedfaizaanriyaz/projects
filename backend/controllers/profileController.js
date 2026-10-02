const profileService = require("../services/profileService");
const { numberOrNull } = require("../utils/numberUtils");

const {
    calculateBMI,
    getBMICategory,
    calculateHealthyWeightRange,
    calculateBodyFat
} = require("../utils/healthCalculations");

const ACTIVITY_LEVELS = [
    "not_specified",
    "sedentary",
    "lightly_active",
    "moderately_active",
    "very_active",
    "extra_active"
];

const OPTIONAL_MEASUREMENTS = {
    waist_cm: "waist",
    chest_cm: "chest",
    neck_cm: "neck",
    hip_cm: "hip",
    target_weight_kg: "targetWeight"
};

class ProfileValidationError extends Error {}

function invalid(message) {
    throw new ProfileValidationError(message);
}

function handleError(error, res, next) {
    if (error instanceof ProfileValidationError) {
        return res.status(400).json({ error: error.message });
    }

    return next(error);
}

function validateId(value, label) {
    const text = String(value ?? "");

    if (!/^\d+$/.test(text)) {
        invalid(`Invalid ${label}`);
    }

    const id = Number(text);

    if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) {
        invalid(`Invalid ${label}`);
    }

    return id;
}

function validateBody(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        invalid("Request body must be an object");
    }

    return body;
}

function validateName(value) {
    if (typeof value !== "string") {
        invalid("Profile name must be text");
    }

    const name = value.trim();

    if (!name) {
        invalid("Profile name cannot be empty");
    }

    if (Array.from(name).length > 100) {
        invalid("Profile name cannot exceed 100 characters");
    }

    return name;
}

function validateDob(value) {
    if (typeof value !== "string") {
        invalid("DOB must be a date in YYYY-MM-DD format");
    }

    const text = value.trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        invalid("DOB must be a date in YYYY-MM-DD format");
    }

    const date = new Date(`${text}T00:00:00.000Z`);

    if (
        Number.isNaN(date.getTime()) ||
        Number(text.slice(0, 4)) < 1000 ||
        date.toISOString().slice(0, 10) !== text
    ) {
        invalid("DOB must be a valid calendar date");
    }

    // Use the UTC calendar date consistently on the backend.
    const today = new Date().toISOString().slice(0, 10);

    if (text > today) {
        invalid("DOB cannot be in the future");
    }

    return text;
}

function validateChoice(value, choices, label) {
    if (typeof value !== "string") {
        invalid(`${label} must be text`);
    }

    const normalized = value.trim().toLowerCase();

    if (!choices.includes(normalized)) {
        invalid(`${label} must be one of: ${choices.join(", ")}`);
    }

    return normalized;
}

function validateMeasurement(value, label, optional = false) {
    const blank =
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "");

    if (blank) {
        if (optional) return null;
        invalid(`${label} is required`);
    }

    // Reject booleans, arrays and objects before Number() conversion.
    if (typeof value !== "number" && typeof value !== "string") {
        invalid(`${label} must be a number`);
    }

    const text = String(value).trim();

    // Accept ordinary decimal values with up to two decimal places.
    if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {
        invalid(`${label} must be a number with at most 2 decimal places`);
    }

    const number = Number(text);

    if (!Number.isFinite(number) || number < 0.01 || number > 999.99) {
        invalid(`${label} must be between 0.01 and 999.99`);
    }

    return number;
}

// Calculated values must also fit their DECIMAL(5,2) columns.
// Formula plausibility is a separate M6 fix.
function validateCalculatedValue(value, label) {
    if (value === null || value === undefined) return null;

    if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        Math.abs(value) > 999.99
    ) {
        invalid(`These measurements produce an unsupported ${label}`);
    }

    return value;
}

function validateProfileData(body, creating) {
    const input = validateBody(body);
    const data = {};

    if (creating || input.profile_name !== undefined) {
        data.profileName = validateName(input.profile_name);
    }

    if (creating || input.dob !== undefined) {
        data.dob = validateDob(input.dob);
    }

    if (creating || input.gender !== undefined) {
        data.gender = validateChoice(
            input.gender,
            ["male", "female"],
            "Gender"
        );
    }

    if (creating || input.height_cm !== undefined) {
        data.height = validateMeasurement(input.height_cm, "Height");
    }

    for (const [field, serviceKey] of Object.entries(OPTIONAL_MEASUREMENTS)) {
        if (creating || input[field] !== undefined) {
            data[serviceKey] = validateMeasurement(input[field], field, true);
        }
    }

    if (creating) {
        data.currentWeight = validateMeasurement(
            input.current_weight_kg,
            "Current weight",
            true
        );
    } else if (input.current_weight_kg !== undefined) {
        invalid("Use the weight-record form to update current weight");
    }

    if (creating && input.activity_level === undefined) {
        data.activityLevel = "not_specified";
    } else if (input.activity_level !== undefined) {
        data.activityLevel = validateChoice(
            input.activity_level,
            ACTIVITY_LEVELS,
            "Activity level"
        );
    }

    return data;
}

function normalizeProfile(profile) {
    const normalized = { ...profile };

    for (const field of [
        "height_cm",
        "waist_cm",
        "chest_cm",
        "neck_cm",
        "hip_cm",
        "target_weight_kg",
        "current_weight_kg"
    ]) {
        normalized[field] = numberOrNull(profile[field]);
    }

    return normalized;
}

// CREATE PROFILE
const createProfile = async (req, res, next) => {
    try {
        const userId = validateId(req.params.userId, "user ID");
        const data = validateProfileData(req.body, true);

        let bmi = null;
        let bodyFat = null;

        if (data.currentWeight !== null) {
            bmi = validateCalculatedValue(
                calculateBMI(data.currentWeight, data.height),
                "BMI"
            );

            bodyFat = validateCalculatedValue(
                calculateBodyFat(
                    data.gender,
                    data.height,
                    data.waist,
                    data.neck,
                    data.hip
                ),
                "body-fat value"
            );
        }

        const result = await profileService.createProfile({
            userId,
            ...data,
            bmi,
            bodyFat
        });

        if (result.userNotFound) {
            return res.status(404).json({
                error: "Main user not found"
            });
        }

        const weightRecord = result.weightRecord
            ? {
                ...result.weightRecord,
                bmi_category: getBMICategory(
                    result.weightRecord.bmi,
                    data.dob
                )
            }
            : null;

        return res.status(201).json({
            message: "Profile created successfully",
            profile_id: result.profileId,
            healthy_weight_range: calculateHealthyWeightRange(
                data.height,
                data.dob
            ),
            initial_weight_record: weightRecord
        });
    } catch (error) {
        return handleError(error, res, next);
    }
};

// GET ALL PROFILES OF USER
const getProfilesByUser = async (req, res, next) => {
    try {
        const userId = validateId(req.params.userId, "user ID");
        const rows = await profileService.getProfilesByUser(userId);

        return res.status(200).json(rows.map(normalizeProfile));
    } catch (error) {
        return handleError(error, res, next);
    }
};

// GET ONE PROFILE
const getProfile = async (req, res, next) => {
    try {
        const profileId = validateId(req.params.profileId, "profile ID");
        const result = await profileService.getProfileById(profileId);

        if (!result) {
            return res.status(404).json({
                error: "Profile not found"
            });
        }

        const profile = normalizeProfile(result);

        return res.status(200).json({
            ...profile,
            healthy_weight_range: calculateHealthyWeightRange(
                profile.height_cm,
                profile.dob
            )
        });
    } catch (error) {
        return handleError(error, res, next);
    }
};

// UPDATE PROFILE
const updateProfile = async (req, res, next) => {
    try {
        const profileId = validateId(req.params.profileId, "profile ID");
        const data = validateProfileData(req.body, false);

        const existingProfile = await profileService.getProfileById(
            profileId
        );

        if (!existingProfile) {
            return res.status(404).json({
                error: "Profile not found"
            });
        }

        const { profileName, ...bodyProfile } = data;

        await profileService.updateProfileTransaction({
            profileId,
            profileName,
            bodyProfile
        });

        return res.status(200).json({
            message: "Profile updated successfully"
        });
    } catch (error) {
        return handleError(error, res, next);
    }
};

// DELETE PROFILE
const deleteProfile = async (req, res, next) => {
    try {
        const profileId = validateId(req.params.profileId, "profile ID");
        const deleted = await profileService.deleteProfile(profileId);

        if (!deleted) {
            return res.status(404).json({
                error: "Profile not found"
            });
        }

        return res.status(200).json({
            message: "Profile deleted successfully"
        });
    } catch (error) {
        return handleError(error, res, next);
    }
};

module.exports = {
    createProfile,
    getProfilesByUser,
    getProfile,
    updateProfile,
    deleteProfile
};