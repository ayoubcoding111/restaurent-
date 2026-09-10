require('dotenv').config();
const mysql = require("mysql2");

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Sara4216",
  database: process.env.DB_NAME || "restaurant_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Get promise-based connection
const promisePool = pool.promise();

// Test connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    return;
  }
  console.log("✅ Database connected successfully");
  connection.release();
});

module.exports = promisePool;
