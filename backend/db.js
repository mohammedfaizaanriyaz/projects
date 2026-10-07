const mariadb = require("mariadb");
const fs = require("node:fs");

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 5),
  connectTimeout: 5000,
  acquireTimeout: 10000,
  queryTimeout: 10000,
  socketTimeout: 15000,
  dateStrings: true,
  timezone: "+00:00",
  ...(process.env.DB_SSL === "true" ? {
    ssl: {
      rejectUnauthorized: true,
      ...(process.env.DB_SSL_CA ? { ca: fs.readFileSync(process.env.DB_SSL_CA, "utf8") } : {}),
    },
  } : {}),
});

module.exports = pool;
