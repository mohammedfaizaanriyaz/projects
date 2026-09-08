const express =
    require("express");

const requireAuth =
    require(
        "../middleware/requireAuth"
    );

const {
    searchFoods,
    getFoodDetails,
    calculateFood,
    analyzeFood,
    analyzeRecipe
} = require(
    "../controllers/nutritionController"
);


const router =
    express.Router();


// Nutrition uses the application's login session.
// This also protects the USDA API quota from anonymous use.
router.use(
    requireAuth
);


// ============================================================
// SEARCH
// GET /api/nutrition/search?query=banana
// ============================================================

router.get(
    "/search",
    searchFoods
);


// ============================================================
// DETAILS + AVAILABLE PORTIONS
// GET /api/nutrition/foods/:fdcId
// ============================================================

router.get(
    "/foods/:fdcId",
    getFoodDetails
);


// ============================================================
// CALCULATE AN EXACT SELECTED USDA FOOD
// POST /api/nutrition/calculate
// ============================================================

router.post(
    "/calculate",
    calculateFood
);


// ============================================================
// AUTO-MATCH A FOOD / DISH NAME
// POST /api/nutrition/analyze
// ============================================================

router.post(
    "/analyze",
    analyzeFood
);


// ============================================================
// MULTI-INGREDIENT RECIPE TOTAL
// POST /api/nutrition/recipe
// ============================================================

router.post(
    "/recipe",
    analyzeRecipe
);


module.exports =
    router;
