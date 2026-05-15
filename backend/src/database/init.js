const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// Ensure database directory exists
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath =
  process.env.DATABASE_PATH || path.join(dbDir, "notaryMonitor.db");
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Notaries table
  db.run(`
    CREATE TABLE IF NOT EXISTS notaries (
      wallet_address TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      registered_at INTEGER DEFAULT (strftime('%s', 'now')),
      last_warning_sent INTEGER,
      deactivated INTEGER DEFAULT 0
    )
  `);

  // Activity log table
  db.run(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_address TEXT,
      action TEXT,
      details TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  console.log("✅ Database initialized at:", dbPath);
});

module.exports = db;
