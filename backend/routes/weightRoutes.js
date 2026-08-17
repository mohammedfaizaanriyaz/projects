const express = require("express");

const {
    createWeightRecord,
    getWeightHistory
} = require("../controllers/weightController");

const router = express.Router({
    mergeParams: true
});

// Add new weight record
router.post(
    "/",
    createWeightRecord
);

// Get weight history
router.get(
    "/",
    getWeightHistory
);

module.exports = router;