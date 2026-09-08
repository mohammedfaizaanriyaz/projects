const taskService =
    require("../services/taskService");

const userService =
    require("../services/userService");

const {
    isValidId
} = require(
    "../utils/numberUtils"
);

const {
    normalizeDateTime
} = require(
    "../utils/dateTimeUtils"
);


// ============================================================
// FORMAT TASK RESPONSE
// ============================================================

const formatTask = (task) => {

    return {
        ...task,

        is_completed:
            Boolean(
                task.is_completed
            ),

        time_limit_minutes:
            task.time_limit_minutes === null
                ? null
                : Number(
                    task.time_limit_minutes
                )
    };
};


// ============================================================
// VALIDATE LIST DATA
// ============================================================

const validateListData = (
    body
) => {

    const {
        list_name,
        list_type = "todo"
    } = body;


    if (
        !list_name ||
        typeof list_name !== "string" ||
        !list_name.trim()
    ) {
        return {
            error:
                "List name is required"
        };
    }


    const allowedTypes = [
        "todo",
        "checklist"
    ];


    if (
        !allowedTypes.includes(
            list_type
        )
    ) {
        return {
            error:
                "List type must be todo or checklist"
        };
    }


    return {
        data: {
            listName:
                list_name.trim(),

            listType:
                list_type
        }
    };
};


// ============================================================
// VALIDATE TASK DATA
// ============================================================

const validateTaskData = (
    body
) => {

    const {
        title,
        description = "",
        time_limit_minutes = null,
        due_at = null,
        reminder_at = null
    } = body;


    if (
        !title ||
        typeof title !== "string" ||
        !title.trim()
    ) {
        return {
            error:
                "Task title is required"
        };
    }


    if (
        typeof description !== "string"
    ) {
        return {
            error:
                "Description must be text"
        };
    }


    let timeLimitMinutes = null;


    if (
        time_limit_minutes !== null &&
        time_limit_minutes !== ""
    ) {

        timeLimitMinutes =
            Number(
                time_limit_minutes
            );


        if (
            !Number.isInteger(
                timeLimitMinutes
            ) ||
            timeLimitMinutes <= 0
        ) {
            return {
                error:
                    "Time limit must be a positive whole number"
            };
        }
    }


    const dueResult =
        normalizeDateTime(
            due_at
        );


    if (!dueResult.valid) {
        return {
            error:
                "Due date must be a valid date and time"
        };
    }


    const reminderResult =
        normalizeDateTime(
            reminder_at
        );


    if (!reminderResult.valid) {
        return {
            error:
                "Reminder must be a valid date and time"
        };
    }


    if (
        dueResult.value &&
        reminderResult.value &&
        reminderResult.value >
        dueResult.value
    ) {
        return {
            error:
                "Reminder cannot be after the task deadline"
        };
    }


    return {
        data: {
            title:
                title.trim(),

            description:
                description.trim(),

            timeLimitMinutes,

            dueAt:
                dueResult.value,

            reminderAt:
                reminderResult.value
        }
    };
};


// ============================================================
// CREATE TASK LIST
// ============================================================

const createTaskList = async (
    req,
    res,
    next
) => {

    try {

        const userId =
            Number(
                req.params.userId
            );


        if (!isValidId(userId)) {
            return res
                .status(400)
                .json({
                    error:
                        "Invalid user ID"
                });
        }


        const user =
            await userService
                .findUserById(
                    userId
                );


        if (!user) {
            return res
                .status(404)
                .json({
                    error:
                        "User not found"
                });
        }


        const validation =
            validateListData(
                req.body
            );


        if (validation.error) {
            return res
                .status(400)
                .json({
                    error:
                        validation.error
                });
        }


        const {
            listName,
            listType
        } = validation.data;


        const listId =
            await taskService
                .createTaskList({
                    userId,
                    listName,
                    listType
                });


        const list =
            await taskService
                .findTaskListById(
                    userId,
                    listId
                );


        return res
            .status(201)
            .json({
                message:
                    "Task list created successfully",

                list
            });

    } catch (error) {
        next(error);
    }
};


// ============================================================
// GET USER TASK LISTS
// ============================================================

const getTaskListsByUser = async (
    req,
    res,
    next
) => {

    try {

        const userId =
            Number(
                req.params.userId
            );


        if (!isValidId(userId)) {
            return res
                .status(400)
                .json({
                    error:
                        "Invalid user ID"
                });
        }


        const user =
            await userService
                .findUserById(
                    userId
                );


        if (!user) {
            return res
                .status(404)
                .json({
                    error:
                        "User not found"
                });
        }


        const lists =
            await taskService
                .getTaskListsByUser(
                    userId
                );


        return res
            .status(200)
            .json(
                lists
            );

    } catch (error) {
        next(error);
    }
};


