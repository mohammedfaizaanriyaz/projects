const {
    getPortionOptions,
    resolveWeightInGrams
} = require(
    "../utils/unitConverter"
);


const USDA_BASE_URL =
    "https://api.nal.usda.gov/fdc/v1";


// ============================================================
// HELPERS
// ============================================================

const round = (
    value,
    decimals = 2
) => {

    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }


    const number =
        Number(value);


    if (!Number.isFinite(number)) {
        return null;
    }


    const factor =
        10 ** decimals;


    return (
        Math.round(
            number *
            factor
        ) /
        factor
    );
};


const fetchUsda = async (
    url,
    options = {}
) => {

    const controller =
        new AbortController();

    const timeout =
        setTimeout(
            () =>
                controller.abort(),
            10000
        );


    try {

        const response =
            await fetch(
                url,
                {
                    ...options,
                    signal:
                        controller.signal
                }
            );


        if (!response.ok) {

            const body =
                await response
                    .text();

            throw new Error(
                `USDA API request failed (${response.status}): ${body}`
            );
        }


        return await response
            .json();


    } catch (error) {

        if (
            error.name ===
            "AbortError"
        ) {
            throw new Error(
                "USDA API request timed out"
            );
        }

        throw error;

    } finally {

        clearTimeout(
            timeout
        );
    }
};


// ============================================================
// NUTRIENT DEFINITIONS
// USDA values are normally represented on a 100 g basis.
// ============================================================

const NUTRIENT_DEFINITIONS = [
    {
        key: "calories",
        unit: "kcal",
        ids: [
            1008,
            2047,
            2048
        ],
        names: [
            "energy",
            "metabolizable energy"
        ],
        requiredUnit:
            "kcal"
    },

    {
        key: "protein_g",
        unit: "g",
        ids: [1003],
        names: [
            "protein"
        ]
    },

    {
        key: "carbs_g",
        unit: "g",
        ids: [1005],
        names: [
            "carbohydrate, by difference",
            "carbohydrate"
        ]
    },

    {
        key: "fat_g",
        unit: "g",
        ids: [1004],
        names: [
            "total lipid (fat)",
            "total fat"
        ]
    },

    {
        key: "saturated_fat_g",
        unit: "g",
        ids: [1258],
        names: [
            "fatty acids, total saturated",
            "saturated fat"
        ]
    },

    {
        key: "fiber_g",
        unit: "g",
        ids: [1079],
        names: [
            "fiber, total dietary",
            "dietary fiber"
        ]
    },

    {
        key: "sugar_g",
        unit: "g",
        ids: [
            2000,
            1063
        ],
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
        names: [
            "potassium, k",
            "potassium"
        ]
    },

    {
        key: "sodium_mg",
        unit: "mg",
        ids: [1093],
        names: [
            "sodium, na",
            "sodium"
        ]
    },

    {
        key: "calcium_mg",
        unit: "mg",
        ids: [1087],
        names: [
            "calcium, ca",
            "calcium"
        ]
    },

    {
        key: "iron_mg",
        unit: "mg",
        ids: [1089],
        names: [
            "iron, fe",
            "iron"
        ]
    },

    {
        key: "magnesium_mg",
        unit: "mg",
        ids: [1090],
        names: [
            "magnesium, mg",
            "magnesium"
        ]
    },

    {
        key: "phosphorus_mg",
        unit: "mg",
        ids: [1091],
        names: [
            "phosphorus, p",
            "phosphorus"
        ]
    },

    {
        key: "zinc_mg",
        unit: "mg",
        ids: [1095],
        names: [
            "zinc, zn",
            "zinc"
        ]
    },

    {
        key: "vitamin_c_mg",
        unit: "mg",
        ids: [1162],
        names: [
            "vitamin c, total ascorbic acid",
            "vitamin c"
        ]
    }
];


const normalizeFoodNutrient = (
    entry
) => {

    const nutrient =
        entry?.nutrient || {};


    const id =
        Number(
            nutrient.id ??
            entry?.nutrientId
        );

    const name =
        String(
            nutrient.name ??
            entry?.nutrientName ??
            ""
        )
            .trim();

    const unitName =
        String(
            nutrient.unitName ??
            entry?.unitName ??
            ""
        )
            .trim();

    const amount =
        Number(
            entry?.amount ??
            entry?.value
        );


    return {
        id:
            Number.isFinite(id)
                ? id
                : null,

        name,

        unitName,

        amount:
            Number.isFinite(amount)
                ? amount
                : null
    };
};


