import type { Pool } from "pg";

export async function initSchema(pool: Pool) {
  // Порядок: users → greenhouses → employees → остальные (FK)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      login TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin','director','agronomist','worker')),
      employee_id INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1,
      last_login TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS action_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_users_login ON users(login);
    CREATE INDEX IF NOT EXISTS idx_action_logs_user_created ON action_logs(user_id, created_at);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS greenhouses (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('стеклянная','поликарбонатная','плёночная')),
      area DOUBLE PRECISION NOT NULL,
      temp_min DOUBLE PRECISION NOT NULL,
      temp_max DOUBLE PRECISION NOT NULL,
      humidity_min DOUBLE PRECISION NOT NULL,
      humidity_max DOUBLE PRECISION NOT NULL,
      status TEXT NOT NULL DEFAULT 'активна' CHECK (status IN ('активна','обслуживание','отключена')),
      responsible_employee_id INTEGER,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      position TEXT NOT NULL,
      greenhouse_id INTEGER REFERENCES greenhouses(id) ON DELETE SET NULL,
      phone TEXT,
      status TEXT NOT NULL DEFAULT 'на смене' CHECK (status IN ('на смене','перерыв','больничный','выходной')),
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS cultures (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      greenhouse_id INTEGER NOT NULL REFERENCES greenhouses(id) ON DELETE CASCADE,
      section TEXT,
      planted_date DATE,
      harvest_date DATE,
      temp_norm DOUBLE PRECISION,
      humidity_norm DOUBLE PRECISION,
      stage TEXT NOT NULL DEFAULT 'Рост' CHECK (stage IN ('Посев','Рост','Цветение','Плодоношение','Сбор урожая')),
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS sensor_data (
      id SERIAL PRIMARY KEY,
      greenhouse_id INTEGER NOT NULL REFERENCES greenhouses(id) ON DELETE CASCADE,
      temperature DOUBLE PRECISION NOT NULL,
      humidity DOUBLE PRECISION NOT NULL,
      co2 DOUBLE PRECISION NOT NULL,
      recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_sensor_data_greenhouse_time ON sensor_data(greenhouse_id, recorded_at DESC);

    CREATE TABLE IF NOT EXISTS watering_schedule (
      id SERIAL PRIMARY KEY,
      greenhouse_id INTEGER NOT NULL REFERENCES greenhouses(id) ON DELETE CASCADE,
      watering_type TEXT NOT NULL,
      scheduled_at TIMESTAMPTZ NOT NULL,
      duration_minutes INTEGER NOT NULL,
      volume_liters DOUBLE PRECISION NOT NULL,
      is_done INTEGER NOT NULL DEFAULT 0,
      notes TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_watering_schedule_time ON watering_schedule(scheduled_at);

    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      assigned_to INTEGER REFERENCES employees(id) ON DELETE SET NULL,
      greenhouse_id INTEGER REFERENCES greenhouses(id) ON DELETE SET NULL,
      priority TEXT NOT NULL DEFAULT 'обычный' CHECK (priority IN ('обычный','высокий','срочный')),
      deadline TIMESTAMPTZ,
      is_completed INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_deadline_completed ON tasks(is_completed, deadline);

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'информация' CHECK (type IN ('тревога','предупреждение','информация','успех')),
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_read_created ON notifications(is_read, created_at);

    CREATE TABLE IF NOT EXISTS ai_chat_history (
      id SERIAL PRIMARY KEY,
      role TEXT NOT NULL CHECK (role IN ('system','user','assistant')),
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}
