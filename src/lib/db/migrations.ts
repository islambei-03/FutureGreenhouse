import type { Pool } from "pg";

async function hasColumn(pool: Pool, table: string, column: string) {
  const r = await pool.query<{ c: string }>(
    `SELECT count(*)::text as c
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [table, column],
  );
  return Number(r.rows[0]?.c ?? 0) > 0;
}

async function columnType(pool: Pool, table: string, column: string) {
  const r = await pool.query<{ t: string }>(
    `SELECT data_type as t
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
     LIMIT 1`,
    [table, column],
  );
  return r.rows[0]?.t ?? null;
}

async function ensureTimestamptz(pool: Pool, table: string, column: string, usingExpr: string) {
  const t = await columnType(pool, table, column);
  if (!t) return;
  if (t === "timestamp with time zone") return;
  // Старые версии хранили DEFAULT как строку (to_char...). Сначала сбрасываем DEFAULT,
  // иначе Postgres не сможет привести default-выражение автоматически.
  await pool.query(`ALTER TABLE ${table} ALTER COLUMN ${column} DROP DEFAULT;`);
  await pool.query(`ALTER TABLE ${table} ALTER COLUMN ${column} TYPE timestamptz USING (${usingExpr});`);
}

async function ensureDate(pool: Pool, table: string, column: string, usingExpr: string) {
  const t = await columnType(pool, table, column);
  if (!t) return;
  if (t === "date") return;
  await pool.query(`ALTER TABLE ${table} ALTER COLUMN ${column} TYPE date USING (${usingExpr});`);
}

export async function runMigrations(pool: Pool) {
  // v0: нормализуем типы дат/времени (раньше были TEXT)
  const tsTextUtc = (col: string) =>
    `CASE WHEN ${col} IS NULL OR ${col} = '' THEN NULL ELSE (to_timestamp(${col}, 'YYYY-MM-DD HH24:MI:SS') AT TIME ZONE 'UTC') END`;
  await ensureTimestamptz(pool, "users", "created_at", tsTextUtc("created_at"));
  await pool.query(`ALTER TABLE users ALTER COLUMN created_at SET DEFAULT now();`);
  await ensureTimestamptz(pool, "users", "last_login", tsTextUtc("last_login"));
  await ensureTimestamptz(pool, "action_logs", "created_at", tsTextUtc("created_at"));
  await pool.query(`ALTER TABLE action_logs ALTER COLUMN created_at SET DEFAULT now();`);
  await ensureTimestamptz(pool, "greenhouses", "created_at", tsTextUtc("created_at"));
  await pool.query(`ALTER TABLE greenhouses ALTER COLUMN created_at SET DEFAULT now();`);
  await ensureDate(pool, "cultures", "planted_date", "NULLIF(planted_date, '')::date");
  await ensureDate(pool, "cultures", "harvest_date", "NULLIF(harvest_date, '')::date");
  await ensureTimestamptz(pool, "sensor_data", "recorded_at", tsTextUtc("recorded_at"));
  await pool.query(`ALTER TABLE sensor_data ALTER COLUMN recorded_at SET DEFAULT now();`);
  await ensureTimestamptz(pool, "watering_schedule", "scheduled_at", tsTextUtc("scheduled_at"));
  await ensureTimestamptz(pool, "tasks", "created_at", tsTextUtc("created_at"));
  await pool.query(`ALTER TABLE tasks ALTER COLUMN created_at SET DEFAULT now();`);
  await ensureTimestamptz(pool, "tasks", "deadline", tsTextUtc("deadline"));
  await ensureTimestamptz(pool, "notifications", "created_at", tsTextUtc("created_at"));
  await pool.query(`ALTER TABLE notifications ALTER COLUMN created_at SET DEFAULT now();`);
  await ensureTimestamptz(pool, "ai_chat_history", "created_at", tsTextUtc("created_at"));
  await pool.query(`ALTER TABLE ai_chat_history ALTER COLUMN created_at SET DEFAULT now();`);

  if (!(await hasColumn(pool, "sensor_data", "recorded_by_user_id"))) {
    await pool.query(`ALTER TABLE sensor_data ADD COLUMN recorded_by_user_id INTEGER;`);
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_sensor_data_recorded_by ON sensor_data(recorded_by_user_id, recorded_at);`,
    );
  }
  // Индекс для быстрого поиска последних показаний
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_sensor_data_gh_recorded_desc ON sensor_data(greenhouse_id, recorded_at DESC);`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS login_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ip TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id, created_at DESC);`);

  // Нормализуем login_history.created_at если он был TEXT (ранние версии).
  await ensureTimestamptz(pool, "login_history", "created_at", "CASE WHEN created_at IS NULL OR created_at='' THEN NULL ELSE (to_timestamp(created_at, 'YYYY-MM-DD HH24:MI:SS') AT TIME ZONE 'UTC') END");
  await pool.query(`ALTER TABLE login_history ALTER COLUMN created_at SET DEFAULT now();`);

  if (!(await hasColumn(pool, "users", "totp_enabled"))) {
    await pool.query(`ALTER TABLE users ADD COLUMN totp_enabled INTEGER NOT NULL DEFAULT 0;`);
  }
  if (!(await hasColumn(pool, "users", "totp_secret"))) {
    await pool.query(`ALTER TABLE users ADD COLUMN totp_secret TEXT;`);
  }

  // v1: упрощение ролей: admin/director/agronomist/worker (старые: operator/viewer)
  // Важно: сначала убираем старый CHECK, затем обновляем данные, затем ставим новый CHECK.
  await pool.query(`ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;`);
  await pool.query(`
    DO $$
    DECLARE c record;
    BEGIN
      FOR c IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = con.connamespace
        WHERE nsp.nspname = 'public'
          AND rel.relname = 'users'
          AND con.contype = 'c'
          AND pg_get_constraintdef(con.oid) ILIKE '%role%'
      LOOP
        EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT IF EXISTS %I', c.conname);
      END LOOP;
    END $$;
  `);
  // - operator -> worker
  // - viewer -> director
  await pool.query(`
    UPDATE users
    SET role = CASE role
      WHEN 'operator' THEN 'worker'
      WHEN 'viewer' THEN 'director'
      ELSE role
    END
    WHERE role IN ('operator', 'viewer');
  `);
  await pool.query(`
    ALTER TABLE public.users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('admin','director','agronomist','worker'));
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    INSERT INTO app_settings (key, value) VALUES ('sensor_simulation_enabled', '0')
    ON CONFLICT (key) DO NOTHING;
  `);

  await pool.query(`UPDATE employees SET position = 'Рабочий' WHERE position IS DISTINCT FROM 'Рабочий';`);

  if (!(await hasColumn(pool, "notifications", "target_user_id"))) {
    await pool.query(`ALTER TABLE notifications ADD COLUMN target_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;`);
    await pool.query(
      `CREATE INDEX IF NOT EXISTS idx_notifications_target_user ON notifications(target_user_id, is_read, created_at DESC);`,
    );
  }
}
