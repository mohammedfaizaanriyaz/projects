const express = require("express");
const cors = require("cors");
const pool = require("./db");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const asyncHandler = (handler) => (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
};

function roundToTwo(value) {
    return Number(Number(value).toFixed(2));
}

function isPositiveNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0;
}

function isValidId(value) {
    return Number.isInteger(value) && value > 0;
}

function numberOrNull(value) {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    return Number(value);
}

function calculateBMI(weightKg, heightCm) {
    const heightM = heightCm / 100;

    if (heightM <= 0) {
        return null;
    }

    return roundToTwo(weightKg / (heightM * heightM));
}

function getBMICategory(bmi) {
    if (bmi === null) return null;
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";

    return "Obesity";
}

function calculateHealthyWeightRange(heightCm) {
    const heightM = heightCm / 100;

    return {
        minimum_kg: roundToTwo(18.5 * heightM * heightM),
        maximum_kg: roundToTwo(24.9 * heightM * heightM)
    };
}

// U.S. Navy body-fat formula
function calculateBodyFat(
    gender,
    heightCm,
    waistCm,
    neckCm,
    hipCm
) {
    if (waistCm === null || neckCm === null) {
        return null;
    }

    const normalizedGender = String(gender).toLowerCase();

    let bodyFat;

    if (normalizedGender === "male") {
        if (waistCm <= neckCm) {
            return null;
        }

        const density =
            1.0324 -
            0.19077 * Math.log10(waistCm - neckCm) +
            0.15456 * Math.log10(heightCm);

        bodyFat = 495 / density - 450;

    } else if (normalizedGender === "female") {
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
                    waistCm + hipCm - neckCm
                ) +
            0.221 * Math.log10(heightCm);

        bodyFat = 495 / density - 450;

    } else {
        return null;
    }

    return roundToTwo(bodyFat);
}

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
            numberOrNull(profile.target_weight_kg),

        current_weight_kg:
            numberOrNull(profile.current_weight_kg)
    };
}

// ============================================================
// TEST ROUTE
// ============================================================

app.get("/", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "Weight Tracker backend is working"
    });
});

// ============================================================
// DATABASE HEALTH CHECK
// ============================================================

app.get(
    "/api/health",

    asyncHandler(async (req, res) => {
        await pool.query(
            "SELECT 1 AS database_test"
        );

        res.status(200).json({
            backend: "working",
            database: "connected"
        });
    })
);

// ============================================================
// USER ROUTES
// ============================================================

// ------------------------------------------------------------
// CREATE MAIN USER
// ------------------------------------------------------------

app.post(
    "/api/users",

    asyncHandler(async (req, res) => {
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                error: "Name is required"
            });
        }

        const result = await pool.query(
            `
            INSERT INTO users (name)
            VALUES (?)
            `,
            [name.trim()]
        );

        res.status(201).json({
            message: "User created successfully",
            user_id: Number(result.insertId)
        });
    })
);

// ------------------------------------------------------------
// GET MAIN USER
// ------------------------------------------------------------

