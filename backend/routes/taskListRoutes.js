const express = require("express");

const {
    createTaskList,
    getTaskListsByUser,
    updateTaskList,
    deleteTaskList
} = require(
    "../controllers/taskController"
);


const taskRoutes =
    require("./taskRoutes");


const router =
    express.Router({
        mergeParams: true
    });


// Create new list
router.post(
    "/",
    createTaskList
);


// Get all lists
router.get(
    "/",
    getTaskListsByUser
);


// Update list
router.put(
    "/:listId",
    updateTaskList
);


// Delete list
router.delete(
    "/:listId",
    deleteTaskList
);


// Tasks belonging to a list
router.use(
    "/:listId/tasks",
    taskRoutes
);


module.exports = router;