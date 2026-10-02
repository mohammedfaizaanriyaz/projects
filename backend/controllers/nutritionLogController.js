const nutritionLogService = require("../services/nutritionLogService");
const { numberOrNull } = require("../utils/numberUtils");

const ALLOWED_MEAL_TYPES = [
    "breakfast",
    "lunch",
    "dinner",
    "snack",
    "other"
];

const NUTRIENT_KEYS = [
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

class NutritionValidationError extends Error {}

function invalid(message) {
    throw new NutritionValidationError(message);
}

function handleError(error, res, next) {
    if (error instanceof NutritionValidationError) {
        return res.status(400).json({ error: error.message });
    }

    return next(error);
}

function validateBody(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        invalid("Request body must be an object");
    }

    return body;
}

function validateId(value, label, max = 2147483647) {
    if (typeof value !== "string" && typeof value !== "number") {
        invalid(`${label} must be a positive integer`);
    }

    const text = String(value).trim();

    if (!/^\d+$/.test(text)) {
        invalid(`${label} must be a positive integer`);
    }

    const number = Number(text);

    if (!Number.isSafeInteger(number) || number < 1 || number > max) {
        invalid(`${label} is outside the supported range`);
    }

    return number;
}

function validateText(value, label, maxLength) {
    if (typeof value !== "string") {
        invalid(`${label} must be text`);
    }

    const text = value.trim();

    if (!text) {
        invalid(`${label} cannot be empty`);
    }

    if (Array.from(text).length > maxLength) {
        invalid(`${label} cannot exceed ${maxLength} characters`);
    }

    return text;
}

function validateDecimal(value, label, decimals, min, max) {
    if (typeof value !== "string" && typeof value !== "number") {
        invalid(`${label} must be a number`);
    }

    const text = String(value).trim();
    const pattern = new RegExp(`^\\d+(?:\\.\\d{1,${decimals}})?$`);

    if (!pattern.test(text)) {
        invalid(
            `${label} must be a non-negative number with at most ` +
            `${decimals} decimal places`
        );
    }

    const number = Number(text);

    if (!Number.isFinite(number) || number < min || number > max) {
        invalid(`${label} must be between ${min} and ${max}`);
    }

    return number;
}

function cleanDate(value) {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    if (typeof value !== "string") {
        invalid("logged_date must be a YYYY-MM-DD date");
    }

    const text = value.trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        invalid("logged_date must be a YYYY-MM-DD date");
    }

    const date = new Date(`${text}T00:00:00.000Z`);

    if (
        Number.isNaN(date.getTime()) ||
        Number(text.slice(0, 4)) < 1000 ||
        date.toISOString().slice(0, 10) !== text
    ) {
        invalid("logged_date must be a valid calendar date");
    }

    return text;
}

function cleanMealType(value) {
    if (value === undefined) return "other";

    if (typeof value !== "string") {
        invalid("meal_type must be text");
    }

    const mealType = value.trim().toLowerCase();

    if (!ALLOWED_MEAL_TYPES.includes(mealType)) {
        invalid(
            "meal_type must be breakfast, lunch, dinner, snack or other"
        );
    }

    return mealType;
}

function cleanNutrition(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        invalid("nutrition object is required");
    }

    const nutrition = {};

    for (const key of NUTRIENT_KEYS) {
        const rawValue = value[key];

        // Preserve missing information for M4.
        const missing =
            rawValue === undefined ||
            rawValue === null ||
            (
                typeof rawValue === "string" &&
                rawValue.trim() === ""
            );

        nutrition[key] = missing
            ? null
            : validateDecimal(
                rawValue,
                key,
                2,
                0,
                999999999999.99
            );
    }

    return nutrition;
}

// FORMAT A SINGLE LOG
function formatLog(row) {
    if (!row) return null;

    return {
        ...row,
        log_id: Number(row.log_id),
        profile_id: Number(row.profile_id),
        fdc_id: row.fdc_id == null ? null : Number(row.fdc_id),
        quantity: Number(row.quantity),
        weight_grams: Number(row.weight_grams),

        ...Object.fromEntries(
            NUTRIENT_KEYS.map((key) => [
                key,
                row[key] == null ? null : numberOrNull(row[key])
            ])
        )
    };
}

