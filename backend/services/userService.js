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
// CREATE AUTHENTICATED ACCOUNT
// ============================================================

const createAccount = async ({
    name,
    email,
    passwordHash
}) => {
    const result =
        await pool.query(
            `
            INSERT INTO users
            (
                name,
                email,
                password_hash
            )

            VALUES (?, ?, ?)
            `,
            [
                name,
                email,
                passwordHash
            ]
        );

    return Number(
        result.insertId
    );
};
// ============================================================
// FIND USER BY EMAIL
// ============================================================

const findUserByEmail = async (
    email
) => {
    const rows =
        await pool.query(
            `
            SELECT
                user_id,
                name,
                email,
                password_hash,
                created_at

            FROM users

            WHERE email = ?
            `,
            [email]
        );

    return rows[0] || null;
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
            email,
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
    createAccount,
    findUserById,
    findUserByEmail
};