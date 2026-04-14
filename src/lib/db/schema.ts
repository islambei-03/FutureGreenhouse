import type Database from "better-sqlite3";

export function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      login TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin','agronomist','operator','viewer')),
      employee_id INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1,
      last_login TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS action_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_users_login ON users(login);
    CREATE INDEX IF NOT EXISTS idx_action_logs_user_created ON action_logs(user_id, created_at);

    CREATE TABLE IF NOT EXISTS greenhouses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('стеклянная','поликарбонатная','плёночная')),
      area REAL NOT NULL,
      temp_min REAL NOT NULL,
      temp_max REAL NOT NULL,
      humidity_min REAL NOT NULL,
      humidity_max REAL NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('активна','обслуживание','отключена')) DEFAULT 'активна',
      responsible_employee_id INTEGER,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      position TEXT NOT NULL,
      greenhouse_id INTEGER,
      phone TEXT,
      status TEXT NOT NULL CHECK (status IN ('на смене','перерыв','больничный','выходной')) DEFAULT 'на смене',
      notes TEXT,
      FOREIGN KEY (greenhouse_id) REFERENCES greenhouses(id)
    );

    CREATE TABLE IF NOT EXISTS cultures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      greenhouse_id INTEGER NOT NULL,
      section TEXT,
      planted_date TEXT,
      harvest_date TEXT,
      temp_norm REAL,
      humidity_norm REAL,
      stage TEXT NOT NULL CHECK (stage IN ('Посев','Рост','Цветение','Плодоношение','Сбор урожая')) DEFAULT 'Рост',
      notes TEXT,
      FOREIGN KEY (greenhouse_id) REFERENCES greenhouses(id)
    );

    CREATE TABLE IF NOT EXISTS sensor_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      greenhouse_id INTEGER NOT NULL,
      temperature REAL NOT NULL,
      humidity REAL NOT NULL,
      co2 REAL NOT NULL,
      recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (greenhouse_id) REFERENCES greenhouses(id)
    );

    CREATE INDEX IF NOT EXISTS idx_sensor_data_greenhouse_time ON sensor_data(greenhouse_id, recorded_at);

    CREATE TABLE IF NOT EXISTS watering_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      greenhouse_id INTEGER NOT NULL,
      watering_type TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      volume_liters REAL NOT NULL,
      is_done INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (greenhouse_id) REFERENCES greenhouses(id)
    );

    CREATE INDEX IF NOT EXISTS idx_watering_schedule_time ON watering_schedule(scheduled_at);

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      assigned_to INTEGER,
      greenhouse_id INTEGER,
      priority TEXT NOT NULL CHECK (priority IN ('обычный','высокий','срочный')) DEFAULT 'обычный',
      deadline TEXT,
      is_completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (assigned_to) REFERENCES employees(id),
      FOREIGN KEY (greenhouse_id) REFERENCES greenhouses(id)
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_deadline_completed ON tasks(is_completed, deadline);

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('тревога','предупреждение','информация','успех')) DEFAULT 'информация',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_read_created ON notifications(is_read, created_at);

    CREATE TABLE IF NOT EXISTS ai_chat_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL CHECK (role IN ('system','user','assistant')),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

