const pool = require("./db");
const fs = require("fs");
const path = require("path");

async function initDatabase() {
  try {
    // Check if tables exist
    const check = await pool.query(
      "SELECT to_regclass('public.roles') AS exists"
    );

    if (check.rows[0].exists) {
      console.log("Database tables already exist, skipping migration.");
      return;
    }

    console.log("Initializing database tables...");
    const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
    await pool.query(schema);
    console.log("Database initialized successfully.");
  } catch (err) {
    console.error("Database initialization error:", err.message);
  }
}

module.exports = initDatabase;
