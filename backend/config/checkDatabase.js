// Read-only probes. Never create tables or run migrations at startup.
const REQUIRED_COLUMNS = {
  users: "user_id, name, email, password_hash",
  profiles: "profile_id, user_id, profile_name",
  body_profile: "profile_id, dob, gender, height_cm, waist_cm, chest_cm, neck_cm, hip_cm, target_weight_kg, activity_level",
  weight_records: "weight_id, profile_id, weight_kg, bmi, body_fat_percentage, recorded_date, created_at",
  task_lists: "list_id, user_id, list_name, list_type",
  tasks: "task_id, list_id, title, description, is_completed, time_limit_minutes, due_at, reminder_at, reminder_sent_at, completed_at",
  nutrition_logs: "log_id, profile_id, fdc_id, food_name, quantity, unit, weight_grams, meal_type, logged_date, calories, protein_g, carbs_g, fat_g, saturated_fat_g, fiber_g, sugar_g, potassium_mg, sodium_mg, calcium_mg, iron_mg, magnesium_mg, phosphorus_mg, zinc_mg, vitamin_c_mg",
};

async function checkDatabase(database) {
  for (const [table, columns] of Object.entries(REQUIRED_COLUMNS)) {
    await database.query(`SELECT ${columns} FROM ${table} LIMIT 0`);
  }
}

module.exports = { checkDatabase };
