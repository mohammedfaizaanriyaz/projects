const pool = require("../db");

// ============================================================
// GET BODY PROFILE
// ============================================================

const getBodyProfile = async (profileId) => {
    const rows = await pool.query(
        `
        SELECT
            gender,
            height_cm,
            waist_cm,
            chest_cm,
            neck_cm,
            hip_cm,
            dob

        FROM body_profile

        WHERE profile_id = ?
        `,
        [profileId]
    );

    return rows[0] || null;
};

// ============================================================
// SAVE WEIGHT RECORD
// Also updates latest measurements
// ============================================================

const saveWeightRecord = async ({
    profileId,
    weight,
    bmi,
    bodyFat,
    waist,
    chest,
    neck,
    hip,
    recordedDate
}) => {
    let connection;

    try {
        connection =
            await pool.getConnection();

        await connection.beginTransaction();

        // Update latest body measurements
        await connection.query(
            `
            UPDATE body_profile

            SET
                waist_cm = ?,
                chest_cm = ?,
                neck_cm = ?,
                hip_cm = ?

            WHERE profile_id = ?
            `,
            [
                waist,
                chest,
                neck,
                hip,
                profileId
            ]
        );

        // Insert new weight record
        const result =
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

                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?,
                    COALESCE(
                        ?,
                        CURDATE()
                    )
                )
                `,
                [
                    profileId,
                    weight,
                    bmi,
                    bodyFat,
                    recordedDate
                ]
            );

        await connection.commit();

        return Number(
            result.insertId
        );

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
// GET WEIGHT HISTORY
// ============================================================

const getWeightHistory = async (
    profileId
) => {
    return pool.query(
        `
        SELECT
            wr.weight_id,
            wr.profile_id,
            wr.weight_kg,
            wr.bmi,
            wr.body_fat_percentage,
            wr.recorded_date,
            wr.created_at,

            bp.dob

        FROM weight_records wr

        JOIN body_profile bp
            ON wr.profile_id =
               bp.profile_id

        WHERE
            wr.profile_id = ?

        ORDER BY
            wr.recorded_date ASC,
            wr.weight_id ASC
        `,
        [profileId]
    );
};
// ============================================================
// EXPORT SERVICES
// ============================================================

module.exports = {
    getBodyProfile,
    saveWeightRecord,
    getWeightHistory
};