const findNutrientValue = (
    food,
    definition
) => {

    const entries =
        (
            Array.isArray(
                food?.foodNutrients
            )
                ? food.foodNutrients
                : []
        )
            .map(
                normalizeFoodNutrient
            )
            .filter(
                (entry) =>
                    entry.amount !==
                    null
            );


    for (
        const nutrientId
        of definition.ids
    ) {

        const match =
            entries.find(
                (entry) =>
                    entry.id ===
                    nutrientId &&
                    (
                        !definition
                            .requiredUnit ||
                        entry
                            .unitName
                            .toLowerCase() ===
                        definition
                            .requiredUnit
                            .toLowerCase()
                    )
            );


        if (match) {
            return match.amount;
        }
    }


    for (
        const wantedName
        of definition.names
    ) {

        const match =
            entries.find(
                (entry) => {

                    const name =
                        entry.name
                            .toLowerCase();

                    const nameMatches =
                        name ===
                            wantedName
                                .toLowerCase() ||
                        name.includes(
                            wantedName
                                .toLowerCase()
                        );


                    const unitMatches =
                        !definition
                            .requiredUnit ||
                        entry
                            .unitName
                            .toLowerCase() ===
                        definition
                            .requiredUnit
                            .toLowerCase();


                    return (
                        nameMatches &&
                        unitMatches
                    );
                }
            );


        if (match) {
            return match.amount;
        }
    }


    return null;
};


const extractNutrientsPer100g = (
    food
) => {

    const result = {};


    for (
        const definition
        of NUTRIENT_DEFINITIONS
    ) {

        result[
            definition.key
        ] =
            round(
                findNutrientValue(
                    food,
                    definition
                )
            );
    }


    return result;
};


const scaleNutrition = (
    nutrientsPer100g,
    weightGrams
) => {

    const factor =
        weightGrams /
        100;

    const scaled = {};


    for (
        const definition
        of NUTRIENT_DEFINITIONS
    ) {

        const value =
            nutrientsPer100g[
                definition.key
            ];


        scaled[
            definition.key
        ] =
            value === null
                ? null
                : round(
                    value *
                    factor
                );
    }


    return scaled;
};


const formatSearchFood = (
    food
) => {

    return {
        fdcId:
            food.fdcId,

        description:
            food.description,

        dataType:
            food.dataType,

        brandOwner:
            food.brandOwner ||
            null,

        brandName:
            food.brandName ||
            null
    };
};


const formatFoodDetails = (
    food
) => {

    return {
        fdcId:
            food.fdcId,

        description:
            food.description,

        dataType:
            food.dataType,

        brandOwner:
            food.brandOwner ||
            null,

        brandName:
            food.brandName ||
            null,

        ingredients:
            food.ingredients ||
            null,

        nutrientsPer100g:
            extractNutrientsPer100g(
                food
            ),

        supportedMassUnits: [
            "g",
            "kg",
            "oz",
            "lb"
        ],

        portions:
            getPortionOptions(
                food
            )
    };
};


// ============================================================
// SEARCH FOODS
// ============================================================

const searchFoods = async (
    query,
    pageSize = 10
) => {

    if (
        !query ||
        typeof query !== "string" ||
        !query.trim()
    ) {
        throw new Error(
            "Food search query is required"
        );
    }


    const safePageSize =
        Math.min(
            Math.max(
                Number(pageSize) || 10,
                1
            ),
            25
        );


    const url =
        new URL(
            `${USDA_BASE_URL}/foods/search`
        );


    url.searchParams.set(
        "api_key",
        process.env.USDA_API_KEY
    );

    url.searchParams.set(
        "query",
        query.trim()
    );

    url.searchParams.set(
        "pageSize",
        safePageSize
    );


    const data =
        await fetchUsda(
            url
        );


    return (
        Array.isArray(
            data.foods
        )
            ? data.foods
            : []
    )
        .map(
            formatSearchFood
        );
};


// ============================================================
// GET RAW FOOD DETAILS
// ============================================================

const getRawFoodDetails = async (
    fdcId
) => {

    const numericFdcId =
        Number(fdcId);


    if (
        !Number.isInteger(
            numericFdcId
        ) ||
        numericFdcId <= 0
    ) {
        throw new Error(
            "Valid FDC ID is required"
        );
    }


    const url =
        new URL(
            `${USDA_BASE_URL}/food/${numericFdcId}`
        );


    url.searchParams.set(
        "api_key",
        process.env.USDA_API_KEY
    );


    return fetchUsda(
        url
    );
};


