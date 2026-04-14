import type Database from "better-sqlite3";

function hasColumn(db: Database.Database, table: string, column: string) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return rows.some((r) => r.name === column);
}

export function runMigrations(db: Database.Database) {
  // v1: sensor_data.recorded_by_user_id (для истории оператора)
  if (!hasColumn(db, "sensor_data", "recorded_by_user_id")) {
    db.exec(`ALTER TABLE sensor_data ADD COLUMN recorded_by_user_id INTEGER;`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_sensor_data_recorded_by ON sensor_data(recorded_by_user_id, recorded_at);`);
  }

  // v2: login history + 2FA placeholders
  db.exec(`
    CREATE TABLE IF NOT EXISTS login_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      ip TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id, created_at DESC);`);

  if (!hasColumn(db, "users", "totp_enabled")) {
    db.exec(`ALTER TABLE users ADD COLUMN totp_enabled INTEGER NOT NULL DEFAULT 0;`);
  }
  if (!hasColumn(db, "users", "totp_secret")) {
    db.exec(`ALTER TABLE users ADD COLUMN totp_secret TEXT;`);
  }
}

