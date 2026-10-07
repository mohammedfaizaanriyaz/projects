const pool = require("../db");

// GET CURRENT BODY PROFILE
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

// SAVE WEIGHT HISTORY ONLY.
// Current body measurements are edited through Measurements.
const saveWeightRecord = async ({
    profileId,
    weight,
    bmi,
    bodyFat,
    recordedDate
}) => {
    const result = await pool.query(
        `
        INSERT INTO weight_records (
            profile_id,
            weight_kg,
            bmi,
            body_fat_percentage,
            recorded_date
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            profileId,
            weight,
            bmi,
            bodyFat,
            recordedDate
        ]
    );

    return Number(result.insertId);
};

// GET WEIGHT HISTORY
const getWeightHistory = async (profileId) => {
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
            ON wr.profile_id = bp.profile_id
        WHERE wr.profile_id = ?
        ORDER BY
            wr.recorded_date ASC,
            wr.weight_id ASC
        `,
        [profileId]
    );
};

module.exports = {
    getBodyProfile,
    saveWeightRecord,
    getWeightHistory,
    async deleteWeightRecord(profileId, weightId) {
        const result = await pool.query(
            "DELETE FROM weight_records WHERE profile_id = ? AND weight_id = ?",
            [profileId, weightId]
        );
        return result.affectedRows > 0;
    }
};