// ============================================================
// GET CLEAN FOOD DETAILS
// ============================================================

const getFoodDetails = async (
    fdcId
) => {

    const food =
        await getRawFoodDetails(
            fdcId
        );


    return formatFoodDetails(
        food
    );
};


// ============================================================
// CALCULATE A SELECTED FOOD
// ============================================================

const calculateFood = async ({
    fdcId,
    quantity,
    unit
}) => {

    const food =
        await getRawFoodDetails(
            fdcId
        );


    const weightGrams =
        resolveWeightInGrams(
            food,
            quantity,
            unit
        );


    const per100g =
        extractNutrientsPer100g(
            food
        );


    const nutrition =
        scaleNutrition(
            per100g,
            weightGrams
        );


    const missingNutrients =
        Object.entries(
            nutrition
        )
            .filter(
                (
                    [, value]
                ) =>
                    value === null
            )
            .map(
                ([key]) =>
                    key
            );


    return {
        food: {
            fdcId:
                food.fdcId,

            description:
                food.description,

            dataType:
                food.dataType,

            brandOwner:
                food.brandOwner ||
                null,

            brandName:
                food.brandName ||
                null
        },

        input: {
            quantity:
                Number(quantity),

            unit,

            weightGrams
        },

        nutrition,

        missingNutrients,

        source:
            "USDA FoodData Central"
    };
};


// ============================================================
// ANALYZE BY FOOD / DISH NAME
// This auto-selects the first USDA search result.
// Frontend should let users select a result for higher accuracy.
// ============================================================

const analyzeFoodByName = async ({
    foodName,
    quantity,
    unit
}) => {

    const matches =
        await searchFoods(
            foodName,
            5
        );


    if (
        matches.length === 0
    ) {
        const error =
            new Error(
                "No matching food found"
            );

        error.statusCode =
            404;

        throw error;
    }


    const selected =
        matches[0];


    const calculation =
        await calculateFood({
            fdcId:
                selected.fdcId,

            quantity,

            unit
        });


    return {
        ...calculation,

        match: {
            requested:
                foodName,

            autoSelected:
                true,

            selected,

            alternatives:
                matches.slice(
                    1
                ),

            warning:
                "Dish-name calculation uses the closest USDA search match. Select an exact food or enter recipe ingredients for better accuracy."
        }
    };
};


// ============================================================
// ANALYZE MULTIPLE INGREDIENTS / RECIPE
// ============================================================

const analyzeRecipe = async (
    ingredients
) => {

    const results = [];


    for (
        const ingredient
        of ingredients
    ) {

        let fdcId =
            ingredient.fdcId
                ? Number(
                    ingredient.fdcId
                )
                : null;

        let matchInfo =
            null;


        if (!fdcId) {

            const matches =
                await searchFoods(
                    ingredient.food,
                    3
                );


            if (
                matches.length === 0
            ) {

                const error =
                    new Error(
                        `No USDA match found for "${ingredient.food}"`
                    );

                error.statusCode =
                    404;

                throw error;
            }


            fdcId =
                matches[0]
                    .fdcId;


            matchInfo = {
                requested:
                    ingredient.food,

                autoSelected:
                    true,

                selected:
                    matches[0],

                alternatives:
                    matches.slice(
                        1
                    )
            };
        }


        const calculation =
            await calculateFood({
                fdcId,

                quantity:
                    ingredient.quantity,

                unit:
                    ingredient.unit
            });


        results.push({
            ...calculation,

            match:
                matchInfo
        });
    }


    const totals = {};

    const incompleteNutrients =
        [];


    for (
        const definition
        of NUTRIENT_DEFINITIONS
    ) {

        let sum = 0;
        let hasAnyValue = false;
        let incomplete = false;


        for (
            const result
            of results
        ) {

            const value =
                result
                    .nutrition[
                        definition.key
                    ];


            if (
                value === null
            ) {
                incomplete = true;
                continue;
            }


            sum += value;
            hasAnyValue = true;
        }


        totals[
            definition.key
        ] =
            hasAnyValue
                ? round(sum)
                : null;


        if (incomplete) {
            incompleteNutrients
                .push(
                    definition.key
                );
        }
    }


    return {
        ingredientCount:
            results.length,

        ingredients:
            results,

        totals,

        incompleteNutrients,

        source:
            "USDA FoodData Central",

        note:
            incompleteNutrients
                .length > 0
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
