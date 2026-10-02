const nutritionService = require("../services/nutritionService");

function isObject(value) {
    return value !== null &&
        typeof value === "object" &&
        !Array.isArray(value);
}

function isPositiveNumber(value) {
    if (typeof value !== "number" && typeof value !== "string") {
        return false;
    }

    if (typeof value === "string" && !value.trim()) {
        return false;
    }

    const number = Number(value);
    return Number.isFinite(number) && number > 0;
}

function isValidFdcId(value) {
    if (typeof value !== "number" && typeof value !== "string") {
        return false;
    }

    if (!/^\d+$/.test(String(value).trim())) {
        return false;
    }

    const number = Number(value);
    return Number.isSafeInteger(number) && number > 0;
}

function validText(value, maxLength) {
    return typeof value === "string" &&
        value.trim().length > 0 &&
        Array.from(value.trim()).length <= maxLength;
}

// SEARCH FOODS
const searchFoods = async (req, res, next) => {
    try {
        const query = req.query.query;

        if (!validText(query, 120)) {
            return res.status(400).json({
                error: "Food search query must contain 1 to 120 characters"
            });
        }

        const foods = await nutritionService.searchFoods(query.trim());

        return res.status(200).json({
            query: query.trim(),
            count: foods.length,
            foods
        });
    } catch (error) {
        next(error);
    }
};

// GET FOOD DETAILS
const getFoodDetails = async (req, res, next) => {
    try {
        if (!isValidFdcId(req.params.fdcId)) {
            return res.status(400).json({
                error: "Invalid food ID"
            });
        }

        const food = await nutritionService.getFoodDetails(
            Number(req.params.fdcId)
        );

        return res.status(200).json(food);
    } catch (error) {
        next(error);
    }
};

// CALCULATE SELECTED FOOD
const calculateFood = async (req, res, next) => {
    try {
        if (!isObject(req.body)) {
            return res.status(400).json({
                error: "Request body must be an object"
            });
        }

        const { fdcId, quantity, unit } = req.body;

        if (!isValidFdcId(fdcId)) {
            return res.status(400).json({
                error: "Valid fdcId is required"
            });
        }

        if (!isPositiveNumber(quantity)) {
            return res.status(400).json({
                error: "Quantity must be a positive number"
            });
        }

        if (!validText(unit, 100)) {
            return res.status(400).json({
                error: "Unit must contain 1 to 100 characters"
            });
        }

        const result = await nutritionService.calculateFood({
            fdcId: Number(fdcId),
            quantity: Number(quantity),
            unit: unit.trim()
        });

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// ANALYZE FOOD BY NAME
const analyzeFood = async (req, res, next) => {
    try {
        if (!isObject(req.body)) {
            return res.status(400).json({
                error: "Request body must be an object"
            });
        }

        const { food, quantity, unit } = req.body;

        if (!validText(food, 120)) {
            return res.status(400).json({
                error: "Food name must contain 1 to 120 characters"
            });
        }

        if (!isPositiveNumber(quantity)) {
            return res.status(400).json({
                error: "Quantity must be a positive number"
            });
        }

        if (!validText(unit, 100)) {
            return res.status(400).json({
                error: "Unit must contain 1 to 100 characters"
            });
        }

        const result = await nutritionService.analyzeFoodByName({
            foodName: food.trim(),
            quantity: Number(quantity),
            unit: unit.trim()
        });

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

// ANALYZE RECIPE
const analyzeRecipe = async (req, res, next) => {
    try {
        if (!isObject(req.body)) {
            return res.status(400).json({
                error: "Request body must be an object"
            });
        }

        const { ingredients } = req.body;

        if (!Array.isArray(ingredients) || ingredients.length === 0) {
            return res.status(400).json({
                error: "At least one ingredient is required"
            });
        }

        if (ingredients.length > 10) {
            return res.status(400).json({
                error: "Maximum 10 ingredients per calculation"
            });
        }

        const cleanedIngredients = [];

        for (let index = 0; index < ingredients.length; index += 1) {
            const ingredient = ingredients[index];
            const label = `Ingredient ${index + 1}`;

            if (!isObject(ingredient)) {
                return res.status(400).json({
                    error: `${label} is invalid`
                });
            }

            const suppliedId =
                ingredient.fdcId !== undefined &&
                ingredient.fdcId !== null;

            if (suppliedId && !isValidFdcId(ingredient.fdcId)) {
                return res.status(400).json({
                    error: `${label} has an invalid fdcId`
                });
            }

            if (!suppliedId && !validText(ingredient.food, 120)) {
                return res.status(400).json({
                    error: `${label} needs a food name of 1 to 120 characters`
                });
            }

            if (!isPositiveNumber(ingredient.quantity)) {
                return res.status(400).json({
                    error: `${label} has an invalid quantity`
                });
            }

            if (!validText(ingredient.unit, 100)) {
                return res.status(400).json({
                    error: `${label} needs a unit of 1 to 100 characters`
                });
            }

            cleanedIngredients.push({
                ...(suppliedId
                    ? { fdcId: Number(ingredient.fdcId) }
                    : { food: ingredient.food.trim() }),
                quantity: Number(ingredient.quantity),
                unit: ingredient.unit.trim()
            });
        }

        const result = await nutritionService.analyzeRecipe(
            cleanedIngredients
        );

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    searchFoods,
    getFoodDetails,
    calculateFood,
    analyzeFood,
    analyzeRecipe
};