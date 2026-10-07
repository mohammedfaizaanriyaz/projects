const {
    getPortionOptions,
    resolveWeightInGrams
} = require("../utils/unitConverter");

const { createProviderCache } = require("../utils/providerCache");
const cached = createProviderCache();

const USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1";

function nutritionServiceError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.expose = true;
    return error;
}

const round = (value, decimals = 2) => {
    if (value === null || value === undefined) return null;

    const number = Number(value);
    if (!Number.isFinite(number)) return null;

    const factor = 10 ** decimals;
    return Math.round(number * factor) / factor;
};

const fetchUsda = async (url, options = {}) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        let response;

        try {
            response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
        } catch {
            if (controller.signal.aborted) {
                throw nutritionServiceError(
                    504,
                    "Nutrition provider timed out. Please try again."
                );
            }

            throw nutritionServiceError(
                502,
                "Could not contact the nutrition provider. Please try again."
            );
        }

        if (response.status === 404) {
            throw nutritionServiceError(
                404,
                "The requested USDA food was not found."
            );
        }

        if (response.status === 429) {
            throw nutritionServiceError(503, "Nutrition provider quota is temporarily exhausted. Please try again later.");
        }

        if (!response.ok) {
            throw nutritionServiceError(
                502,
                "Nutrition provider could not complete the request. Please try again later."
            );
        }

        try {
            return await response.json();
        } catch {
            if (controller.signal.aborted) {
                throw nutritionServiceError(
                    504,
                    "Nutrition provider timed out. Please try again."
                );
            }

            throw nutritionServiceError(
                502,
                "Nutrition provider returned an unreadable response. Please try again."
            );
        }
    } finally {
        clearTimeout(timeout);
    }
};

const NUTRIENT_DEFINITIONS = [
    {
        key: "calories",
        unit: "kcal",
        ids: [1008, 2047, 2048],
        names: ["energy", "metabolizable energy"],
        requiredUnit: "kcal"
    },
    {
        key: "protein_g",
        unit: "g",
        ids: [1003],
        names: ["protein"]
    },
    {
        key: "carbs_g",
        unit: "g",
        ids: [1005],
        names: ["carbohydrate, by difference", "carbohydrate"]
    },
    {
        key: "fat_g",
        unit: "g",
        ids: [1004],
        names: ["total lipid (fat)", "total fat"]
    },
    {
        key: "saturated_fat_g",
        unit: "g",
        ids: [1258],
        names: ["fatty acids, total saturated", "saturated fat"]
    },
    {
        key: "fiber_g",
        unit: "g",
        ids: [1079],
        names: ["fiber, total dietary", "dietary fiber"]
    },
    {
        key: "sugar_g",
        unit: "g",
        ids: [2000, 1063],
        names: [
            "sugars, total including nlea",
            "sugars, total",
            "total sugars"
        ]
    },
    {
        key: "potassium_mg",
        unit: "mg",
        ids: [1092],
        names: ["potassium, k", "potassium"]
    },
    {
        key: "sodium_mg",
        unit: "mg",
        ids: [1093],
        names: ["sodium, na", "sodium"]
    },
    {
        key: "calcium_mg",
        unit: "mg",
        ids: [1087],
        names: ["calcium, ca", "calcium"]
    },
    {
        key: "iron_mg",
        unit: "mg",
        ids: [1089],
        names: ["iron, fe", "iron"]
    },
    {
        key: "magnesium_mg",
        unit: "mg",
        ids: [1090],
        names: ["magnesium, mg", "magnesium"]
    },
    {
        key: "phosphorus_mg",
        unit: "mg",
        ids: [1091],
        names: ["phosphorus, p", "phosphorus"]
    },
    {
        key: "zinc_mg",
        unit: "mg",
        ids: [1095],
        names: ["zinc, zn", "zinc"]
    },
    {
        key: "vitamin_c_mg",
        unit: "mg",
        ids: [1162],
        names: ["vitamin c, total ascorbic acid", "vitamin c"]
    }
];

const normalizeFoodNutrient = (entry) => {
    const nutrient = entry?.nutrient || {};
    const id = Number(nutrient.id ?? entry?.nutrientId);

    const name = String(
        nutrient.name ?? entry?.nutrientName ?? ""
    ).trim();

    const unitName = String(
        nutrient.unitName ?? entry?.unitName ?? ""
    ).trim();

    const rawAmount = entry?.amount ?? entry?.value;
    const amount =
        rawAmount === null ||
        rawAmount === undefined ||
        (
            typeof rawAmount === "string" &&
            rawAmount.trim() === ""
        )
            ? NaN
            : Number(rawAmount);

    return {
        id: Number.isFinite(id) ? id : null,
        name,
        unitName,
        amount: Number.isFinite(amount) && amount >= 0 ? amount : null
    };
};

