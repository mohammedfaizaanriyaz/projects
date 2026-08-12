const express = require("express");
const cors = require("cors");
const pool = require("./db");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;


// =========================================
// CALCULATION FUNCTIONS
// =========================================

// Round a number to two decimal places
function roundToTwo(value) {
    return Number(value.toFixed(2));
}


// Calculate BMI
function calculateBMI(weightKg, heightCm) {
    const heightMetres = heightCm / 100;

    return roundToTwo(
        weightKg / (heightMetres * heightMetres)
    );
}


// Return BMI category
function getBMICategory(bmi) {
    if (bmi < 18.5) {
        return "Underweight";
    }

    if (bmi < 25) {
        return "Normal weight";
    }

    if (bmi < 30) {
        return "Overweight";
    }

    return "Obesity";
}


// Estimate body-fat percentage using U.S. Navy method
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

    let bodyFat;

    if (gender === "male") {
        if (waistCm <= neckCm) {
            return null;
        }

        const density =
            1.0324 -
            0.19077 * Math.log10(waistCm - neckCm) +
            0.15456 * Math.log10(heightCm);

        bodyFat = 495 / density - 450;
    } else {
        if (
            hipCm === null ||
            waistCm + hipCm <= neckCm
        ) {
            return null;
        }

        const density =
            1.29579 -
            0.35004 *
                Math.log10(waistCm + hipCm - neckCm) +
            0.22100 * Math.log10(heightCm);

        bodyFat = 495 / density - 450;
    }

    return roundToTwo(bodyFat);
}


// Add calculated results to a weight entry
function addCalculations(entry) {
    const weightKg = Number(entry.weight_kg);
    const heightCm = Number(entry.height_cm);

    const waistCm =
        entry.waist_cm !== null
            ? Number(entry.waist_cm)
            : null;

    const neckCm =
        entry.neck_cm !== null
            ? Number(entry.neck_cm)
            : null;

    const hipCm =
        entry.hip_cm !== null
            ? Number(entry.hip_cm)
            : null;

    const bmi = calculateBMI(weightKg, heightCm);

    const bodyFatPercentage = calculateBodyFat(
        entry.gender,
        heightCm,
        waistCm,
        neckCm,
        hipCm
    );

    let fatMassKg = null;
    let leanMassKg = null;

    if (bodyFatPercentage !== null) {
        fatMassKg = roundToTwo(
            weightKg * (bodyFatPercentage / 100)
        );

        leanMassKg = roundToTwo(
            weightKg - fatMassKg
        );
    }

    return {
        id: entry.id,
        user_id: entry.user_id,
        weight_kg: weightKg,
        waist_cm: waistCm,
        neck_cm: neckCm,
        hip_cm: hipCm,
        recorded_at: entry.recorded_at,
        note: entry.note,
        bmi: bmi,
        bmi_category: getBMICategory(bmi),
        body_fat_percentage: bodyFatPercentage,
        fat_mass_kg: fatMassKg,
        lean_mass_kg: leanMassKg
    };
}


// =========================================
// TEST ROUTE
// =========================================

app.get("/", (req, res) => {
    res.send("Node + Express server is working");
});


// =========================================
// MESSAGE ROUTES
// =========================================

// Get all messages
app.get("/api/messages", async (req, res) => {
    try {
        const rows = await pool.query(
            "SELECT * FROM messages"
        );

        console.log("GET messages request received");

        res.json(rows);
    } catch (error) {
        console.error("GET MESSAGES ERROR:", error);

        res.status(500).json({
            error: "Failed to get messages"
        });
    }
});


// Save a message
app.post("/api/messages", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                error: "Message is required"
            });
        }

        const result = await pool.query(
            "INSERT INTO messages (message) VALUES (?)",
            [message.trim()]
        );

        res.status(201).json({
            message: "Message saved successfully",
            id: Number(result.insertId)
        });
    } catch (error) {
        console.error("POST MESSAGE ERROR:", error);

        res.status(500).json({
            error: "Failed to save message"
        });
    }
});


