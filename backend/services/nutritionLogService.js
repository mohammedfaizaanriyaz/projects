const pool = require("../db");

const NUTRIENT_COLUMNS = [
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "saturated_fat_g",
    "fiber_g",
    "sugar_g",
    "potassium_mg",
    "sodium_mg",
    "calcium_mg",
    "iron_mg",
    "magnesium_mg",
    "phosphorus_mg",
    "zinc_mg",
    "vitamin_c_mg"
];

// No logs: return zero.
// Logs exist but every value is missing: return NULL.
// Otherwise: sum known values and report their count.
const NUTRIENT_TOTALS_SQL = NUTRIENT_COLUMNS.map((column) => `
    CASE
        WHEN COUNT(*) = 0 THEN 0
        ELSE SUM(${column})
    END AS ${column},
    COUNT(${column}) AS ${column}_known_count
`).join(",\n");

// SAVE NUTRITION LOG
const createNutritionLog = async ({
    profileId,
    fdcId,
    foodName,
    quantity,
    unit,
    weightGrams,
    mealType,
    loggedDate,
    nutrition
}) => {
    const result = await pool.query(
        `
        INSERT INTO nutrition_logs (
            profile_id,
            fdc_id,
            food_name,
            quantity,
            unit,
            weight_grams,
            meal_type,
            logged_date,
            calories,
            protein_g,
            carbs_g,
            fat_g,
            saturated_fat_g,
            fiber_g,
            sugar_g,
            potassium_mg,
            sodium_mg,
            calcium_mg,
            iron_mg,
            magnesium_mg,
            phosphorus_mg,
            zinc_mg,
            vitamin_c_mg
        )
        VALUES (
            ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURDATE()),
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        `,
        [
            profileId,
            fdcId,
            foodName,
            quantity,
            unit,
            weightGrams,
            mealType,
            loggedDate,
            nutrition.calories,
            nutrition.protein_g,
            nutrition.carbs_g,
            nutrition.fat_g,
            nutrition.saturated_fat_g,
            nutrition.fiber_g,
            nutrition.sugar_g,
            nutrition.potassium_mg,
            nutrition.sodium_mg,
            nutrition.calcium_mg,
            nutrition.iron_mg,
            nutrition.magnesium_mg,
            nutrition.phosphorus_mg,
            nutrition.zinc_mg,
            nutrition.vitamin_c_mg
        ]
    );

    return Number(result.insertId);
};

// GET LOG BY ID
const getNutritionLogById = async (profileId, logId) => {
    const rows = await pool.query(
        `
        SELECT *
        FROM nutrition_logs
        WHERE profile_id = ? AND log_id = ?
        `,
        [profileId, logId]
    );

    return rows[0] || null;
};

// GET LOGS FOR ONE DAY
const getNutritionLogsByDate = async (
    profileId,
    loggedDate = null
) => {
    return pool.query(
        `
        SELECT
            log_id,
            profile_id,
            fdc_id,
            food_name,
            quantity,
            unit,
            weight_grams,
            meal_type,
            logged_date,
            calories,
            protein_g,
            carbs_g,
            fat_g,
            saturated_fat_g,
            fiber_g,
            sugar_g,
            potassium_mg,
            sodium_mg,
            calcium_mg,
            iron_mg,
            magnesium_mg,
            phosphorus_mg,
            zinc_mg,
            vitamin_c_mg,
            created_at

        FROM nutrition_logs

        WHERE
            profile_id = ?
            AND logged_date = COALESCE(?, CURDATE())

        ORDER BY
            FIELD(
                meal_type,
                'breakfast',
                'lunch',
                'dinner',
                'snack',
                'other'
            ),
            created_at ASC,
            log_id ASC
        `,
        [profileId, loggedDate]
    );
};

// DAILY TOTALS WITH NUTRIENT COVERAGE
const getNutritionTotalsByDate = async (
    profileId,
    loggedDate = null
) => {
    const rows = await pool.query(
        `
        SELECT
            COALESCE(?, CURDATE()) AS logged_date,
            COUNT(*) AS item_count,
            ${NUTRIENT_TOTALS_SQL}

        FROM nutrition_logs

        WHERE
            profile_id = ?
            AND logged_date = COALESCE(?, CURDATE())
        `,
        [loggedDate, profileId, loggedDate]
    );

    return rows[0];
};

// TOTALS PER MEAL WITH NUTRIENT COVERAGE
const getMealTotalsByDate = async (
    profileId,
    loggedDate = null
) => {
    return pool.query(
        `
        SELECT
            meal_type,
            COUNT(*) AS item_count,
            ${NUTRIENT_TOTALS_SQL}

        FROM nutrition_logs

        WHERE
            profile_id = ?
            AND logged_date = COALESCE(?, CURDATE())

        GROUP BY meal_type

        ORDER BY FIELD(
            meal_type,
            'breakfast',
            'lunch',
            'dinner',
            'snack',
            'other'
        )
        `,
        [profileId, loggedDate]
    );
};

// DELETE ONE LOG
const deleteNutritionLog = async (profileId, logId) => {
    return pool.query(
        `
        DELETE FROM nutrition_logs
        WHERE profile_id = ? AND log_id = ?
        `,
        [profileId, logId]
    );
};

module.exports = {
    createNutritionLog,
    getNutritionLogById,
    getNutritionLogsByDate,
    getNutritionTotalsByDate,
    getMealTotalsByDate,
    deleteNutritionLog
};