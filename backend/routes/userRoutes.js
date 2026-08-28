const express = require("express");

const { createUser, getUser } = require("../controllers/userController");

const {
  createProfile,
  getProfilesByUser,
} = require("../controllers/profileController");

const taskListRoutes = require("./taskListRoutes");

const router = express.Router();

// ============================================================
// TASK LISTS BELONGING TO USER
// ============================================================

router.use("/:userId/task-lists", taskListRoutes);

// ============================================================
// USER ROUTES
// ============================================================

// Create main user
router.post("/", createUser);

// Get main user
router.get("/:userId", getUser);

// Create profile under a user
router.post("/:userId/profiles", createProfile);

// Get all profiles of a user
router.get("/:userId/profiles", getProfilesByUser);

module.exports = router;