// =========================================
// USER ROUTES
// =========================================

// Create a user profile
app.post("/api/users", async (req, res) => {
    try {
        const {
            name,
            date_of_birth,
            gender,
            height_cm
        } = req.body;

        if (
            !name ||
            !date_of_birth ||
            !gender ||
            height_cm === undefined
        ) {
            return res.status(400).json({
                error:
                    "Name, date of birth, gender and height are required"
            });
        }

        const normalizedGender = gender.toLowerCase();

        if (
            !["male", "female"].includes(normalizedGender)
        ) {
            return res.status(400).json({
                error: "Gender must be male or female"
            });
        }

        const height = Number(height_cm);

        if (!Number.isFinite(height) || height <= 0) {
            return res.status(400).json({
                error:
                    "Height must be a valid positive number"
            });
        }

        const result = await pool.query(
            `INSERT INTO users
                (
                    name,
                    date_of_birth,
                    gender,
                    height_cm
                )
             VALUES (?, ?, ?, ?)`,
            [
                name.trim(),
                date_of_birth,
                normalizedGender,
                height
            ]
        );

        res.status(201).json({
            message: "User profile created successfully",
            user_id: Number(result.insertId)
        });
    } catch (error) {
        console.error("CREATE USER ERROR:", error);

        res.status(500).json({
            error: "Failed to create user profile"
        });
    }
});


