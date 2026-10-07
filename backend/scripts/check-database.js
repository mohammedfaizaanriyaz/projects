const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env"), quiet: true });
require("../config/validateEnv")();
const pool = require("../db");
const { checkDatabase } = require("../config/checkDatabase");

(async () => {
  try {
    await checkDatabase(pool);
    console.log("Database connection and required columns are ready. No database changes were made.");
  } catch (error) {
    console.error(`Database check failed (${error.code || "unknown error"}). Check connectivity, grants, and docs/MANUAL_DATABASE.md.`);
    process.exitCode = 1;
  } finally { await pool.end(); }
})();
