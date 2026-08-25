const express = require("express");

const {
    createTask,
    getTasksByList,
    updateTask,
    updateTaskCompletion,
    deleteTask
} = require(
    "../controllers/taskController"
);


const router =
    express.Router({
        mergeParams: true
    });


// Create task
router.post(
    "/",
    createTask
);


// Get all tasks
router.get(
    "/",
    getTasksByList
);


// Update task
router.put(
    "/:taskId",
    updateTask
);


// Complete / uncomplete task
router.patch(
    "/:taskId/complete",
    updateTaskCompletion
);


// Delete task
router.delete(
    "/:taskId",
    deleteTask
);


module.exports = router;
