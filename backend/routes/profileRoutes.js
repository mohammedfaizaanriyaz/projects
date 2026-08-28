const express = require("express");

const {
  getProfile,
  updateProfile,
  deleteProfile,
} = require("../controllers/profileController");

const weightRoutes = require("./weightRoutes");

const router = express.Router();

// Weight routes belonging to a profile
router.use("/:profileId/weight-records", weightRoutes);

// Get one profile
router.get("/:profileId", getProfile);

// Update profile
router.put("/:profileId", updateProfile);

// Delete profile
router.delete("/:profileId", deleteProfile);

module.exports = router;