// ============================================================
// UPDATE TASK LIST
// ============================================================

const updateTaskList = async (
    req,
    res,
    next
) => {

    try {

        const userId =
            Number(
                req.params.userId
            );

        const listId =
            Number(
                req.params.listId
            );


        if (
            !isValidId(userId) ||
            !isValidId(listId)
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Invalid user or list ID"
                });
        }


        const existingList =
            await taskService
                .findTaskListById(
                    userId,
                    listId
                );


        if (!existingList) {
            return res
                .status(404)
                .json({
                    error:
                        "Task list not found"
                });
        }


        const validation =
            validateListData(
                req.body
            );


        if (validation.error) {
            return res
                .status(400)
                .json({
                    error:
                        validation.error
                });
        }


        const {
            listName,
            listType
        } = validation.data;


        await taskService
            .updateTaskList({
                userId,
                listId,
                listName,
                listType
            });


        const list =
            await taskService
                .findTaskListById(
                    userId,
                    listId
                );


        return res
            .status(200)
            .json({
                message:
                    "Task list updated successfully",

                list
            });

    } catch (error) {
        next(error);
    }
};


// ============================================================
// DELETE TASK LIST
// ============================================================

const deleteTaskList = async (
    req,
    res,
    next
) => {

    try {

        const userId =
            Number(
                req.params.userId
            );

        const listId =
            Number(
                req.params.listId
            );


        if (
            !isValidId(userId) ||
            !isValidId(listId)
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Invalid user or list ID"
                });
        }


        const list =
            await taskService
                .findTaskListById(
                    userId,
                    listId
                );


        if (!list) {
            return res
                .status(404)
                .json({
                    error:
                        "Task list not found"
                });
        }


        await taskService
            .deleteTaskList(
                userId,
                listId
            );


        return res
            .status(200)
            .json({
                message:
                    "Task list deleted successfully"
            });

    } catch (error) {
        next(error);
    }
};


// ============================================================
// CREATE TASK
// ============================================================

const createTask = async (
    req,
    res,
    next
) => {

    try {

        const userId =
            Number(
                req.params.userId
            );

        const listId =
            Number(
                req.params.listId
            );


        if (
            !isValidId(userId) ||
            !isValidId(listId)
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Invalid user or list ID"
                });
        }


        const list =
            await taskService
                .findTaskListById(
                    userId,
                    listId
                );


        if (!list) {
            return res
                .status(404)
                .json({
                    error:
                        "Task list not found"
                });
        }


        const validation =
            validateTaskData(
                req.body
            );


        if (validation.error) {
            return res
                .status(400)
                .json({
                    error:
                        validation.error
                });
        }


        const {
            title,
            description,
            timeLimitMinutes,
            dueAt,
            reminderAt
        } = validation.data;


        const taskId =
            await taskService
                .createTask({
                    listId,
                    title,
                    description,
                    timeLimitMinutes,
                    dueAt,
                    reminderAt
                });


        const task =
            await taskService
                .findTaskById(
                    userId,
                    listId,
                    taskId
                );


        return res
            .status(201)
            .json({
                message:
                    "Task created successfully",

                task:
                    formatTask(task)
            });

    } catch (error) {
        next(error);
    }
};


// ============================================================
// GET TASKS FROM LIST
// ============================================================

const getTasksByList = async (
    req,
    res,
    next
) => {

    try {

        const userId =
            Number(
                req.params.userId
            );

        const listId =
            Number(
                req.params.listId
            );


        if (
            !isValidId(userId) ||
            !isValidId(listId)
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Invalid user or list ID"
                });
        }


        const list =
            await taskService
                .findTaskListById(
                    userId,
                    listId
                );


        if (!list) {
            return res
                .status(404)
                .json({
                    error:
                        "Task list not found"
                });
        }


        const rows =
            await taskService
                .getTasksByList(
                    userId,
                    listId
                );


        const tasks =
            rows.map(
                formatTask
            );


        return res
            .status(200)
            .json(
                tasks
            );

    } catch (error) {
        next(error);
    }
};


// ============================================================
// UPDATE TASK
// ============================================================

