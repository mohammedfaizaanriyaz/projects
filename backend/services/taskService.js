const pool = require("../db");


// ============================================================
// CREATE TASK LIST
// ============================================================

const createTaskList = async ({
    userId,
    listName,
    listType
}) => {

    const result =
        await pool.query(
            `
            INSERT INTO task_lists
            (
                user_id,
                list_name,
                list_type
            )

            VALUES (?, ?, ?)
            `,
            [
                userId,
                listName,
                listType
            ]
        );


    return Number(
        result.insertId
    );
};


// ============================================================
// GET ALL LISTS FOR USER
// ============================================================

const getTaskListsByUser = async (
    userId
) => {

    return pool.query(
        `
        SELECT
            list_id,
            user_id,
            list_name,
            list_type,
            created_at,
            updated_at

        FROM task_lists

        WHERE user_id = ?

        ORDER BY
            created_at ASC,
            list_id ASC
        `,
        [userId]
    );
};


// ============================================================
// FIND ONE TASK LIST
// ============================================================

const findTaskListById = async (
    userId,
    listId
) => {

    const rows =
        await pool.query(
            `
            SELECT
                list_id,
                user_id,
                list_name,
                list_type,
                created_at,
                updated_at

            FROM task_lists

            WHERE
                user_id = ?
                AND list_id = ?
            `,
            [
                userId,
                listId
            ]
        );


    return rows[0] || null;
};


// ============================================================
// UPDATE TASK LIST
// ============================================================

const updateTaskList = async ({
    userId,
    listId,
    listName,
    listType
}) => {

    return pool.query(
        `
        UPDATE task_lists

        SET
            list_name = ?,
            list_type = ?

        WHERE
            user_id = ?
            AND list_id = ?
        `,
        [
            listName,
            listType,
            userId,
            listId
        ]
    );
};


// ============================================================
// DELETE TASK LIST
// ============================================================

const deleteTaskList = async (
    userId,
    listId
) => {

    return pool.query(
        `
        DELETE FROM task_lists

        WHERE
            user_id = ?
            AND list_id = ?
        `,
        [
            userId,
            listId
        ]
    );
};


// ============================================================
// CREATE TASK
// ============================================================

const createTask = async ({
    listId,
    title,
    description,
    timeLimitMinutes,
    dueAt,
    reminderAt
}) => {

    const result =
        await pool.query(
            `
            INSERT INTO tasks
            (
                list_id,
                title,
                description,
                time_limit_minutes,
                due_at,
                reminder_at
            )

            VALUES
            (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?
            )
            `,
            [
                listId,
                title,
                description,
                timeLimitMinutes,
                dueAt,
                reminderAt
            ]
        );


    return Number(
        result.insertId
    );
};


// ============================================================
// GET ALL TASKS FROM ONE LIST
// ============================================================

const getTasksByList = async (
    userId,
    listId
) => {

    return pool.query(
        `
        SELECT
            t.task_id,
            t.list_id,
            t.title,
            t.description,
            t.is_completed,
            t.time_limit_minutes,
            t.due_at,
            t.reminder_at,
            t.completed_at,
            t.created_at,
            t.updated_at

        FROM tasks t

        INNER JOIN task_lists tl
            ON t.list_id = tl.list_id

        WHERE
            tl.user_id = ?
            AND t.list_id = ?

        ORDER BY
            t.is_completed ASC,
            t.created_at ASC,
            t.task_id ASC
        `,
        [
            userId,
            listId
        ]
    );
};


// ============================================================
// FIND ONE TASK
// ============================================================

const findTaskById = async (
    userId,
    listId,
    taskId
) => {

    const rows =
        await pool.query(
            `
            SELECT
                t.task_id,
                t.list_id,
                t.title,
                t.description,
                t.is_completed,
                t.time_limit_minutes,
                t.due_at,
                t.reminder_at,
                t.completed_at,
                t.created_at,
                t.updated_at

            FROM tasks t

            INNER JOIN task_lists tl
                ON t.list_id = tl.list_id

            WHERE
                tl.user_id = ?
                AND t.list_id = ?
                AND t.task_id = ?
            `,
            [
                userId,
                listId,
                taskId
            ]
        );


    return rows[0] || null;
};


