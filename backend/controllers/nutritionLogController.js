const nutritionLogService =
    require(
        "../services/nutritionLogService"
    );

const {
    isValidDateString
} = require(
    "../utils/dateUtils"
);

const {
    isValidId,
    numberOrNull
} = require(
    "../utils/numberUtils"
);


// ============================================================
// CONSTANTS
// ============================================================

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


// ============================================================
// HELPERS
// ============================================================

const isPositiveNumber = (
    value
) => {

    const number =
        Number(value);

    return (
        Number.isFinite(number) &&
        number > 0
    );
};


const cleanDate = (
    value
) => {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }


    const text =
        String(value)
            .trim();


    if (
        !isValidDateString(
            text
        )
    ) {
        return {
            error:
                "logged_date must be a valid YYYY-MM-DD date"
        };
    }


    return text;
};


const cleanMealType = (
    value
) => {

    const mealType =
        String(
            value ||
            "other"
        )
            .trim()
            .toLowerCase();


    if (
        !ALLOWED_MEAL_TYPES.includes(
            mealType
        )
    ) {
        return {
            error:
                "meal_type must be breakfast, lunch, dinner, snack or other"
        };
    }


    return mealType;
};


const cleanNutrition = (
    value
) => {

    if (
        !value ||
        typeof value !==
        "object" ||
        Array.isArray(value)
    ) {
        return {
            error:
                "nutrition object is required"
        };
    }


    const nutrition = {};


    for (
        const key
        of NUTRIENT_KEYS
    ) {

        const rawValue =
            value[key];


        if (
            rawValue === undefined ||
            rawValue === null ||
            rawValue === ""
        ) {
            nutrition[key] =
                null;

            continue;
        }


        const number =
            Number(rawValue);


        if (
            !Number.isFinite(number) ||
            number < 0
        ) {
            return {
                error:
                    `${key} must be a non-negative number or null`
            };
        }


        nutrition[key] =
            Number(
                number.toFixed(2)
            );
    }


    return {
        nutrition
    };
};


const formatLog = (
    row
) => {

    if (!row) {
        return null;
    }


    return {
        ...row,

        log_id:
            Number(
                row.log_id
            ),

        profile_id:
            Number(
                row.profile_id
            ),

        fdc_id:
            row.fdc_id === null
                ? null
                : Number(
                    row.fdc_id
                ),

        quantity:
            Number(
                row.quantity
            ),

        weight_grams:
            Number(
                row.weight_grams
            ),

        ...Object.fromEntries(
            NUTRIENT_KEYS.map(
                (key) => [
                    key,
                    numberOrNull(
                        row[key]
                    )
                ]
            )
        )
    };
};


const formatTotals = (
    row
) => {

    return {
        logged_date:
            row.logged_date,

        item_count:
            Number(
                row.item_count ||
                0
            ),

        ...Object.fromEntries(
            NUTRIENT_KEYS.map(
                (key) => [
                    key,
                    numberOrNull(
                        row[key]
                    ) ?? 0
                ]
            )
        )
    };
};


// ============================================================
// CREATE NUTRITION LOG
// ============================================================

const createNutritionLog = async (
    req,
    res,
    next
) => {

    try {

        const profileId =
            Number(
                req.params.profileId
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


        const {
            fdcId,
            food_name,
            quantity,
            unit,
            weight_grams,
            meal_type,
            logged_date,
            nutrition
        } = req.body;


        if (
            fdcId !== undefined &&
            fdcId !== null &&
            (
                !Number.isInteger(
                    Number(fdcId)
                ) ||
                Number(fdcId) <= 0
            )
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Invalid fdcId"
                });
        }


        if (
            !food_name ||
            typeof food_name !==
            "string" ||
            !food_name.trim()
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "food_name is required"
                });
        }


        if (
            !isPositiveNumber(
                quantity
            )
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "quantity must be a positive number"
                });
        }


        if (
            !unit ||
            typeof unit !==
            "string" ||
            !unit.trim()
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "unit is required"
                });
        }


        if (
            !isPositiveNumber(
                weight_grams
            )
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "weight_grams must be a positive number"
                });
        }


        const mealType =
            cleanMealType(
                meal_type
            );


        if (
            mealType.error
        ) {
            return res
                .status(400)
                .json({
                    error:
                        mealType.error
                });
        }


        const loggedDate =
            cleanDate(
                logged_date
            );


        if (
            loggedDate &&
            loggedDate.error
        ) {
            return res
                .status(400)
                .json({
                    error:
                        loggedDate.error
                });
        }


        const nutritionResult =
            cleanNutrition(
                nutrition
            );


        if (
            nutritionResult.error
        ) {
            return res
                .status(400)
                .json({
                    error:
                        nutritionResult.error
                });
        }


        const logId =
            await nutritionLogService
                .createNutritionLog({
                    profileId,

                    fdcId:
                        fdcId === undefined ||
                            fdcId === null
                            ? null
                            : Number(
                                fdcId
                            ),

                    foodName:
                        food_name.trim(),

                    quantity:
                        Number(
                            quantity
                        ),

                    unit:
                        unit.trim(),

                    weightGrams:
                        Number(
                            weight_grams
                        ),

                    mealType,

                    loggedDate,

                    nutrition:
                        nutritionResult
                            .nutrition
                });


        const row =
            await nutritionLogService
                .getNutritionLogById(
                    profileId,
                    logId
                );


        return res
            .status(201)
            .json({
                message:
                    "Food added to nutrition log",

                log:
                    formatLog(
                        row
                    )
            });

    } catch (error) {
        next(error);
    }
};


