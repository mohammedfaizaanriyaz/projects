// Test-only adapter: real Express routes/authentication with in-memory storage.
// It never connects to or migrates a database and is excluded from the image.
if (process.env.NODE_ENV !== "test" || process.env.VYRA_E2E !== "1") throw new Error("Test server requires NODE_ENV=test and VYRA_E2E=1");
process.env.JWT_SECRET = "test-only-e2e-0123456789abcdef0123456789abcdef";
const path = require("node:path");
const dbPath = require.resolve("../backend/db");
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { query: async () => [], end: async () => {} } };
const bcrypt = require("bcryptjs");
const users = require("../backend/services/userService");
const profiles = require("../backend/services/profileService");
const weights = require("../backend/services/weightService");
const tasks = require("../backend/services/taskService");
const logs = require("../backend/services/nutritionLogService");
const { createApp } = require("../backend/app");
let nextId = 100;
const accountRows = [{ user_id: 1, name: "Test Student", email: "student@example.com", password_hash: bcrypt.hashSync("test-only-password", 4) }];
const profileRows = [{ profile_id: 10, user_id: 1, profile_name: "My Profile", dob: "2000-01-01", gender: "male", height_cm: 170, waist_cm: 80, chest_cm: 90, neck_cm: 35, hip_cm: null, target_weight_kg: 65, activity_level: "lightly_active" }];
let weightRows = [{ weight_id: 1, profile_id: 10, weight_kg: 70, bmi: 24.22, body_fat_percentage: null, recorded_date: "2026-01-01", dob: "2000-01-01" }];
let lists = [], taskRows = [], foodRows = [];
const clone = (value) => structuredClone(value);
users.findUserByEmail = async (email) => clone(accountRows.find((user) => user.email === email) || null);
users.findUserById = async (id) => clone(accountRows.find((user) => user.user_id === id) || null);
users.createAccount = async ({ name, email, passwordHash }) => { const user_id = nextId++; accountRows.push({ user_id, name, email, password_hash: passwordHash }); return user_id; };
profiles.getProfilesByUser = async (userId) => clone(profileRows.filter((profile) => profile.user_id === userId).map((profile) => ({ ...profile, current_weight_kg: weightRows.filter((row) => row.profile_id === profile.profile_id).at(-1)?.weight_kg ?? null })));
profiles.getProfileById = async (id) => clone(profileRows.find((profile) => profile.profile_id === id) || null);
profiles.createProfile = async (input) => {
  const profileId = nextId++;
  profileRows.push({ profile_id: profileId, user_id: input.userId, profile_name: input.profileName, dob: input.dob, gender: input.gender, height_cm: input.height, activity_level: input.activityLevel });
  if (input.currentWeight != null) weightRows.push({ weight_id: nextId++, profile_id: profileId, weight_kg: input.currentWeight, recorded_date: input.recordedDate, dob: input.dob });
  return { profileId, weightRecord: null };
};
profiles.updateProfileTransaction = async ({ profileId, profileName, bodyProfile }) => {
  const row = profileRows.find((profile) => profile.profile_id === profileId);
  if (profileName !== undefined) row.profile_name = profileName;
  const keys = { dob: "dob", gender: "gender", height: "height_cm", waist: "waist_cm", chest: "chest_cm", neck: "neck_cm", hip: "hip_cm", targetWeight: "target_weight_kg", activityLevel: "activity_level" };
  for (const [key, value] of Object.entries(bodyProfile)) row[keys[key]] = value;
};
weights.getBodyProfile = profiles.getProfileById;
weights.getWeightHistory = async (id) => clone(weightRows.filter((row) => row.profile_id === id).sort((a, b) => a.recorded_date.localeCompare(b.recorded_date) || a.weight_id - b.weight_id));
weights.saveWeightRecord = async ({ profileId, weight, bmi, bodyFat, recordedDate }) => {
  const id = nextId++;
  weightRows.push({ weight_id: id, profile_id: profileId, weight_kg: weight, bmi, body_fat_percentage: bodyFat, recorded_date: recordedDate, dob: profileRows.find((row) => row.profile_id === profileId).dob });
  return id;
};
weights.deleteWeightRecord = async (profileId, id) => { const before = weightRows.length; weightRows = weightRows.filter((row) => row.profile_id !== profileId || row.weight_id !== id); return before !== weightRows.length; };
tasks.getTaskSummary = async (userId) => { const owned = taskRows.filter((task) => lists.some((list) => list.user_id === userId && list.list_id === task.list_id)); return { total: owned.length, completed: owned.filter((task) => task.is_completed).length }; };
tasks.getTaskListsByUser = async (id) => clone(lists.filter((list) => list.user_id === id));
tasks.findTaskListById = async (userId, listId) => clone(lists.find((list) => list.user_id === userId && list.list_id === listId) || null);
tasks.createTaskList = async ({ userId, listName, listType }) => { const id = nextId++; lists.push({ list_id: id, user_id: userId, list_name: listName, list_type: listType }); return id; };
tasks.updateTaskList = async ({ userId, listId, listName, listType }) => Object.assign(lists.find((list) => list.user_id === userId && list.list_id === listId), { list_name: listName, list_type: listType });
tasks.deleteTaskList = async (userId, listId) => { lists = lists.filter((list) => list.user_id !== userId || list.list_id !== listId); taskRows = taskRows.filter((task) => task.list_id !== listId); return { affectedRows: 1 }; };
tasks.getTasksByList = async (_userId, id) => clone(taskRows.filter((task) => task.list_id === id));
tasks.findTaskById = async (_userId, listId, taskId) => clone(taskRows.find((task) => task.list_id === listId && task.task_id === taskId) || null);
const taskData = (input) => ({ title: input.title, description: input.description, time_limit_minutes: input.timeLimitMinutes, due_at: input.dueAt, reminder_at: input.reminderAt });
tasks.createTask = async (input) => { const id = nextId++; taskRows.push({ task_id: id, list_id: input.listId, is_completed: 0, ...taskData(input) }); return id; };
tasks.updateTask = async (input) => Object.assign(taskRows.find((task) => task.task_id === input.taskId), taskData(input));
tasks.updateTaskCompletion = async (input) => Object.assign(taskRows.find((task) => task.task_id === input.taskId), { is_completed: input.isCompleted ? 1 : 0 });
tasks.deleteTask = async (_userId, _listId, taskId) => { taskRows = taskRows.filter((task) => task.task_id !== taskId); return { affectedRows: 1 }; };
tasks.getDueReminders = async () => [];
logs.getNutritionLogsByDate = async (profileId, date) => clone(foodRows.filter((food) => food.profile_id === profileId && food.logged_date === date));
function totals(rows, date) {
  const nutrients = ["calories", "protein_g", "carbs_g", "fat_g", "fiber_g", "saturated_fat_g", "sugar_g", "potassium_mg", "sodium_mg", "calcium_mg", "iron_mg", "magnesium_mg", "phosphorus_mg", "zinc_mg", "vitamin_c_mg"];
  const result = { item_count: rows.length, logged_date: date };
  for (const key of nutrients) { const values = rows.filter((food) => food[key] != null); result[key] = values.reduce((sum, row) => sum + row[key], 0); result[`${key}_known_count`] = values.length; }
  return result;
}
logs.getNutritionTotalsByDate = async (profileId, date) => totals(await logs.getNutritionLogsByDate(profileId, date), date);
logs.getMealTotalsByDate = async (profileId, date) => { const foods = await logs.getNutritionLogsByDate(profileId, date); return ["breakfast", "lunch", "dinner", "snack", "other"].map((meal) => ({ meal_type: meal, ...totals(foods.filter((row) => row.meal_type === meal), date) })); };
logs.createNutritionLog = async (input) => { const id = nextId++; foodRows.push({ log_id: id, profile_id: input.profileId, food_name: input.foodName, fdc_id: input.fdcId, quantity: input.quantity, unit: input.unit, weight_grams: input.weightGrams, meal_type: input.mealType, logged_date: input.loggedDate, ...input.nutrition }); return id; };
logs.getNutritionLogById = async (profileId, id) => clone(foodRows.find((row) => row.profile_id === profileId && row.log_id === id));
logs.deleteNutritionLog = async (profileId, id) => { const before = foodRows.length; foodRows = foodRows.filter((row) => row.profile_id !== profileId || row.log_id !== id); return { affectedRows: before - foodRows.length }; };
// Only the external USDA HTTP response is replaced; calculations remain real.
global.fetch = async (url) => ({ ok: true, status: 200, json: async () => String(url).includes("/foods/search") ? {
  foods: [{ fdcId: 123, description: "Banana", dataType: "Foundation" }],
} : { fdcId: 123, description: "Banana", dataType: "Foundation", foodNutrients: [{ nutrient: { id: 1008, unitName: "kcal" }, amount: 89 }, { nutrient: { id: 1003, unitName: "g" }, amount: 1.1 }], foodPortions: [{ id: 1, amount: 1, gramWeight: 100, portionDescription: "1 banana" }] } });
createApp({ config: { production: false, origin: "http://127.0.0.1:4173", trustProxy: 0 }, logRequests: false,
  dist: path.resolve(__dirname, "../frontend/dist") }).listen(4173, "127.0.0.1");