// Get one user by ID
app.get("/api/users/:id", async (req, res) => {
    try {
        const userId = Number(req.params.id);

        if (
            !Number.isInteger(userId) ||
            userId <= 0
        ) {
            return res.status(400).json({
                error: "Invalid user ID"
            });
        }

        const rows = await pool.query(
            `SELECT
                id,
                name,
                DATE_FORMAT(
                    date_of_birth,
                    '%d/%m/%Y'
                ) AS date_of_birth,
                gender,
                height_cm,
                created_at,
                updated_at
             FROM users
             WHERE id = ?`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        const user = rows[0];

        res.json({
            ...user,
            height_cm: Number(user.height_cm)
        });
    } catch (error) {
        console.error("GET USER ERROR:", error);

        res.status(500).json({
            error: "Failed to get user profile"
        });
    }
});


// =========================================
// WEIGHT ENTRY ROUTES
// =========================================

// Create a weight entry
app.post(
    "/api/users/:userId/weight-entries",
    async (req, res) => {
        try {
            const userId = Number(req.params.userId);

            const {
                weight_kg,
                waist_cm,
                neck_cm,
                hip_cm,
                recorded_at,
                note
            } = req.body;

            if (
                !Number.isInteger(userId) ||
                userId <= 0
            ) {
                return res.status(400).json({
                    error: "Invalid user ID"
                });
            }

            const weight = Number(weight_kg);

            if (
                !Number.isFinite(weight) ||
                weight <= 0
            ) {
                return res.status(400).json({
                    error:
                        "Weight must be a valid positive number"
                });
            }

            const userRows = await pool.query(
                "SELECT id FROM users WHERE id = ?",
                [userId]
            );

            if (userRows.length === 0) {
                return res.status(404).json({
                    error: "User not found"
                });
            }

            const waist =
                waist_cm !== undefined &&
                waist_cm !== null &&
                waist_cm !== ""
                    ? Number(waist_cm)
                    : null;

            const neck =
                neck_cm !== undefined &&
                neck_cm !== null &&
                neck_cm !== ""
                    ? Number(neck_cm)
                    : null;

            const hip =
                hip_cm !== undefined &&
                hip_cm !== null &&
                hip_cm !== ""
                    ? Number(hip_cm)
                    : null;

            if (
                waist !== null &&
                (!Number.isFinite(waist) || waist <= 0)
            ) {
                return res.status(400).json({
                    error:
                        "Waist must be a valid positive number"
                });
            }

            if (
                neck !== null &&
                (!Number.isFinite(neck) || neck <= 0)
            ) {
                return res.status(400).json({
                    error:
                        "Neck must be a valid positive number"
                });
            }

            if (
                hip !== null &&
                (!Number.isFinite(hip) || hip <= 0)
            ) {
                return res.status(400).json({
                    error:
                        "Hip must be a valid positive number"
                });
            }

            const cleanNote =
                typeof note === "string" && note.trim()
                    ? note.trim()
                    : null;

            const result = await pool.query(
                `INSERT INTO weight_entries
                    (
                        user_id,
                        weight_kg,
                        waist_cm,
                        neck_cm,
                        hip_cm,
                        recorded_at,
                        note
                    )
                 VALUES (
                    ?, ?, ?, ?, ?,
                    COALESCE(?, CURRENT_TIMESTAMP),
                    ?
                 )`,
                [
                    userId,
                    weight,
                    waist,
                    neck,
                    hip,
                    recorded_at || null,
                    cleanNote
                ]
            );

            const entryRows = await pool.query(
                `SELECT
                    weight_entries.id,
                    weight_entries.user_id,
                    weight_entries.weight_kg,
                    weight_entries.waist_cm,
                    weight_entries.neck_cm,
                    weight_entries.hip_cm,
                    DATE_FORMAT(
                        weight_entries.recorded_at,
                        '%d/%m/%Y %h:%i:%s %p'
                    ) AS recorded_at,
                    weight_entries.note,
                    users.gender,
                    users.height_cm
                 FROM weight_entries
                 JOIN users
                    ON weight_entries.user_id = users.id
                 WHERE weight_entries.id = ?`,
                [result.insertId]
            );

            const entryWithCalculations =
                addCalculations(entryRows[0]);

            res.status(201).json({
                message:
                    "Weight entry created successfully",
                entry: entryWithCalculations
            });
        } catch (error) {
            console.error(
                "CREATE WEIGHT ENTRY ERROR:",
                error
            );

            res.status(500).json({
                error: "Failed to create weight entry"
            });
        }
    }
);


// Get all weight entries for one user
app.get(
    "/api/users/:userId/weight-entries",
    async (req, res) => {
        try {
            const userId = Number(req.params.userId);

            if (
                !Number.isInteger(userId) ||
                userId <= 0
            ) {
                return res.status(400).json({
                    error: "Invalid user ID"
                });
            }

            const userRows = await pool.query(
                "SELECT id FROM users WHERE id = ?",
                [userId]
            );

            if (userRows.length === 0) {
                return res.status(404).json({
                    error: "User not found"
                });
            }

            const rows = await pool.query(
                `SELECT
                    weight_entries.id,
                    weight_entries.user_id,
                    weight_entries.weight_kg,
                    weight_entries.waist_cm,
                    weight_entries.neck_cm,
                    weight_entries.hip_cm,
                    DATE_FORMAT(
                        weight_entries.recorded_at,
                        '%d/%m/%Y %h:%i:%s %p'
                    ) AS recorded_at,
                    weight_entries.note,
                    users.gender,
                    users.height_cm
                 FROM weight_entries
                 JOIN users
                    ON weight_entries.user_id = users.id
                 WHERE weight_entries.user_id = ?
                 ORDER BY
                    weight_entries.recorded_at DESC,
                    weight_entries.id DESC`,
                [userId]
            );

            const entries = rows.map(addCalculations);

            res.json(entries);
        } catch (error) {
            console.error(
                "GET WEIGHT ENTRIES ERROR:",
                error
            );

            res.status(500).json({
                error: "Failed to get weight entries"
            });
        }
    }
);


// =========================================
// WEIGHT GOAL ROUTES
// =========================================

// Create a weight goal
app.post(
    "/api/users/:userId/weight-goals",
    async (req, res) => {
        try {
            const userId = Number(req.params.userId);

            const {
                target_weight_kg,
                target_date
            } = req.body;

            if (
                !Number.isInteger(userId) ||
                userId <= 0
            ) {
                return res.status(400).json({
                    error: "Invalid user ID"
                });
            }

            const targetWeight =
                Number(target_weight_kg);

            if (
                !Number.isFinite(targetWeight) ||
                targetWeight <= 0
            ) {
                return res.status(400).json({
                    error:
                        "Target weight must be a valid positive number"
                });
            }

            const userRows = await pool.query(
                "SELECT id FROM users WHERE id = ?",
                [userId]
            );

            if (userRows.length === 0) {
                return res.status(404).json({
                    error: "User not found"
                });
            }

            const result = await pool.query(
                `INSERT INTO weight_goals
                    (
                        user_id,
                        target_weight_kg,
                        target_date
                    )
                 VALUES (?, ?, ?)`,
                [
                    userId,
                    targetWeight,
                    target_date || null
                ]
            );

            res.status(201).json({
                message:
                    "Weight goal created successfully",
                goal_id: Number(result.insertId)
            });
        } catch (error) {
            console.error(
                "CREATE WEIGHT GOAL ERROR:",
                error
            );

            res.status(500).json({
                error: "Failed to create weight goal"
            });
        }
    }
);


// Get all weight goals and progress
app.get(
    "/api/users/:userId/weight-goals",
    async (req, res) => {
        try {
            const userId = Number(req.params.userId);

            if (
                !Number.isInteger(userId) ||
                userId <= 0
            ) {
                return res.status(400).json({
                    error: "Invalid user ID"
                });
            }

            const userRows = await pool.query(
                "SELECT id FROM users WHERE id = ?",
                [userId]
            );

            if (userRows.length === 0) {
                return res.status(404).json({
                    error: "User not found"
                });
            }

            const goalRows = await pool.query(
                `SELECT
                    id,
                    user_id,
                    target_weight_kg,
                    DATE_FORMAT(
                        target_date,
                        '%d/%m/%Y'
                    ) AS target_date,
                    status,
                    created_at,
                    updated_at
                 FROM weight_goals
                 WHERE user_id = ?
                 ORDER BY created_at DESC`,
                [userId]
            );

            const weightRows = await pool.query(
                `SELECT weight_kg
                 FROM weight_entries
                 WHERE user_id = ?
                 ORDER BY recorded_at DESC, id DESC
                 LIMIT 1`,
                [userId]
            );

            const currentWeight =
                weightRows.length > 0
                    ? Number(weightRows[0].weight_kg)
                    : null;

            const goals = goalRows.map((goal) => {
                const targetWeight =
                    Number(goal.target_weight_kg);

                let remainingWeight = null;
                let requiredAction = null;

                if (currentWeight !== null) {
                    remainingWeight = roundToTwo(
                        Math.abs(
                            currentWeight - targetWeight
                        )
                    );

                    if (currentWeight > targetWeight) {
                        requiredAction = "lose";
                    } else if (
                        currentWeight < targetWeight
                    ) {
                        requiredAction = "gain";
                    } else {
                        requiredAction = "target reached";
                    }
                }

                return {
                    id: goal.id,
                    user_id: goal.user_id,
                    target_weight_kg: targetWeight,
                    target_date: goal.target_date,
                    status: goal.status,
                    current_weight_kg: currentWeight,
                    remaining_weight_kg:
                        remainingWeight,
                    required_action: requiredAction,
                    created_at: goal.created_at,
                    updated_at: goal.updated_at
                };
            });

            res.json(goals);
        } catch (error) {
            console.error(
                "GET WEIGHT GOALS ERROR:",
                error
            );

            res.status(500).json({
                error: "Failed to get weight goals"
            });
        }
    }
);


// =========================================
// START EXPRESS SERVER
// =========================================

app.listen(PORT, "0.0.0.0", () => {
    console.log(
        `Server running on http://localhost:${PORT}`
    );
});