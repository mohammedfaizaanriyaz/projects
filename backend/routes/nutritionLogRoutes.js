const express =
    require("express");

const {
    createNutritionLog,
    getNutritionLogs,
    getNutritionTotals,
    deleteNutritionLog
} = require(
    "../controllers/nutritionLogController"
);


const router =
    express.Router({
        mergeParams: true
    });


// ============================================================
// DAILY TOTALS
// ============================================================

router.get(
    "/totals",
    getNutritionTotals
);


// ============================================================
// DAILY FOOD LOG
// ============================================================

router.get(
    "/",
    getNutritionLogs
);


router.post(
    "/",
    createNutritionLog
);


router.delete(
    "/:logId",
    deleteNutritionLog
);


module.exports =
    router;
    