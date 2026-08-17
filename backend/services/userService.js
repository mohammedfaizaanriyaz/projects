const pool = require("../db");

// ============================================================
// CREATE USER
// ============================================================

const createUser = async (name) => {
    const result = await pool.query(
        `
        INSERT INTO users (name)
        VALUES (?)
        `,
        [name]
    );

    return Number(result.insertId);
};

// ============================================================
// FIND USER BY ID
// ============================================================

const findUserById = async (userId) => {
    const rows = await pool.query(
        `
        SELECT
            user_id,
            name,
            created_at
        FROM users
        WHERE user_id = ?
        `,
        [userId]
    );

    return rows[0] || null;
};

// ============================================================
// EXPORT SERVICES
// ============================================================

module.exports = {
    createUser,
    findUserById
};