const findNutrientValue = (food, definition) => {
    const entries = (
        Array.isArray(food?.foodNutrients) ? food.foodNutrients : []
    )
        .map(normalizeFoodNutrient)
        .filter((entry) => entry.amount !== null);

    const unitMatches = (entry) =>
        !definition.requiredUnit ||
        entry.unitName.toLowerCase() ===
            definition.requiredUnit.toLowerCase();

    for (const nutrientId of definition.ids) {
        const match = entries.find(
            (entry) => entry.id === nutrientId && unitMatches(entry)
        );

        if (match) return match.amount;
    }

    for (const wantedName of definition.names) {
        const match = entries.find((entry) => {
            const name = entry.name.toLowerCase();
            const wanted = wantedName.toLowerCase();

            return (
                (name === wanted || name.includes(wanted)) &&
                unitMatches(entry)
            );
        });

        if (match) return match.amount;
    }

    return null;
};

const extractNutrientsPer100g = (food) => {
    const result = {};

    for (const definition of NUTRIENT_DEFINITIONS) {
        result[definition.key] = round(
            findNutrientValue(food, definition)
        );
    }

    return result;
};

const scaleNutrition = (nutrientsPer100g, weightGrams) => {
    const factor = weightGrams / 100;
    const scaled = {};

    for (const definition of NUTRIENT_DEFINITIONS) {
        const value = nutrientsPer100g[definition.key];

        const amount = value == null ? null : round(value * factor);
        if (value != null && (amount === null || amount > 999999999999.99)) {
            throw nutritionServiceError(400, "This quantity produces nutrient values too large to save. Use a smaller quantity.");
        }
        scaled[definition.key] = amount;
    }

    return scaled;
};

const formatSearchFood = (food) => ({
    fdcId: food.fdcId,
    description: Array.from(food.description).slice(0, 255).join(""),
    dataType: food.dataType,
    brandOwner: food.brandOwner || null,
    brandName: food.brandName || null
});

const formatFoodDetails = (food) => ({
    ...formatSearchFood(food),
    ingredients: food.ingredients || null,
    nutrientsPer100g: extractNutrientsPer100g(food),
    supportedMassUnits: ["g", "kg", "oz", "lb"],
    portions: getPortionOptions(food)
});

// SEARCH FOODS
const searchFoods = async (query, pageSize = 10) => {
    if (typeof query !== "string" || !query.trim()) {
        throw nutritionServiceError(
            400,
            "Food search query is required"
        );
    }

    const safePageSize = Math.min(
        Math.max(Math.trunc(Number(pageSize) || 10), 1),
        25
    );

    const url = new URL(`${USDA_BASE_URL}/foods/search`);
    url.searchParams.set("api_key", process.env.USDA_API_KEY);
    url.searchParams.set("query", query.trim());
    url.searchParams.set("pageSize", safePageSize);

    const data = await cached(`search:${safePageSize}:${query.trim().toLowerCase()}`, () => fetchUsda(url));

    if (!data || !Array.isArray(data.foods)) {
        throw nutritionServiceError(
            502,
            "Nutrition provider returned an unexpected search response."
        );
    }

    return data.foods.filter((food) => food && Number.isSafeInteger(Number(food.fdcId)) &&
        Number(food.fdcId) > 0 && typeof food.description === "string").map(formatSearchFood);
};

// GET RAW FOOD DETAILS
const getRawFoodDetails = async (fdcId) => {
    const numericFdcId = Number(fdcId);

    if (
        (typeof fdcId !== "number" && typeof fdcId !== "string") ||
        !Number.isSafeInteger(numericFdcId) ||
        numericFdcId <= 0
    ) {
        throw nutritionServiceError(
            400,
            "Valid FDC ID is required"
        );
    }

    const url = new URL(`${USDA_BASE_URL}/food/${numericFdcId}`);
    url.searchParams.set("api_key", process.env.USDA_API_KEY);

    const food = await cached(`food:${numericFdcId}`, () => fetchUsda(url));

    if (
        !food ||
        typeof food !== "object" ||
        Array.isArray(food) ||
        Number(food.fdcId) !== numericFdcId ||
        typeof food.description !== "string"
    ) {
        throw nutritionServiceError(
            502,
            "Nutrition provider returned unexpected food details."
        );
    }

    return food;
};