// ============================================================
// GET DAILY LOGS
// ============================================================

const getNutritionLogs = async (
    req,
    res,
    next
) => {

    try {

        const profileId =
            Number(
                req.params.profileId
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


        const date =
            cleanDate(
                req.query.date
            );


        if (
            date &&
            date.error
        ) {
            return res
                .status(400)
                .json({
                    error:
                        date.error
                });
        }


        const rows =
            await nutritionLogService
                .getNutritionLogsByDate(
                    profileId,
                    date
                );


        return res
            .status(200)
            .json(
                rows.map(
                    formatLog
                )
            );

    } catch (error) {
        next(error);
    }
};


// ============================================================
// GET DAILY TOTALS
// ============================================================

const getNutritionTotals = async (
    req,
    res,
    next
) => {

    try {

        const profileId =
            Number(
                req.params.profileId
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


        const date =
            cleanDate(
                req.query.date
            );


        if (
            date &&
            date.error
        ) {
            return res
                .status(400)
                .json({
                    error:
                        date.error
                });
        }


        const [
            totalsRow,
            mealRows
        ] =
            await Promise.all([
                nutritionLogService
                    .getNutritionTotalsByDate(
                        profileId,
                        date
                    ),

                nutritionLogService
                    .getMealTotalsByDate(
                        profileId,
                        date
                    )
            ]);


        const meals = {};


        for (
            const row
            of mealRows
        ) {

            meals[
                row.meal_type
            ] = {

                item_count:
                    Number(
                        row.item_count ||
                        0
                    ),

                calories:
                    numberOrNull(
                        row.calories
                    ) ?? 0,

                protein_g:
                    numberOrNull(
                        row.protein_g
                    ) ?? 0,

                carbs_g:
                    numberOrNull(
                        row.carbs_g
                    ) ?? 0,

                fat_g:
                    numberOrNull(
                        row.fat_g
                    ) ?? 0,

                fiber_g:
                    numberOrNull(
                        row.fiber_g
                    ) ?? 0
            };
        }


        return res
            .status(200)
            .json({
                totals:
                    formatTotals(
                        totalsRow
                    ),

                meals
            });

    } catch (error) {
        next(error);
    }
};


// ============================================================
// DELETE ONE LOG
// ============================================================

const deleteNutritionLog = async (
    req,
    res,
    next
) => {

    try {

        const profileId =
            Number(
                req.params.profileId
            );

        const logId =
            Number(
                req.params.logId
            );


        if (
            !isValidId(
                profileId
            ) ||
            !isValidId(
                logId
            )
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Invalid profile or nutrition log ID"
                });
        }


        const result =
            await nutritionLogService
                .deleteNutritionLog(
                    profileId,
                    logId
                );


        if (
            !result ||
            result.affectedRows === 0
        ) {
            return res
                .status(404)
                .json({
                    error:
                        "Nutrition log not found"
                });
        }


        return res
            .status(200)
            .json({
                message:
                    "Nutrition log deleted"
            });

    } catch (error) {
        next(error);
    }
};


module.exports = {
    createNutritionLog,
    getNutritionLogs,
    getNutritionTotals,
    deleteNutritionLog
};
