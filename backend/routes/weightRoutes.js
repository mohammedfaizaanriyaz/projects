const express = require("express");

const {
  createWeightRecord,
  getWeightHistory,
  deleteWeightRecord,
} = require("../controllers/weightController");

const router = express.Router({
  mergeParams: true,
});

// Add new weight record
router.post("/", createWeightRecord);

// Get weight history
router.get("/", getWeightHistory);
router.delete("/:weightId", deleteWeightRecord);

module.exports = router;