const getFoodDetails = async (fdcId) => {
    const food = await getRawFoodDetails(fdcId);
    return formatFoodDetails(food);
};

// CALCULATE A SELECTED FOOD
const calculateFood = async ({ fdcId, quantity, unit }) => {
    const food = await getRawFoodDetails(fdcId);
    const weightGrams = resolveWeightInGrams(food, quantity, unit);
    const per100g = extractNutrientsPer100g(food);
    const nutrition = scaleNutrition(per100g, weightGrams);

    const missingNutrients = Object.entries(nutrition)
        .filter(([, value]) => value === null)
        .map(([key]) => key);

    return {
        food: formatSearchFood(food),
        input: {
            quantity: Number(quantity),
            unit,
            weightGrams
        },
        nutrition,
        missingNutrients,
        source: "USDA FoodData Central"
    };
};

// ANALYZE BY FOOD NAME
const analyzeFoodByName = async ({ foodName, quantity, unit }) => {
    const matches = await searchFoods(foodName, 5);

    if (matches.length === 0) {
        throw nutritionServiceError(404, "No matching food found");
    }

    const selected = matches[0];
    const calculation = await calculateFood({
        fdcId: selected.fdcId,
        quantity,
        unit
    });

    return {
        ...calculation,
        match: {
            requested: foodName,
            autoSelected: true,
            selected,
            alternatives: matches.slice(1),
            warning:
                "Dish-name calculation uses the first USDA search result. " +
                "Select an exact food or enter recipe ingredients for better accuracy."
        }
    };
};

// ANALYZE RECIPE
const analyzeRecipe = async (ingredients) => {
    const results = new Array(ingredients.length);
    const deadline = Date.now() + 30000;
    let cursor = 0;
    let stopped = false;
    const checkDeadline = () => {
        if (stopped || Date.now() >= deadline) throw nutritionServiceError(504, "Recipe calculation timed out. Try fewer ingredients.");
    };
    async function calculateIngredient(ingredient) {
        checkDeadline();
        let fdcId = ingredient.fdcId ? Number(ingredient.fdcId) : null;
        let matchInfo = null;

        if (!fdcId) {
            const matches = await searchFoods(ingredient.food, 3);

            if (matches.length === 0) {
                throw nutritionServiceError(
                    404,
                    `No USDA match found for "${ingredient.food}"`
                );
            }

            fdcId = matches[0].fdcId;
            matchInfo = {
                requested: ingredient.food,
                autoSelected: true,
                selected: matches[0],
                alternatives: matches.slice(1)
            };
        }

        checkDeadline();
        const calculation = await calculateFood({
            fdcId,
            quantity: ingredient.quantity,
            unit: ingredient.unit
        });

        return { ...calculation, match: matchInfo };
    }
    let timer;
    try {
        await Promise.race([
            Promise.all(Array.from({ length: Math.min(3, ingredients.length) }, async () => {
                while (cursor < ingredients.length) {
                    checkDeadline();
                    const index = cursor++;
                    results[index] = await calculateIngredient(ingredients[index]);
                }
            })),
            new Promise((_, reject) => {
                timer = setTimeout(() => reject(nutritionServiceError(504, "Recipe calculation timed out. Try fewer ingredients.")), 30000);
            })
        ]);
    } finally { stopped = true; clearTimeout(timer); }

    const totals = {};
    const incompleteNutrients = [];

    for (const definition of NUTRIENT_DEFINITIONS) {
        let sum = 0;
        let hasAnyValue = false;
        let incomplete = false;

        for (const result of results) {
            const value = result.nutrition[definition.key];

            if (value === null) {
                incomplete = true;
                continue;
            }

            sum += value;
            hasAnyValue = true;
        }

        totals[definition.key] = hasAnyValue ? round(sum) : null;

        if (incomplete) {
            incompleteNutrients.push(definition.key);
        }
    }

    return {
        ingredientCount: results.length,
        ingredients: results,
        totals,
        incompleteNutrients,
        source: "USDA FoodData Central",
        note: incompleteNutrients.length > 0
            ? "Some USDA food records do not report every nutrient. Missing values are not treated as zero."
            : null
    };
};

module.exports = {
    searchFoods,
    getFoodDetails,
    calculateFood,
    analyzeFoodByName,
    analyzeRecipe
};