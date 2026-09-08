const express =
    require("express");


const requireAuth =
    require(
        "../middleware/requireAuth"
    );


const requireProfileOwnership =
    require(
        "../middleware/requireProfileOwnership"
    );


const {
    getProfile,
    updateProfile,
    deleteProfile
} = require(
    "../controllers/profileController"
);


const weightRoutes =
    require(
        "./weightRoutes"
    );


const nutritionLogRoutes =
    require(
        "./nutritionLogRoutes"
    );


const router =
    express.Router();


// ============================================================
// PROTECT EVERYTHING UNDER PROFILE ID
// ============================================================

router.use(
    "/:profileId",
    requireAuth,
    requireProfileOwnership
);


// ============================================================
// WEIGHT ROUTES
// ============================================================

router.use(
    "/:profileId/weight-records",
    weightRoutes
);


// ============================================================
// NUTRITION LOG ROUTES
// ============================================================

router.use(
    "/:profileId/nutrition-logs",
    nutritionLogRoutes
);


// ============================================================
// GET PROFILE
// ============================================================

router.get(
    "/:profileId",
    getProfile
);


// ============================================================
// UPDATE PROFILE
// ============================================================

router.put(
    "/:profileId",
    updateProfile
);


// ============================================================
// DELETE PROFILE
// ============================================================

router.delete(
    "/:profileId",
    deleteProfile
);


module.exports =
    router;