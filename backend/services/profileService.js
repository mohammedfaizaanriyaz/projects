const pool = require("../db");

// ============================================================
// CHECK USER EXISTS
// ============================================================

const userExists = async (
    userId,
    connection = pool
) => {
    const rows = await connection.query(
        `
        SELECT user_id
        FROM users
        WHERE user_id = ?
        `,
        [userId]
    );

    return rows.length > 0;
};

// ============================================================
// CREATE PROFILE WITH TRANSACTION
// ============================================================

const createProfile = async ({
    userId,
    profileName,
    dob,
    gender,
    height,
    waist,
    chest,
    neck,
    hip,
    currentWeight,
    targetWeight,
    activityLevel,
    bmi,
    bodyFat
}) => {
    let connection;

    try {
        connection =
            await pool.getConnection();

        await connection.beginTransaction();

        const exists =
            await userExists(
                userId,
                connection
            );

        if (!exists) {
            await connection.rollback();

            return {
                userNotFound: true
            };
        }

        // Create profile
        const profileResult =
            await connection.query(
                `
                INSERT INTO profiles
                (
                    user_id,
                    profile_name
                )
                VALUES (?, ?)
                `,
                [
                    userId,
                    profileName
                ]
            );

        const profileId =
            Number(
                profileResult.insertId
            );

        // Create body profile
        await connection.query(
            `
            INSERT INTO body_profile
            (
                profile_id,
                dob,
                gender,
                height_cm,
                waist_cm,
                chest_cm,
                neck_cm,
                hip_cm,
                target_weight_kg,
                activity_level
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?)
            `,
            [
                profileId,
                dob,
                gender,
                height,
                waist,
                chest,
                neck,
                hip,
                targetWeight,
                activityLevel
            ]
        );

        let weightRecord = null;

        // Create initial weight record
        if (currentWeight !== null) {
            const weightResult =
                await connection.query(
                    `
                    INSERT INTO weight_records
                    (
                        profile_id,
                        weight_kg,
                        bmi,
                        body_fat_percentage,
                        recorded_date
                    )
                    VALUES (?, ?, ?, ?, CURDATE())
                    `,
                    [
                        profileId,
                        currentWeight,
                        bmi,
                        bodyFat
                    ]
                );

            weightRecord = {
                weight_id:
                    Number(
                        weightResult.insertId
                    ),

                weight_kg:
                    currentWeight,

                bmi,

                body_fat_percentage:
                    bodyFat
            };
        }

        await connection.commit();

        return {
            profileId,
            weightRecord
        };

    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch {
                // Ignore rollback failure
            }
        }

        throw error;

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// ============================================================
// GET ALL PROFILES OF USER
// ============================================================

const getProfilesByUser =
    async (userId) => {
        return pool.query(
            `
            SELECT
                p.profile_id,
                p.user_id,
                p.profile_name,
                p.created_at,

                bp.dob,
                bp.gender,
                bp.height_cm,
                bp.waist_cm,
                bp.chest_cm,
                bp.neck_cm,
                bp.hip_cm,
                bp.target_weight_kg,
                bp.activity_level,

                (
                    SELECT
                        wr.weight_kg

                    FROM weight_records wr

                    WHERE
                        wr.profile_id =
                        p.profile_id

                    ORDER BY
                        wr.recorded_date DESC,
                        wr.weight_id DESC

                    LIMIT 1
                ) AS current_weight_kg

            FROM profiles p

            LEFT JOIN body_profile bp
                ON p.profile_id =
                   bp.profile_id

            WHERE
                p.user_id = ?

            ORDER BY
                p.created_at ASC
            `,
            [userId]
        );
    };

// ============================================================
// GET ONE PROFILE
// ============================================================

const getProfileById =
    async (profileId) => {
        const rows =
            await pool.query(
                `
                SELECT
                    p.profile_id,
                    p.user_id,
                    p.profile_name,

                    bp.dob,
                    bp.gender,
                    bp.height_cm,
                    bp.waist_cm,
                    bp.chest_cm,
                    bp.neck_cm,
                    bp.hip_cm,
                    bp.target_weight_kg,
                    bp.activity_level

                FROM profiles p

                JOIN body_profile bp
                    ON p.profile_id =
                       bp.profile_id

                WHERE
                    p.profile_id = ?
                `,
                [profileId]
            );

        return rows[0] || null;
    };

// ============================================================
// UPDATE PROFILE NAME
// ============================================================

const updateProfileName =
    async (
        profileId,
        profileName,
        connection = pool
    ) => {
        return connection.query(
            `
            UPDATE profiles

            SET profile_name = ?

            WHERE profile_id = ?
            `,
            [
                profileName,
                profileId
            ]
        );
    };

// ============================================================
// UPDATE BODY PROFILE
// ============================================================


const updateBodyProfile =
    async (
        profileId,
        updates,
        connection = pool
    ) => {

        const fields = [];
        const values = [];


        // ====================================================
        // DOB
        // ====================================================

        if (
            Object.prototype
                .hasOwnProperty.call(
                    updates,
                    "dob"
                )
        ) {
            fields.push(
                "dob = ?"
            );

            values.push(
                updates.dob
            );
        }


        // ====================================================
        // GENDER
        // ====================================================

        if (
            Object.prototype
                .hasOwnProperty.call(
                    updates,
                    "gender"
                )
        ) {
            fields.push(
                "gender = ?"
            );

            values.push(
                updates.gender
            );
        }


        // ====================================================
        // HEIGHT
        // ====================================================

        if (
            Object.prototype
                .hasOwnProperty.call(
                    updates,
                    "height"
                )
        ) {
            fields.push(
                "height_cm = ?"
            );

            values.push(
                updates.height
            );
        }


        // ====================================================
        // WAIST
        // ====================================================

        if (
            Object.prototype
                .hasOwnProperty.call(
                    updates,
                    "waist"
                )
        ) {
            fields.push(
                "waist_cm = ?"
            );

            values.push(
                updates.waist
            );
        }


        // ====================================================
        // CHEST
        // ====================================================

        if (
            Object.prototype
                .hasOwnProperty.call(
                    updates,
                    "chest"
                )
        ) {
            fields.push(
                "chest_cm = ?"
            );

            values.push(
                updates.chest
            );
        }


        // ====================================================
        // NECK
        // ====================================================

        if (
            Object.prototype
                .hasOwnProperty.call(
                    updates,
                    "neck"
                )
        ) {
            fields.push(
                "neck_cm = ?"
            );

            values.push(
                updates.neck
            );
        }


        // ====================================================
        // HIP
        // ====================================================

        if (
            Object.prototype
                .hasOwnProperty.call(
                    updates,
                    "hip"
                )
        ) {
            fields.push(
                "hip_cm = ?"
            );

            values.push(
                updates.hip
            );
        }


        // ====================================================
        // TARGET WEIGHT
        // ====================================================

        if (
            Object.prototype
                .hasOwnProperty.call(
                    updates,
                    "targetWeight"
                )
        ) {
            fields.push(
                "target_weight_kg = ?"
            );

            values.push(
                updates.targetWeight
            );
        }


        // ====================================================
        // ACTIVITY LEVEL
        // ====================================================

        if (
            Object.prototype
                .hasOwnProperty.call(
                    updates,
                    "activityLevel"
                )
        ) {
            fields.push(
                "activity_level = ?"
            );

            values.push(
                updates.activityLevel
            );
        }


        // ====================================================
        // NOTHING TO UPDATE
        // ====================================================

        if (
            fields.length === 0
        ) {
            return null;
        }


        // Add profile ID for:
        // WHERE profile_id = ?
        values.push(
            profileId
        );


        // ====================================================
        // UPDATE DATABASE
        // ====================================================

        return connection.query(
            `
            UPDATE body_profile

            SET
                ${fields.join(
                ",\n                "
            )}

            WHERE
                profile_id = ?
            `,
            values
        );
    };

// ============================================================
// DELETE PROFILE
// ============================================================

const deleteProfile =
    async (profileId) => {
        const result =
            await pool.query(
                `
                DELETE FROM profiles
                WHERE profile_id = ?
                `,
                [profileId]
            );

        return result.affectedRows > 0;
    };
    // ============================================================
// UPDATE PROFILE WITH TRANSACTION
// ============================================================

const updateProfileTransaction =
    async ({
        profileId,
        profileName,
        bodyProfile
    }) => {

        let connection;

        try {
            connection =
                await pool.getConnection();

            await connection
                .beginTransaction();

            // Update profile name
            if (
                profileName !== undefined
            ) {
                await updateProfileName(
                    profileId,
                    profileName,
                    connection
                );
            }

            // Update body information
            if (
                Object.keys(
                    bodyProfile
                ).length > 0
            ) {
                await updateBodyProfile(
                    profileId,
                    bodyProfile,
                    connection
                );
            }

            await connection.commit();

        } catch (error) {

            if (connection) {
                try {
                    await connection.rollback();
                } catch {
                    // Ignore rollback failure
                }
            }

            throw error;

        } finally {

            if (connection) {
                connection.release();
            }
        }
    };

// ============================================================
// EXPORT SERVICES
// ============================================================

module.exports = {
    createProfile,
    getProfilesByUser,
    getProfileById,
    updateProfileName,
    updateBodyProfile,
    updateProfileTransaction,
    deleteProfile
};