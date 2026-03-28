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
      console.log("Database tables already exist, skipping schema init.");
    } else {
      console.log("Initializing database tables...");
      const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
      await pool.query(schema);
      console.log("Database initialized successfully.");
    }
  } catch (err) {
    console.error("Database initialization error:", err.message);
  }

  // Run migrations for existing databases
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT`);
    await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS image TEXT`);
    await pool.query(`ALTER TABLE messages ALTER COLUMN content DROP NOT NULL`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_ratings (
        id SERIAL PRIMARY KEY,
        rater_id INTEGER REFERENCES users(id),
        target_id INTEGER REFERENCES users(id),
        rating VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(rater_id, target_id)
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        reporter_id INTEGER REFERENCES users(id),
        target_id INTEGER REFERENCES users(id),
        report_type VARCHAR(100) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.error("Migration error:", err.message);
  }
}

module.exports = initDatabase;
