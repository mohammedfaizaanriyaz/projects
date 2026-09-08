const nutritionService =
    require(
        "../services/nutritionService"
    );


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


const isValidFdcId = (
    value
) => {

    const number =
        Number(value);

    return (
        Number.isInteger(number) &&
        number > 0
    );
};


const handleKnownServiceError = (
    error,
    res,
    next
) => {

    if (error.statusCode) {

        return res
            .status(
                error.statusCode
            )
            .json({
                error:
                    error.message
            });
    }


    if (
        error.message &&
        (
            error.message.includes(
                "Quantity"
            ) ||
            error.message.includes(
                "Unit"
            ) ||
            error.message.includes(
                "FDC ID"
            )
        )
    ) {

        return res
            .status(400)
            .json({
                error:
                    error.message
            });
    }


    next(error);
};


// ============================================================
// SEARCH FOODS
// ============================================================

const searchFoods = async (
    req,
    res,
    next
) => {

    try {

        const query =
            req.query.query;


        if (
            !query ||
            typeof query !== "string" ||
            !query.trim()
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Food search query is required"
                });
        }


        if (
            query.trim().length >
            120
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Food search query is too long"
                });
        }


        const foods =
            await nutritionService
                .searchFoods(
                    query
                );


        return res
            .status(200)
            .json({
                query:
                    query.trim(),

                count:
                    foods.length,

                foods
            });


    } catch (error) {
        next(error);
    }
};


// ============================================================
// GET FOOD DETAILS
// ============================================================

const getFoodDetails = async (
    req,
    res,
    next
) => {

    try {

        const fdcId =
            Number(
                req.params.fdcId
            );


        if (
            !isValidFdcId(
                fdcId
            )
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Invalid food ID"
                });
        }


        const food =
            await nutritionService
                .getFoodDetails(
                    fdcId
                );


        return res
            .status(200)
            .json(
                food
            );


    } catch (error) {
        next(error);
    }
};


// ============================================================
// CALCULATE SELECTED FOOD
// ============================================================

const calculateFood = async (
    req,
    res,
    next
) => {

    try {

        const {
            fdcId,
            quantity,
            unit
        } = req.body;


        if (
            !isValidFdcId(
                fdcId
            )
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Valid fdcId is required"
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
                        "Quantity must be a positive number"
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
                        "Unit is required"
                });
        }


        const result =
            await nutritionService
                .calculateFood({
                    fdcId:
                        Number(fdcId),

                    quantity:
                        Number(
                            quantity
                        ),

                    unit:
                        unit.trim()
                });


        return res
            .status(200)
            .json(
                result
            );


    } catch (error) {

        return handleKnownServiceError(
            error,
            res,
            next
        );
    }
};


// ============================================================
// ANALYZE FOOD / DISH BY NAME
// ============================================================

const analyzeFood = async (
    req,
    res,
    next
) => {

    try {

        const {
            food,
            quantity,
            unit
        } = req.body;


        if (
            !food ||
            typeof food !==
                "string" ||
            !food.trim()
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Food name is required"
                });
        }


        if (
            food.trim().length >
            120
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Food name is too long"
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
                        "Quantity must be a positive number"
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
                        "Unit is required"
                });
        }


        const result =
            await nutritionService
                .analyzeFoodByName({
                    foodName:
                        food.trim(),

                    quantity:
                        Number(
                            quantity
                        ),

                    unit:
                        unit.trim()
                });


        return res
            .status(200)
            .json(
                result
            );


    } catch (error) {

        return handleKnownServiceError(
            error,
            res,
            next
        );
    }
};


// ============================================================
// ANALYZE MULTIPLE INGREDIENTS / RECIPE
// ============================================================

const analyzeRecipe = async (
    req,
    res,
    next
) => {

    try {

        const {
            ingredients
        } = req.body;


        if (
            !Array.isArray(
                ingredients
            ) ||
            ingredients.length === 0
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "At least one ingredient is required"
                });
        }


        if (
            ingredients.length >
            10
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Maximum 10 ingredients per calculation"
                });
        }


        for (
            let index = 0;
            index <
                ingredients.length;
            index += 1
        ) {

            const ingredient =
                ingredients[
                    index
                ];


            if (
                !ingredient ||
                typeof ingredient !==
                    "object"
            ) {
                return res
                    .status(400)
                    .json({
                        error:
                            `Ingredient ${index + 1} is invalid`
                    });
            }


            const hasFdcId =
                isValidFdcId(
                    ingredient.fdcId
                );

            const hasFoodName =
                typeof ingredient.food ===
                    "string" &&
                ingredient.food
                    .trim();


            if (
                !hasFdcId &&
                !hasFoodName
            ) {
                return res
                    .status(400)
                    .json({
                        error:
                            `Ingredient ${index + 1} needs either fdcId or food name`
                    });
            }


            if (
                !isPositiveNumber(
                    ingredient.quantity
                )
            ) {
                return res
                    .status(400)
                    .json({
                        error:
                            `Ingredient ${index + 1} has an invalid quantity`
                    });
            }


            if (
                !ingredient.unit ||
                typeof ingredient.unit !==
                    "string" ||
                !ingredient.unit
                    .trim()
            ) {
                return res
                    .status(400)
                    .json({
                        error:
                            `Ingredient ${index + 1} needs a unit`
                    });
            }
        }


        const result =
            await nutritionService
                .analyzeRecipe(
                    ingredients
                );


        return res
            .status(200)
            .json(
                result
            );


    } catch (error) {

        return handleKnownServiceError(
            error,
            res,
            next
        );
    }
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    searchFoods,
    getFoodDetails,
    calculateFood,
    analyzeFood,
    analyzeRecipe
};
