const profileService =
    require("../services/profileService");

const {
    isPositiveNumber,
    isValidId,
    numberOrNull
} = require("../utils/numberUtils");

const {
    calculateBMI,
    getBMICategory,
    calculateHealthyWeightRange,
    calculateBodyFat
} = require("../utils/healthCalculations");

// ============================================================
// HELPER: NORMALIZE PROFILE NUMBERS
// ============================================================

function normalizeProfile(profile) {
    return {
        ...profile,

        height_cm:
            numberOrNull(profile.height_cm),

        waist_cm:
            numberOrNull(profile.waist_cm),

        chest_cm:
            numberOrNull(profile.chest_cm),

        neck_cm:
            numberOrNull(profile.neck_cm),

        hip_cm:
            numberOrNull(profile.hip_cm),

        target_weight_kg:
            numberOrNull(
                profile.target_weight_kg
            ),

        current_weight_kg:
            numberOrNull(
                profile.current_weight_kg
            )
    };
}

// ============================================================
// CREATE PROFILE
// ============================================================

const createProfile = async (
    req,
    res,
    next
) => {
    try {
        const userId =
            Number(req.params.userId);

        const {
            profile_name,
            dob,
            gender,
            height_cm,
            waist_cm,
            chest_cm,
            neck_cm,
            hip_cm,
            current_weight_kg,
            target_weight_kg
        } = req.body;

        // Validate user ID
        if (!isValidId(userId)) {
            return res.status(400).json({
                error: "Invalid user ID"
            });
        }

        // Required fields
        if (
            !profile_name ||
            !dob ||
            !gender ||
            !isPositiveNumber(height_cm)
        ) {
            return res.status(400).json({
                error:
                    "Profile name, DOB, gender and height are required"
            });
        }

        // Normalize gender
        const normalizedGender =
            String(gender)
                .trim()
                .toLowerCase();

        // Validate gender
        if (
            ![
                "male",
                "female"
            ].includes(normalizedGender)
        ) {
            return res.status(400).json({
                error:
                    "Gender must be male or female"
            });
        }

        const height =
            Number(height_cm);

        const waist =
            numberOrNull(waist_cm);

        const chest =
            numberOrNull(chest_cm);

        const neck =
            numberOrNull(neck_cm);

        const hip =
            numberOrNull(hip_cm);

        const currentWeight =
            numberOrNull(
                current_weight_kg
            );

        const targetWeight =
            numberOrNull(
                target_weight_kg
            );

        let bmi = null;
        let bodyFat = null;

        // Calculate health values
        // only if current weight exists
        if (currentWeight !== null) {
            bmi =
                calculateBMI(
                    currentWeight,
                    height
                );

            bodyFat =
                calculateBodyFat(
                    normalizedGender,
                    height,
                    waist,
                    neck,
                    hip
                );
        }

        // Ask service to create profile
        const result =
            await profileService
                .createProfile({
                    userId,

                    profileName:
                        profile_name.trim(),

                    dob,

                    gender:
                        normalizedGender,

                    height,
                    waist,
                    chest,
                    neck,
                    hip,

                    currentWeight,
                    targetWeight,

                    bmi,
                    bodyFat
                });

        if (result.userNotFound) {
            return res.status(404).json({
                error:
                    "Main user not found"
            });
        }

        const weightRecord =
            result.weightRecord
                ? {
                    ...result.weightRecord,

                    bmi_category:
                        getBMICategory(
                            result
                                .weightRecord
                                .bmi
                        )
                }
                : null;

        return res.status(201).json({
            message:
                "Profile created successfully",

            profile_id:
                result.profileId,

            healthy_weight_range:
                calculateHealthyWeightRange(
                    height
                ),

            initial_weight_record:
                weightRecord
        });

    } catch (error) {
        next(error);
    }
};

// ============================================================
// GET ALL PROFILES OF USER
// ============================================================

