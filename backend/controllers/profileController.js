const {
    isValidDateString
} = require("../utils/dateUtils");

const profileService =
    require("../services/profileService");

const {
    isPositiveNumber,
    isValidId,
    numberOrNull,
    positiveNumberOrNull
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
            numberOrNull(
                profile.height_cm
            ),

        waist_cm:
            numberOrNull(
                profile.waist_cm
            ),

        chest_cm:
            numberOrNull(
                profile.chest_cm
            ),

        neck_cm:
            numberOrNull(
                profile.neck_cm
            ),

        hip_cm:
            numberOrNull(
                profile.hip_cm
            ),

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
            Number(
                req.params.userId
            );

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
            target_weight_kg,
            activity_level
        } = req.body;
        const allowedActivityLevels = [
            "not_specified",
            "sedentary",
            "lightly_active",
            "moderately_active",
            "very_active",
            "extra_active"
        ];

        const normalizedActivityLevel =
            activity_level
                ? String(activity_level)
                    .trim()
                    .toLowerCase()
                : "not_specified";

        if (
            !allowedActivityLevels.includes(
                normalizedActivityLevel
            )
        ) {
            return res.status(400).json({
                error: "Invalid activity level"
            });
        }


        // ====================================================
        // VALIDATE USER ID
        // ====================================================

        if (!isValidId(userId)) {
            return res
                .status(400)
                .json({
                    error:
                        "Invalid user ID"
                });
        }


        // ====================================================
        // REQUIRED FIELDS
        // ====================================================

        if (
            !profile_name ||
            !dob ||
            !gender ||
            !isPositiveNumber(
                height_cm
            )
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Profile name, DOB, gender and height are required"
                });
        }


        // ====================================================
        // VALIDATE DOB
        // ====================================================

        if (
            !isValidDateString(
                dob
            )
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "DOB must be a valid date in YYYY-MM-DD format"
                });
        }


        // ====================================================
        // NORMALIZE GENDER
        // ====================================================

        const normalizedGender =
            String(gender)
                .trim()
                .toLowerCase();


        // ====================================================
        // VALIDATE GENDER
        // ====================================================

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
        // ====================================================
        // VALIDATE OPTIONAL MEASUREMENTS
        // ====================================================

        const measurements = {
            waist_cm,
            chest_cm,
            neck_cm,
            hip_cm,
            current_weight_kg,
            target_weight_kg
        };

        for (
            const [name, value]
            of Object.entries(measurements)
        ) {
            if (
                value !== undefined &&
                value !== null &&
                value !== "" &&
                !isPositiveNumber(value)
            ) {
                return res.status(400).json({
                    error:
                        `${name} must be a positive number`
                });
            }
        }


        // ====================================================
        // NORMALIZE NUMERIC VALUES
        // ====================================================

        const height =
            Number(height_cm);

        const waist =
            positiveNumberOrNull(
                waist_cm
            );

        const chest =
            positiveNumberOrNull(
                chest_cm
            );

        const neck =
            positiveNumberOrNull(
                neck_cm
            );

        const hip =
            positiveNumberOrNull(
                hip_cm
            );

        const currentWeight =
            positiveNumberOrNull(
                current_weight_kg
            );

        const targetWeight =
            positiveNumberOrNull(
                target_weight_kg
            );


        // ====================================================
        // CALCULATE HEALTH VALUES
        // ====================================================

        let bmi = null;
        let bodyFat = null;

        if (
            currentWeight !== null
        ) {
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


        // ====================================================
        // CREATE PROFILE
        // ====================================================

        const result =
            await profileService
                .createProfile({
                    userId,

                    profileName:
                        profile_name
                            .trim(),

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

                    bodyFat,
                    activityLevel:
                        normalizedActivityLevel
                });


        // ====================================================
        // USER NOT FOUND
        // ====================================================

        if (
            result.userNotFound
        ) {
            return res
                .status(404)
                .json({
                    error:
                        "Main user not found"
                });
        }


        // ====================================================
        // INITIAL WEIGHT RECORD
        // ====================================================

        const weightRecord =
            result.weightRecord
                ? {
                    ...result
                        .weightRecord,

                    bmi_category:
                        getBMICategory(
                            result
                                .weightRecord
                                .bmi,
                            dob
                        )
                }
                : null;


        // ====================================================
        // RESPONSE
        // ====================================================

        return res
            .status(201)
            .json({
                message:
                    "Profile created successfully",

                profile_id:
                    result.profileId,

                healthy_weight_range:
                    calculateHealthyWeightRange(
                        height,
                        dob
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
            Number(
                req.params.userId
            );

        if (!isValidId(userId)) {
            return res
                .status(400)
                .json({
                    error:
                        "Invalid user ID"
                });
        }

        const rows =
            await profileService
                .getProfilesByUser(
                    userId
                );

        const profiles =
            rows.map(
                normalizeProfile
            );

        return res
            .status(200)
            .json(
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
                req.params
                    .profileId
            );

        if (
            !isValidId(
                profileId
            )
        ) {
            return res
                .status(400)
                .json({
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
            return res
                .status(404)
                .json({
                    error:
                        "Profile not found"
                });
        }

        const profile =
            normalizeProfile(
                result
            );

        return res
            .status(200)
            .json({
                ...profile,

                healthy_weight_range:
                    calculateHealthyWeightRange(
                        profile.height_cm,
                        profile.dob
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
                req.params
                    .profileId
            );

        if (
            !isValidId(
                profileId
            )
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Invalid profile ID"
                });
        }
        // ====================================================
        // CHECK PROFILE EXISTS
        // ====================================================

        const existingProfile =
            await profileService
                .getProfileById(
                    profileId
                );

        if (!existingProfile) {
            return res
                .status(404)
                .json({
                    error:
                        "Profile not found"
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
            target_weight_kg,
            activity_level
        } = req.body;


        // ====================================================
        // VALIDATE DOB IF SUPPLIED
        // ====================================================
if (
    dob !== undefined &&
    (
        dob === "" ||
        !isValidDateString(
            dob
        )
    )
) {
    return res
        .status(400)
        .json({
            error:
                "DOB must be a valid date in YYYY-MM-DD format"
        });
}


        // ====================================================
        // VALIDATE GENDER IF SUPPLIED
        // ====================================================

        let normalizedGender =
            null;

        if (
            gender !== undefined
        ) {
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


        // ====================================================
        // VALIDATE HEIGHT IF SUPPLIED
        // ====================================================

        if (
            height_cm !==
            undefined &&
            !isPositiveNumber(
                height_cm
            )
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Height must be a positive number"
                });
        }
        // ====================================================
        // VALIDATE OPTIONAL MEASUREMENTS IF SUPPLIED
        // ====================================================

        const measurements = {
            waist_cm,
            chest_cm,
            neck_cm,
            hip_cm,
            target_weight_kg
        };

        for (
            const [name, value]
            of Object.entries(measurements)
        ) {
            if (
                value !== undefined &&
                value !== null &&
                value !== "" &&
                !isPositiveNumber(value)
            ) {
                return res.status(400).json({
                    error:
                        `${name} must be a positive number`
                });
            }
        }
        // ====================================================
        // VALIDATE ACTIVITY LEVEL IF SUPPLIED
        // ====================================================

        let normalizedActivityLevel = null;

        if (activity_level !== undefined) {
            normalizedActivityLevel =
                String(activity_level)
                    .trim()
                    .toLowerCase();

            const allowedActivityLevels = [
                "not_specified",
                "sedentary",
                "lightly_active",
                "moderately_active",
                "very_active",
                "extra_active"
            ];

            if (
                !allowedActivityLevels.includes(
                    normalizedActivityLevel
                )
            ) {
                return res.status(400).json({
                    error: "Invalid activity level"
                });
            }
        }



        // ====================================================
        // UPDATE PROFILE NAME
        // ====================================================

        if (
            profile_name !==
            undefined
        ) {
            const cleanedName =
                String(
                    profile_name
                ).trim();

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


        // ====================================================
        // PREPARE BODY PROFILE UPDATE
        // ====================================================
        const bodyProfile = {};

        if (activity_level !== undefined) {
            bodyProfile.activityLevel =
                normalizedActivityLevel;
        }
        if (
    dob !== undefined
) {
    bodyProfile.dob =
        dob;
}


        if (
            gender !== undefined
        ) {
            bodyProfile.gender =
                normalizedGender;
        }


        if (
            height_cm !==
            undefined
        ) {
            bodyProfile.height =
                Number(
                    height_cm
                );
        }


        if (
            waist_cm !==
            undefined
        ) {
            bodyProfile.waist =
                positiveNumberOrNull(
                    waist_cm
                );
        }


        if (
            chest_cm !==
            undefined
        ) {
            bodyProfile.chest =
                positiveNumberOrNull(
                    chest_cm
                );
        }


        if (
            neck_cm !==
            undefined
        ) {
            bodyProfile.neck =
                positiveNumberOrNull(
                    neck_cm
                );
        }


        if (
            hip_cm !==
            undefined
        ) {
            bodyProfile.hip =
                positiveNumberOrNull(
                    hip_cm
                );
        }


        if (
            target_weight_kg !==
            undefined
        ) {
            bodyProfile
                .targetWeight =
                positiveNumberOrNull(
                    target_weight_kg
                );
        }


        // ====================================================
        // UPDATE BODY PROFILE
        // ====================================================

        if (
            Object.keys(
                bodyProfile
            ).length > 0
        ) {
            await profileService
                .updateBodyProfile(
                    profileId,
                    bodyProfile
                );
        }


        return res
            .status(200)
            .json({
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
                req.params
                    .profileId
            );

        if (
            !isValidId(
                profileId
            )
        ) {
            return res
                .status(400)
                .json({
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
            return res
                .status(404)
                .json({
                    error:
                        "Profile not found"
                });
        }

        return res
            .status(200)
            .json({
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