app.get(
    "/api/users/:userId",

    asyncHandler(async (req, res) => {
        const userId =
            Number(req.params.userId);

        if (!isValidId(userId)) {
            return res.status(400).json({
                error: "Invalid user ID"
            });
        }

        const rows = await pool.query(
            `
            SELECT
                user_id,
                name,
                created_at
            FROM users
            WHERE user_id = ?
            `,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        res.json(rows[0]);
    })
);

// ============================================================
// PROFILE ROUTES
// ============================================================

// ------------------------------------------------------------
// CREATE PROFILE
// ------------------------------------------------------------

app.post(
    "/api/users/:userId/profiles",

    async (req, res, next) => {
        let connection;

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

            if (!isValidId(userId)) {
                return res.status(400).json({
                    error: "Invalid user ID"
                });
            }

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

            const normalizedGender =
                gender.trim().toLowerCase();

            if (
                !["male", "female"].includes(
                    normalizedGender
                )
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

            const targetWeight =
                numberOrNull(target_weight_kg);

            const currentWeight =
                numberOrNull(current_weight_kg);

            connection =
                await pool.getConnection();

            await connection.beginTransaction();

            // Check parent user
            const userRows =
                await connection.query(
                    `
                    SELECT user_id
                    FROM users
                    WHERE user_id = ?
                    `,
                    [userId]
                );

            if (userRows.length === 0) {
                await connection.rollback();

                return res.status(404).json({
                    error: "Main user not found"
                });
            }

            // Create profile
            const profileResult =
                await connection.query(
                    `
                    INSERT INTO profiles
                    (
                        user_id,
                        profile_name
                    )
                    VALUES (?, ?)
                    `,
                    [
                        userId,
                        profile_name.trim()
                    ]
                );

            const profileId =
                Number(
                    profileResult.insertId
                );

            // Create body profile
            await connection.query(
                `
                INSERT INTO body_profile
                (
                    profile_id,
                    dob,
                    gender,
                    height_cm,
                    waist_cm,
                    chest_cm,
                    neck_cm,
                    hip_cm,
                    target_weight_kg
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    profileId,
                    dob,
                    normalizedGender,
                    height,
                    waist,
                    chest,
                    neck,
                    hip,
                    targetWeight
                ]
            );

            let weightRecord = null;

            // Save initial weight if provided
            if (currentWeight !== null) {
                const bmi =
                    calculateBMI(
                        currentWeight,
                        height
                    );

                const bodyFat =
                    calculateBodyFat(
                        normalizedGender,
                        height,
                        waist,
                        neck,
                        hip
                    );

                const weightResult =
                    await connection.query(
                        `
                        INSERT INTO weight_records
                        (
                            profile_id,
                            weight_kg,
                            bmi,
                            body_fat_percentage,
                            recorded_date
                        )
                        VALUES (?, ?, ?, ?, CURDATE())
                        `,
                        [
                            profileId,
                            currentWeight,
                            bmi,
                            bodyFat
                        ]
                    );

                weightRecord = {
                    weight_id:
                        Number(
                            weightResult.insertId
                        ),

                    weight_kg:
                        currentWeight,

                    bmi,

                    bmi_category:
                        getBMICategory(bmi),

                    body_fat_percentage:
                        bodyFat
                };
            }

            await connection.commit();

            res.status(201).json({
                message:
                    "Profile created successfully",

                profile_id:
                    profileId,

                healthy_weight_range:
                    calculateHealthyWeightRange(
                        height
                    ),

                initial_weight_record:
                    weightRecord
            });

        } catch (error) {

            if (connection) {
                try {
                    await connection.rollback();
                } catch {
                    // Ignore rollback failure
                }
            }

            next(error);

        } finally {

            if (connection) {
                connection.release();
            }
        }
    }
);

// ------------------------------------------------------------
// GET ALL PROFILES OF ONE USER
// ------------------------------------------------------------

app.get(
    "/api/users/:userId/profiles",

    asyncHandler(async (req, res) => {
        const userId =
            Number(req.params.userId);

        if (!isValidId(userId)) {
            return res.status(400).json({
                error: "Invalid user ID"
            });
        }

        const rows = await pool.query(
            `
            SELECT
                p.profile_id,
                p.user_id,
                p.profile_name,
                p.created_at,

                bp.dob,
                bp.gender,
                bp.height_cm,
                bp.waist_cm,
                bp.chest_cm,
                bp.neck_cm,
                bp.hip_cm,
                bp.target_weight_kg,

                (
                    SELECT wr.weight_kg
                    FROM weight_records wr

                    WHERE
                        wr.profile_id =
                        p.profile_id

                    ORDER BY
                        wr.recorded_date DESC,
                        wr.weight_id DESC

                    LIMIT 1
                ) AS current_weight_kg

            FROM profiles p

            LEFT JOIN body_profile bp
                ON p.profile_id =
                   bp.profile_id

            WHERE
                p.user_id = ?

            ORDER BY
                p.created_at ASC
            `,
            [userId]
        );

        const profiles =
            rows.map(normalizeProfile);

        res.json(profiles);
    })
);

// ------------------------------------------------------------
// GET ONE PROFILE
// ------------------------------------------------------------

app.get(
    "/api/profiles/:profileId",

    asyncHandler(async (req, res) => {
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

        const rows =
            await pool.query(
                `
                SELECT
                    p.profile_id,
                    p.user_id,
                    p.profile_name,

                    bp.dob,
                    bp.gender,
                    bp.height_cm,
                    bp.waist_cm,
                    bp.chest_cm,
                    bp.neck_cm,
                    bp.hip_cm,
                    bp.target_weight_kg

                FROM profiles p

                JOIN body_profile bp
                    ON p.profile_id =
                       bp.profile_id

                WHERE
                    p.profile_id = ?
                `,
                [profileId]
            );

        if (rows.length === 0) {
            return res.status(404).json({
                error:
                    "Profile not found"
            });
        }

        const profile =
            normalizeProfile(
                rows[0]
            );

        const height =
            Number(
                profile.height_cm
            );

        res.json({
            ...profile,

            healthy_weight_range:
                calculateHealthyWeightRange(
                    height
                )
        });
    })
);

// ------------------------------------------------------------
// UPDATE BODY PROFILE
// ------------------------------------------------------------

app.put(
    "/api/profiles/:profileId",

    asyncHandler(async (req, res) => {
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

        if (profile_name) {
            await pool.query(
                `
                UPDATE profiles
                SET profile_name = ?
                WHERE profile_id = ?
                `,
                [
                    profile_name.trim(),
                    profileId
                ]
            );
        }

        await pool.query(
            `
            UPDATE body_profile

            SET
                dob =
                    COALESCE(?, dob),

                gender =
                    COALESCE(?, gender),

                height_cm =
                    COALESCE(?, height_cm),

                waist_cm =
                    COALESCE(?, waist_cm),

                chest_cm =
                    COALESCE(?, chest_cm),

                neck_cm =
                    COALESCE(?, neck_cm),

                hip_cm =
                    COALESCE(?, hip_cm),

                target_weight_kg =
                    COALESCE(
                        ?,
                        target_weight_kg
                    )

            WHERE
                profile_id = ?
            `,
            [
                dob || null,

                gender
                    ? gender
                        .trim()
                        .toLowerCase()
                    : null,

                numberOrNull(height_cm),
                numberOrNull(waist_cm),
                numberOrNull(chest_cm),
                numberOrNull(neck_cm),
                numberOrNull(hip_cm),
                numberOrNull(
                    target_weight_kg
                ),

                profileId
            ]
        );

        res.json({
            message:
                "Profile updated successfully"
        });
    })
);

// ============================================================
// WEIGHT RECORD ROUTES
// ============================================================

// ------------------------------------------------------------
// ADD NEW WEIGHT
// ------------------------------------------------------------

app.post(
    "/api/profiles/:profileId/weight-records",

    asyncHandler(async (req, res) => {
        const profileId =
            Number(
                req.params.profileId
            );

        const {
            weight_kg,
            waist_cm,
            chest_cm,
            neck_cm,
            hip_cm,
            recorded_date
        } = req.body;

        if (!isValidId(profileId)) {
            return res.status(400).json({
                error:
                    "Invalid profile ID"
            });
        }

        if (
            !isPositiveNumber(
                weight_kg
            )
        ) {
            return res.status(400).json({
                error:
                    "Valid weight is required"
            });
        }

        const profileRows =
            await pool.query(
                `
                SELECT
                    gender,
                    height_cm,
                    waist_cm,
                    chest_cm,
                    neck_cm,
                    hip_cm

                FROM body_profile

                WHERE
                    profile_id = ?
                `,
                [profileId]
            );

        if (
            profileRows.length === 0
        ) {
            return res.status(404).json({
                error:
                    "Profile not found"
            });
        }

        const profile =
            profileRows[0];

        const height =
            Number(
                profile.height_cm
            );

        const weight =
            Number(weight_kg);

        const waist =
            waist_cm !== undefined &&
            waist_cm !== ""
                ? Number(waist_cm)
                : numberOrNull(
                    profile.waist_cm
                );

        const chest =
            chest_cm !== undefined &&
            chest_cm !== ""
                ? Number(chest_cm)
                : numberOrNull(
                    profile.chest_cm
                );

        const neck =
            neck_cm !== undefined &&
            neck_cm !== ""
                ? Number(neck_cm)
                : numberOrNull(
                    profile.neck_cm
                );

        const hip =
            hip_cm !== undefined &&
            hip_cm !== ""
                ? Number(hip_cm)
                : numberOrNull(
                    profile.hip_cm
                );

        const bmi =
            calculateBMI(
                weight,
                height
            );

        const bodyFat =
            calculateBodyFat(
                profile.gender,
                height,
                waist,
                neck,
                hip
            );

        // Update latest measurements
        await pool.query(
            `
            UPDATE body_profile

            SET
                waist_cm = ?,
                chest_cm = ?,
                neck_cm = ?,
                hip_cm = ?

            WHERE
                profile_id = ?
            `,
            [
                waist,
                chest,
                neck,
                hip,
                profileId
            ]
        );

        // Insert new weight
        const result =
            await pool.query(
                `
                INSERT INTO weight_records
                (
                    profile_id,
                    weight_kg,
                    bmi,
                    body_fat_percentage,
                    recorded_date
                )

                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?,
                    COALESCE(
                        ?,
                        CURDATE()
                    )
                )
                `,
                [
                    profileId,
                    weight,
                    bmi,
                    bodyFat,
                    recorded_date || null
                ]
            );

        res.status(201).json({
            message:
                "Weight recorded successfully",

            record: {

                weight_id:
                    Number(
                        result.insertId
                    ),

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
    })
);

// ------------------------------------------------------------
// GET WEIGHT HISTORY
// Used by React line graph
// ------------------------------------------------------------

app.get(
    "/api/profiles/:profileId/weight-records",

    asyncHandler(async (req, res) => {
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

        const rows =
            await pool.query(
                `
                SELECT
                    weight_id,
                    profile_id,
                    weight_kg,
                    bmi,
                    body_fat_percentage,
                    recorded_date,
                    created_at

                FROM weight_records

                WHERE
                    profile_id = ?

                ORDER BY
                    recorded_date ASC,
                    weight_id ASC
                `,
                [profileId]
            );

        const records =
            rows.map((row) => ({

                ...row,

                weight_kg:
                    Number(
                        row.weight_kg
                    ),

                bmi:
                    numberOrNull(
                        row.bmi
                    ),

                body_fat_percentage:
                    numberOrNull(
                        row.body_fat_percentage
                    ),

                bmi_category:
                    row.bmi !== null
                        ? getBMICategory(
                            Number(
                                row.bmi
                            )
                        )
                        : null
            }));

        res.json(records);
    })
);

// ============================================================
// DELETE PROFILE
// ============================================================

app.delete(
    "/api/profiles/:profileId",

    asyncHandler(async (req, res) => {
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
            await pool.query(
                `
                DELETE FROM profiles
                WHERE profile_id = ?
                `,
                [profileId]
            );

        if (
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                error:
                    "Profile not found"
            });
        }

        res.json({
            message:
                "Profile deleted successfully"
        });
    })
);

// ============================================================
// 404 ROUTE
// ============================================================

app.use((req, res) => {
    res.status(404).json({
        error:
            "API route not found"
    });
});

// ============================================================
// ERROR HANDLER
// IMPORTANT: Error middleware must be after all routes
// ============================================================

app.use(errorHandler);

// ============================================================
// START SERVER
// ============================================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {
        console.log(
            `Weight Tracker server running at http://localhost:${PORT}`
        );

        console.log(
            `Health check: http://localhost:${PORT}/api/health`
        );
    }
);