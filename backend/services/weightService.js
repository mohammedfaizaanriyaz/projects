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
            hip_cm

        FROM body_profile

        WHERE profile_id = ?
        `,
    [profileId],
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
  recordedDate,
}) => {
  let connection;

  try {
    connection = await pool.getConnection();

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
      [waist, chest, neck, hip, profileId],
    );

    // Insert new weight record
    const result = await connection.query(
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
      [profileId, weight, bmi, bodyFat, recordedDate],
    );

    await connection.commit();

    return Number(result.insertId);
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

const getWeightHistory = async (profileId) => {
  return pool.query(
    `
        SELECT
            weight_id,
            profile_id,
            weight_kg,
            bmi,
            body_fat_percentage,
            recorded_date,
            created_at

        FROM weight_records

        WHERE profile_id = ?

        ORDER BY
            recorded_date ASC,
            weight_id ASC
        `,
    [profileId],
  );
};

// ============================================================
// EXPORT SERVICES
// ============================================================

module.exports = {
  getBodyProfile,
  saveWeightRecord,
  getWeightHistory,
};
