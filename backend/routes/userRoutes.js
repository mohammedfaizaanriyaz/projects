const express = require("express");

const requireAuth =
    require("../middleware/requireAuth");

const requireUserOwnership =
    require(
        "../middleware/requireUserOwnership"
    );

const {
    getUser
} = require(
    "../controllers/userController"
);

const {
    createProfile,
    getProfilesByUser
} = require(
    "../controllers/profileController"
);

const {
    getDueRemindersByUser,
    acknowledgeReminder
} = require(
    "../controllers/taskController"
);

const taskListRoutes =
    require("./taskListRoutes");


const router =
    express.Router();


// ============================================================
// PROTECT USER DATA
// ============================================================

router.use(
    "/:userId",
    requireAuth,
    requireUserOwnership
);


// ============================================================
// DUE REMINDERS FOR USER
// ============================================================

router.get("/:userId/task-summary", async (req, res, next) => {
    try { res.json(await require("../services/taskService").getTaskSummary(req.user.userId)); }
    catch (error) { next(error); }
});

router.get(
    "/:userId/reminders/due",
    getDueRemindersByUser
);
router.post(
    "/:userId/reminders/:taskId/acknowledge",
    acknowledgeReminder
);


// ============================================================
// TASK LISTS BELONGING TO USER
// ============================================================

router.use(
    "/:userId/task-lists",
    taskListRoutes
);


// ============================================================
// GET MAIN USER
// ============================================================

router.get(
    "/:userId",
    getUser
);


// ============================================================
// CREATE PROFILE UNDER USER
// ============================================================

router.post(
    "/:userId/profiles",
    createProfile
);


// ============================================================
// GET ALL PROFILES OF USER
// ============================================================

router.get(
    "/:userId/profiles",
    getProfilesByUser
);


module.exports =
    router;