const updateTask = async (
    req,
    res,
    next
) => {

    try {

        const userId =
            Number(
                req.params.userId
            );

        const listId =
            Number(
                req.params.listId
            );

        const taskId =
            Number(
                req.params.taskId
            );


        if (
            !isValidId(userId) ||
            !isValidId(listId) ||
            !isValidId(taskId)
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Invalid ID"
                });
        }


        const existingTask =
            await taskService
                .findTaskById(
                    userId,
                    listId,
                    taskId
                );


        if (!existingTask) {
            return res
                .status(404)
                .json({
                    error:
                        "Task not found"
                });
        }


        const validation =
            validateTaskData(
                req.body
            );


        if (validation.error) {
            return res
                .status(400)
                .json({
                    error:
                        validation.error
                });
        }


        const {
            title,
            description,
            timeLimitMinutes,
            dueAt,
            reminderAt
        } = validation.data;


        await taskService
            .updateTask({
                userId,
                listId,
                taskId,
                title,
                description,
                timeLimitMinutes,
                dueAt,
                reminderAt
            });


        const task =
            await taskService
                .findTaskById(
                    userId,
                    listId,
                    taskId
                );


        return res
            .status(200)
            .json({
                message:
                    "Task updated successfully",

                task:
                    formatTask(task)
            });

    } catch (error) {
        next(error);
    }
};


// ============================================================
// COMPLETE / UNCOMPLETE TASK
// ============================================================

const updateTaskCompletion = async (
    req,
    res,
    next
) => {

    try {

        const userId =
            Number(
                req.params.userId
            );

        const listId =
            Number(
                req.params.listId
            );

        const taskId =
            Number(
                req.params.taskId
            );


        if (
            !isValidId(userId) ||
            !isValidId(listId) ||
            !isValidId(taskId)
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Invalid ID"
                });
        }


        const {
            is_completed
        } = req.body;


        if (
            typeof is_completed !==
            "boolean"
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "is_completed must be true or false"
                });
        }


        const existingTask =
            await taskService
                .findTaskById(
                    userId,
                    listId,
                    taskId
                );


        if (!existingTask) {
            return res
                .status(404)
                .json({
                    error:
                        "Task not found"
                });
        }


        await taskService
            .updateTaskCompletion({
                userId,
                listId,
                taskId,
                isCompleted:
                    is_completed
            });


        const task =
            await taskService
                .findTaskById(
                    userId,
                    listId,
                    taskId
                );


        return res
            .status(200)
            .json({
                message:
                    is_completed
                        ? "Task completed"
                        : "Task marked incomplete",

                task:
                    formatTask(task)
            });

    } catch (error) {
        next(error);
    }
};


// ============================================================
// DELETE TASK
// ============================================================

const deleteTask = async (
    req,
    res,
    next
) => {

    try {

        const userId =
            Number(
                req.params.userId
            );

        const listId =
            Number(
                req.params.listId
            );

        const taskId =
            Number(
                req.params.taskId
            );


        if (
            !isValidId(userId) ||
            !isValidId(listId) ||
            !isValidId(taskId)
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Invalid ID"
                });
        }


        const task =
            await taskService
                .findTaskById(
                    userId,
                    listId,
                    taskId
                );


        if (!task) {
            return res
                .status(404)
                .json({
                    error:
                        "Task not found"
                });
        }


        await taskService
            .deleteTask(
                userId,
                listId,
                taskId
            );


        return res
            .status(200)
            .json({
                message:
                    "Task deleted successfully"
            });

    } catch (error) {
        next(error);
    }
};
// ============================================================
// GET DUE REMINDERS FOR USER
// ============================================================

const getDueRemindersByUser = async (
    req,
    res,
    next
) => {

    try {

        const userId =
            Number(
                req.params.userId
            );

        if (!isValidId(userId)) {
            return res
                .status(400)
                .json({
                    error:
                        "Invalid user ID"
                });
        }


        const reminders =
            await taskService
                .getDueReminders(
                    userId
                );


        return res
            .status(200)
            .json(
                reminders
            );

    } catch (error) {
        next(error);
    }
};


// ============================================================
// ACKNOWLEDGE REMINDER
// ============================================================

const acknowledgeReminder = async (
    req,
    res,
    next
) => {

    try {

        const userId =
            Number(
                req.params.userId
            );

        const taskId =
            Number(
                req.params.taskId
            );


        if (
            !isValidId(userId) ||
            !isValidId(taskId)
        ) {
            return res
                .status(400)
                .json({
                    error:
                        "Invalid user or task ID"
                });
        }


        const result =
            await taskService
                .markReminderAsSent(
                    userId,
                    taskId
                );


        if (
            !result ||
            result.affectedRows === 0
        ) {
            return res
                .status(404)
                .json({
                    error:
                        "Reminder not found or already acknowledged"
                });
        }


        return res
            .status(200)
            .json({
                message:
                    "Reminder acknowledged"
            });

    } catch (error) {
        next(error);
    }
};


// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
    createTaskList,
    getTaskListsByUser,
    updateTaskList,
    deleteTaskList,

    createTask,
    getTasksByList,
    updateTask,
    updateTaskCompletion,
    deleteTask,

    getDueRemindersByUser,
    acknowledgeReminder
};