const getProfilesByUser = async (
    req,
    res,
    next
) => {
    try {
        const userId =
            Number(req.params.userId);

        if (!isValidId(userId)) {
            return res.status(400).json({
                error: "Invalid user ID"
            });
        }

        const rows =
            await profileService
                .getProfilesByUser(
                    userId
                );

        const profiles =
            rows.map(normalizeProfile);

        return res.status(200).json(
            profiles
        );

    } catch (error) {
        next(error);
    }
};

// ============================================================
// GET ONE PROFILE
// ============================================================

const getProfile = async (
    req,
    res,
    next
) => {
    try {
        const profileId =
            Number(
                req.params.profileId
            );

        if (!isValidId(profileId)) {
            return res.status(400).json({
                error:
                    "Invalid profile ID"
            });
        }

        const result =
            await profileService
                .getProfileById(
                    profileId
                );

        if (!result) {
            return res.status(404).json({
                error:
                    "Profile not found"
            });
        }

        const profile =
            normalizeProfile(result);

        return res.status(200).json({
            ...profile,

            healthy_weight_range:
                calculateHealthyWeightRange(
                    profile.height_cm
                )
        });

    } catch (error) {
        next(error);
    }
};

// ============================================================
// UPDATE PROFILE
// ============================================================

const updateProfile = async (
    req,
    res,
    next
) => {
    try {
        const profileId =
            Number(
                req.params.profileId
            );

        if (!isValidId(profileId)) {
            return res.status(400).json({
                error:
                    "Invalid profile ID"
            });
        }

        const {
            profile_name,
            dob,
            gender,
            height_cm,
            waist_cm,
            chest_cm,
            neck_cm,
            hip_cm,
            target_weight_kg
        } = req.body;

        // Validate gender if supplied
        let normalizedGender = null;

        if (gender !== undefined) {
            normalizedGender =
                String(gender)
                    .trim()
                    .toLowerCase();

            if (
                ![
                    "male",
                    "female"
                ].includes(
                    normalizedGender
                )
            ) {
                return res
                    .status(400)
                    .json({
                        error:
                            "Gender must be male or female"
                    });
            }
        }

        // Validate height if supplied
        if (
            height_cm !== undefined &&
            !isPositiveNumber(height_cm)
        ) {
            return res.status(400).json({
                error:
                    "Height must be a positive number"
            });
        }

        // Update profile name
        if (profile_name !== undefined) {
            const cleanedName =
                String(profile_name)
                    .trim();

            if (!cleanedName) {
                return res
                    .status(400)
                    .json({
                        error:
                            "Profile name cannot be empty"
                    });
            }

            await profileService
                .updateProfileName(
                    profileId,
                    cleanedName
                );
        }

        // Update body profile
        await profileService
            .updateBodyProfile(
                profileId,
                {
                    dob:
                        dob || null,

                    gender:
                        normalizedGender,

                    height:
                        numberOrNull(
                            height_cm
                        ),

                    waist:
                        numberOrNull(
                            waist_cm
                        ),

                    chest:
                        numberOrNull(
                            chest_cm
                        ),

                    neck:
                        numberOrNull(
                            neck_cm
                        ),

                    hip:
                        numberOrNull(
                            hip_cm
                        ),

                    targetWeight:
                        numberOrNull(
                            target_weight_kg
                        )
                }
            );

        return res.status(200).json({
            message:
                "Profile updated successfully"
        });

    } catch (error) {
        next(error);
    }
};

// ============================================================
// DELETE PROFILE
// ============================================================

const deleteProfile = async (
    req,
    res,
    next
) => {
    try {
        const profileId =
            Number(
                req.params.profileId
            );

        if (!isValidId(profileId)) {
            return res.status(400).json({
                error:
                    "Invalid profile ID"
            });
        }

        const deleted =
            await profileService
                .deleteProfile(
                    profileId
                );

        if (!deleted) {
            return res.status(404).json({
                error:
                    "Profile not found"
            });
        }

        return res.status(200).json({
            message:
                "Profile deleted successfully"
        });

    } catch (error) {
        next(error);
    }
};

// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
    createProfile,
    getProfilesByUser,
    getProfile,
    updateProfile,
    deleteProfile
};