// PRESERVE M4'S NUTRIENT COMPLETENESS INFORMATION
function formatTotals(row) {
    const itemCount = Number(row.item_count || 0);
    const totals = {
        item_count: itemCount,
        coverage: {}
    };

    if (row.logged_date !== undefined) {
        totals.logged_date = row.logged_date;
    }

    for (const key of NUTRIENT_KEYS) {
        const knownCount = Number(row[`${key}_known_count`] || 0);

        totals[key] =
            itemCount === 0
                ? 0
                : knownCount === 0
                    ? null
                    : numberOrNull(row[key]);

        totals.coverage[key] = {
            known_count: knownCount,
            missing_count: itemCount - knownCount,
            status:
                itemCount === 0
                    ? "empty"
                    : knownCount === 0
                        ? "unknown"
                        : knownCount < itemCount
                            ? "partial"
                            : "complete"
        };
    }

    return totals;
}

// CREATE NUTRITION LOG
const createNutritionLog = async (req, res, next) => {
    try {
        const profileId = validateId(req.params.profileId, "Profile ID");
        const body = validateBody(req.body);

        // JavaScript numbers cannot safely represent every SQL BIGINT.
        const fdcId = body.fdcId == null
            ? null
            : validateId(body.fdcId, "FDC ID", Number.MAX_SAFE_INTEGER);

        const foodName = validateText(body.food_name, "Food name", 255);
        const unit = validateText(body.unit, "Unit", 100);

        const quantity = validateDecimal(
            body.quantity,
            "Quantity",
            3,
            0.001,
            999999999.999
        );

        const weightGrams = validateDecimal(
            body.weight_grams,
            "Weight in grams",
            3,
            0.001,
            999999999.999
        );

        const mealType = cleanMealType(body.meal_type);
        const loggedDate = cleanDate(body.logged_date);
        const nutrition = cleanNutrition(body.nutrition);

        const logId = await nutritionLogService.createNutritionLog({
            profileId,
            fdcId,
            foodName,
            quantity,
            unit,
            weightGrams,
            mealType,
            loggedDate,
            nutrition
        });

        const row = await nutritionLogService.getNutritionLogById(
            profileId,
            logId
        );

        return res.status(201).json({
            message: "Food added to nutrition log",
            log: formatLog(row)
        });
    } catch (error) {
        return handleError(error, res, next);
    }
};

// GET DAILY LOGS
const getNutritionLogs = async (req, res, next) => {
    try {
        const profileId = validateId(req.params.profileId, "Profile ID");
        const date = cleanDate(req.query.date);

        const rows = await nutritionLogService.getNutritionLogsByDate(
            profileId,
            date
        );

        return res.status(200).json(rows.map(formatLog));
    } catch (error) {
        return handleError(error, res, next);
    }
};

// GET DAILY AND PER-MEAL TOTALS
const getNutritionTotals = async (req, res, next) => {
    try {
        const profileId = validateId(req.params.profileId, "Profile ID");
        const date = cleanDate(req.query.date);

        const [totalsRow, mealRows] = await Promise.all([
            nutritionLogService.getNutritionTotalsByDate(profileId, date),
            nutritionLogService.getMealTotalsByDate(profileId, date)
        ]);

        const meals = {};

        for (const row of mealRows) {
            meals[row.meal_type] = formatTotals(row);
        }

        return res.status(200).json({
            totals: formatTotals(totalsRow),
            meals
        });
    } catch (error) {
        return handleError(error, res, next);
    }
};

// DELETE ONE LOG
const deleteNutritionLog = async (req, res, next) => {
    try {
        const profileId = validateId(req.params.profileId, "Profile ID");
        const logId = validateId(req.params.logId, "Nutrition log ID");

        const result = await nutritionLogService.deleteNutritionLog(
            profileId,
            logId
        );

        if (!result || result.affectedRows === 0) {
            return res.status(404).json({
                error: "Nutrition log not found"
            });
        }

        return res.status(200).json({
            message: "Nutrition log deleted"
        });
    } catch (error) {
        return handleError(error, res, next);
    }
};

module.exports = {
    createNutritionLog,
    getNutritionLogs,
    getNutritionTotals,
    deleteNutritionLog
};