// ============================================================
// UPDATE TASK
// ============================================================

const updateTask = async ({
    userId,
    listId,
    taskId,
    title,
    description,
    timeLimitMinutes,
    dueAt,
    reminderAt
}) => {

    return pool.query(
        `
        UPDATE tasks t

        INNER JOIN task_lists tl
            ON t.list_id = tl.list_id

        SET
    t.title = ?,
    t.description = ?,
    t.time_limit_minutes = ?,
    t.due_at = ?,

    t.reminder_sent_at =
        CASE
            WHEN NOT (
                t.reminder_at <=> ?
            )
            THEN NULL
            ELSE t.reminder_sent_at
        END,

    t.reminder_at = ?

        WHERE
            tl.user_id = ?
            AND t.list_id = ?
            AND t.task_id = ?
        `,
       [
    title,
    description,
    timeLimitMinutes,
    dueAt,

    reminderAt,
    reminderAt,

    userId,
    listId,
    taskId
]
    );
};


// ============================================================
// COMPLETE / UNCOMPLETE TASK
// ============================================================

const updateTaskCompletion = async ({
    userId,
    listId,
    taskId,
    isCompleted
}) => {

    return pool.query(
        `
        UPDATE tasks t

        INNER JOIN task_lists tl
            ON t.list_id = tl.list_id

        SET
            t.is_completed = ?,

            t.completed_at =
                CASE
                    WHEN ? = 1
                    THEN NOW()
                    ELSE NULL
                END

        WHERE
            tl.user_id = ?
            AND t.list_id = ?
            AND t.task_id = ?
        `,
        [
            isCompleted ? 1 : 0,
            isCompleted ? 1 : 0,
            userId,
            listId,
            taskId
        ]
    );
};


// ============================================================
// DELETE TASK
// ============================================================

const deleteTask = async (
    userId,
    listId,
    taskId
) => {

    return pool.query(
        `
        DELETE t

        FROM tasks t

        INNER JOIN task_lists tl
            ON t.list_id = tl.list_id

        WHERE
            tl.user_id = ?
            AND t.list_id = ?
            AND t.task_id = ?
        `,
        [
            userId,
            listId,
            taskId
        ]
    );
};

// ============================================================
// GET DUE REMINDERS
// ============================================================

const getDueReminders = async (
    userId
) => {

    return pool.query(
        `
        SELECT
            t.task_id,
            t.list_id,
            t.title,
            t.description,
            t.reminder_at,
            tl.user_id,
            tl.list_name

        FROM tasks t

        INNER JOIN task_lists tl
            ON t.list_id = tl.list_id

        WHERE
            tl.user_id = ?
            AND t.reminder_at IS NOT NULL
            AND t.reminder_at <= NOW()
            AND t.reminder_sent_at IS NULL
            AND t.is_completed = FALSE

        ORDER BY
            t.reminder_at ASC
        `,
        [
            userId
        ]
    );
};


// ============================================================
// MARK REMINDER AS SENT
// ============================================================
const markReminderAsSent = async (
    userId,
    taskId
) => {

    return pool.query(
        `
        UPDATE tasks t

        INNER JOIN task_lists tl
            ON t.list_id = tl.list_id

        SET
            t.reminder_sent_at = NOW()

        WHERE
            tl.user_id = ?
            AND t.task_id = ?
            AND t.reminder_sent_at IS NULL
        `,
        [
            userId,
            taskId
        ]
    );
};
// ============================================================
// EXPORT SERVICES
// ============================================================

module.exports = {
    createTaskList,
    getTaskListsByUser,
    findTaskListById,
    updateTaskList,
    deleteTaskList,

    createTask,
    getTasksByList,
    findTaskById,
    updateTask,
    updateTaskCompletion,
    deleteTask,

    getDueReminders,
    markReminderAsSent
};