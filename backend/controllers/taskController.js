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
  normalizeDateTime,
  formatUtcDateTime
} = require("../utils/dateTimeUtils");


// ============================================================
// FORMAT TASK RESPONSE
// ============================================================

const formatTask = (task) => {
  return {
    ...task,

    is_completed: Boolean(task.is_completed),

    time_limit_minutes:
      task.time_limit_minutes == null
        ? null
        : Number(task.time_limit_minutes),

    due_at:
      formatUtcDateTime(task.due_at),

    reminder_at:
      formatUtcDateTime(task.reminder_at),

    completed_at:
      formatUtcDateTime(task.completed_at),

    created_at:
      formatUtcDateTime(task.created_at),

    updated_at:
      formatUtcDateTime(task.updated_at)
  };
};

// ============================================================
// VALIDATE LIST DATA
// ============================================================

// VALIDATE LIST DATA
const validateListData = (body) => {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return { error: "Request body must be an object" };
    }

    const { list_name, list_type = "todo" } = body;

    if (typeof list_name !== "string" || !list_name.trim()) {
        return { error: "List name must be nonempty text" };
    }

    const listName = list_name.trim();

    if (Array.from(listName).length > 120) {
        return { error: "List name cannot exceed 120 characters" };
    }

    if (!["todo", "checklist"].includes(list_type)) {
        return { error: "List type must be todo or checklist" };
    }

    return {
        data: {
            listName,
            listType: list_type
        }
    };
};

// VALIDATE TASK DATA
const validateTaskData = (body) => {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return { error: "Request body must be an object" };
    }

    const {
        title,
        description = "",
        time_limit_minutes = null,
        due_at = null,
        reminder_at = null
    } = body;

    if (typeof title !== "string" || !title.trim()) {
        return { error: "Task title must be nonempty text" };
    }

    const cleanedTitle = title.trim();

    if (Array.from(cleanedTitle).length > 200) {
        return { error: "Task title cannot exceed 200 characters" };
    }

    if (typeof description !== "string") {
        return { error: "Description must be text" };
    }

    const cleanedDescription = description.trim();

    // TEXT is limited by bytes, so emojis can use more space than letters.
    if (Buffer.byteLength(cleanedDescription, "utf8") > 65535) {
        return { error: "Description is too long; please shorten it" };
    }

    let timeLimitMinutes = null;

    const blankTimeLimit =
        time_limit_minutes === null ||
        (
            typeof time_limit_minutes === "string" &&
            time_limit_minutes.trim() === ""
        );

    if (!blankTimeLimit) {
        // Check the type before converting: true must not become 1.
        if (
            typeof time_limit_minutes !== "number" &&
            typeof time_limit_minutes !== "string"
        ) {
            return { error: "Time limit must be a positive whole number" };
        }

        if (
            typeof time_limit_minutes === "string" &&
            !/^\d+$/.test(time_limit_minutes.trim())
        ) {
            return { error: "Time limit must contain whole-number digits" };
        }

        timeLimitMinutes = Number(time_limit_minutes);

        if (
            !Number.isSafeInteger(timeLimitMinutes) ||
            timeLimitMinutes < 1 ||
            timeLimitMinutes > 2147483647
        ) {
            return {
                error: "Time limit must be a whole number from 1 to 2147483647"
            };
        }
    }

    const dueResult = normalizeDateTime(due_at);

    if (!dueResult.valid) {
        return {
            error: "Due date must be a valid UTC date and time ending in Z"
        };
    }

    const reminderResult = normalizeDateTime(reminder_at);

    if (!reminderResult.valid) {
        return {
            error: "Reminder must be a valid UTC date and time ending in Z"
        };
    }

    if (
        dueResult.value &&
        reminderResult.value &&
        reminderResult.value > dueResult.value
    ) {
        return { error: "Reminder cannot be after the task deadline" };
    }

    return {
        data: {
            title: cleanedTitle,
            description: cleanedDescription,
            timeLimitMinutes,
            dueAt: dueResult.value,
            reminderAt: reminderResult.value
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


        if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
            return res.status(400).json({ error: "Request body must be an object" });
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


     return res.status(200).json(
  reminders.map((reminder) => ({
    ...reminder,

    reminder_at:
      formatUtcDateTime(reminder.reminder_at)
  }))
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