import bcrypt from "bcrypt";
import type { Pool } from "pg";
import { createDbAdapter, type DbAdapter } from "@/lib/db/adapter";

const SALT_ROUNDS = 10;

type SeedUser = {
  full_name: string;
  login: string;
  password: string;
  role: "admin" | "director" | "agronomist" | "worker";
};

const seedUsers: SeedUser[] = [
  { full_name: "Администратор", login: "admin", password: "admin123", role: "admin" },
  { full_name: "Агроном Асель", login: "asel", password: "asel123", role: "agronomist" },
  { full_name: "Рабочий Нурлан", login: "nurlan", password: "nurlan123", role: "worker" },
  { full_name: "Директор", login: "director", password: "dir123", role: "director" },
];

async function withTransaction(pool: Pool, fn: (a: DbAdapter) => Promise<void>) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const a = createDbAdapter(c);
    await fn(a);
    await c.query("COMMIT");
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}

async function seedUsersIfEmpty(pool: Pool, a: DbAdapter) {
  const row = (await a.prepare("SELECT COUNT(*) as c FROM users").get()) as { c: number } | undefined;
  if (!row || row.c > 0) return;

  await withTransaction(pool, async (tx) => {
    const insert = tx.prepare(`
    INSERT INTO users (full_name, login, password_hash, role, is_active)
    VALUES (@full_name, @login, @password_hash, @role, 1)
  `);
    for (const u of seedUsers) {
      const password_hash = bcrypt.hashSync(u.password, SALT_ROUNDS);
      await insert.run({ full_name: u.full_name, login: u.login, password_hash, role: u.role });
    }
  });
}

/** Плотные демо-данные для графиков/отчётов; безопасно вызывать повторно (пропуск при большом объёме). */
export async function backfillRichDemoData(pool: Pool) {
  const cnt = (await pool.query<{ c: string }>("SELECT COUNT(*)::text AS c FROM sensor_data")).rows[0]?.c ?? "0";
  if (Number(cnt) >= 2200) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`
      INSERT INTO sensor_data (greenhouse_id, temperature, humidity, co2, recorded_at)
      SELECT
        g.id,
        round((20::double precision + sin(extract(epoch FROM s.ts) / 43200.0) * 4.5 + (g.id % 4))::numeric, 1)::double precision,
        round((58::double precision + cos(extract(epoch FROM s.ts) / 52000.0) * 14.0 + (g.id % 3))::numeric, 1)::double precision,
        round((680::double precision + sin(extract(epoch FROM s.ts) / 77000.0) * 160.0 + g.id * 12.0)::numeric, 0)::double precision,
        s.ts
      FROM greenhouses g
      CROSS JOIN LATERAL (
        SELECT generate_series(
          date_trunc('hour', NOW()) - interval '58 days',
          date_trunc('hour', NOW()),
          interval '3 hours'
        ) AS ts
      ) s
    `);

    await client.query(`
      INSERT INTO watering_schedule (greenhouse_id, watering_type, scheduled_at, duration_minutes, volume_liters, is_done, notes)
      SELECT
        g.id,
        'капельный',
        NOW() - (n || ' days')::interval - ((g.id % 7) || ' hours')::interval,
        22 + (n % 18),
        (130 + (g.id * 41 + n * 17) % 240)::double precision,
        1,
        'demo'
      FROM greenhouses g
      CROSS JOIN generate_series(1, 56) AS n
    `);

    await client.query(`
      INSERT INTO watering_schedule (greenhouse_id, watering_type, scheduled_at, duration_minutes, volume_liters, is_done, notes)
      SELECT
        g.id,
        'капельный',
        NOW() + (n || ' days')::interval + ((g.id % 5) || ' hours')::interval,
        25,
        (150 + (g.id * 31 + n * 9) % 200)::double precision,
        CASE WHEN n <= 2 THEN 0 ELSE 1 END,
        ''
      FROM greenhouses g
      CROSS JOIN generate_series(0, 12) AS n
    `);

    await client.query(`
      INSERT INTO tasks (title, description, assigned_to, greenhouse_id, priority, deadline, is_completed, created_at)
      SELECT
        'Демо-задача №' || n,
        'Автозаполнение для отчётов и графиков',
        (SELECT id FROM employees ORDER BY id LIMIT 1),
        (SELECT id FROM greenhouses ORDER BY id LIMIT 1 OFFSET ((n - 1) % GREATEST((SELECT COUNT(*)::int FROM greenhouses), 1))),
        (ARRAY['обычный','высокий','срочный']::text[])[1 + ((n - 1) % 3)],
        NOW() + ((n % 12) || ' days')::interval,
        CASE WHEN n % 4 = 0 THEN 1 ELSE 0 END,
        NOW() - ((n * 14) || ' hours')::interval - ((n % 50) || ' days')::interval
      FROM generate_series(1, 140) AS n
      WHERE EXISTS (SELECT 1 FROM employees LIMIT 1)
        AND EXISTS (SELECT 1 FROM greenhouses LIMIT 1)
    `);

    await client.query(`
      INSERT INTO cultures (name, greenhouse_id, section, planted_date, harvest_date, temp_norm, humidity_norm, stage, notes)
      SELECT
        'Демо-сбор ' || g.id || '-' || n,
        g.id,
        'Demo-' || n,
        (CURRENT_DATE - 100 - n)::date,
        (CURRENT_DATE - (n % 32))::date,
        22::double precision,
        62::double precision,
        'Сбор урожая',
        'demo-rich'
      FROM greenhouses g
      CROSS JOIN generate_series(1, 3) AS n
    `);

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function seedAll(pool: Pool) {
  const a = createDbAdapter(pool);
  await seedUsersIfEmpty(pool, a);
  await seedDomainIfEmpty(pool, a);
  try {
    const agr = (await a
      .prepare("SELECT id FROM employees WHERE position = 'Агроном' ORDER BY id ASC LIMIT 1")
      .get()) as { id: number } | undefined;
    const worker = (await a
      .prepare("SELECT id FROM employees WHERE position = 'Рабочий' ORDER BY id ASC LIMIT 1")
      .get()) as { id: number } | undefined;

    if (agr?.id) await a.prepare("UPDATE users SET employee_id = ? WHERE login = 'asel' AND employee_id IS NULL").run(agr.id);
    if (worker?.id) await a.prepare("UPDATE users SET employee_id = ? WHERE login = 'nurlan' AND employee_id IS NULL").run(worker.id);
  } catch {
    // пусто
  }

  await backfillRichDemoData(pool);
}

async function seedDomainIfEmpty(pool: Pool, a: DbAdapter) {
  const ghCount = (await a.prepare("SELECT COUNT(*) as c FROM greenhouses").get()) as { c: number } | undefined;
  if (!ghCount || ghCount.c > 0) return;

  await withTransaction(pool, async (db) => {
    const insertGreenhouse = db.prepare(`
    INSERT INTO greenhouses (name, type, area, temp_min, temp_max, humidity_min, humidity_max, status, responsible_employee_id, notes)
    VALUES (@name, @type, @area, @temp_min, @temp_max, @humidity_min, @humidity_max, @status, @responsible_employee_id, @notes)
  `);
    const insertEmployee = db.prepare(`
    INSERT INTO employees (full_name, position, greenhouse_id, phone, status, notes)
    VALUES (@full_name, @position, @greenhouse_id, @phone, @status, @notes)
  `);
    const insertCulture = db.prepare(`
    INSERT INTO cultures (name, greenhouse_id, section, planted_date, harvest_date, temp_norm, humidity_norm, stage, notes)
    VALUES (@name, @greenhouse_id, @section, @planted_date, @harvest_date, @temp_norm, @humidity_norm, @stage, @notes)
  `);
    const insertSensor = db.prepare(`
    INSERT INTO sensor_data (greenhouse_id, temperature, humidity, co2, recorded_at)
    VALUES (?, ?, ?, ?, ?)
  `);
    const insertWatering = db.prepare(`
    INSERT INTO watering_schedule (greenhouse_id, watering_type, scheduled_at, duration_minutes, volume_liters, is_done, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
    const insertTask = db.prepare(`
    INSERT INTO tasks (title, description, assigned_to, greenhouse_id, priority, deadline, is_completed)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
    const insertNotification = db.prepare(`
    INSERT INTO notifications (title, message, type, is_read, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

    const greenhouseIds: number[] = [];
    const greenhouses = [
      { name: "Теплица №1 — Томаты", type: "стеклянная", area: 420, temp_min: 20, temp_max: 26, humidity_min: 55, humidity_max: 75, status: "активна", notes: "Основной блок томатов" },
      { name: "Теплица №2 — Огурцы", type: "поликарбонатная", area: 380, temp_min: 21, temp_max: 27, humidity_min: 60, humidity_max: 80, status: "активна", notes: "Высокая влажность допустима" },
      { name: "Теплица №3 — Салаты", type: "плёночная", area: 260, temp_min: 16, temp_max: 22, humidity_min: 50, humidity_max: 70, status: "обслуживание", notes: "Проверка вентиляции" },
      { name: "Теплица №4 — Перец", type: "стеклянная", area: 310, temp_min: 20, temp_max: 28, humidity_min: 50, humidity_max: 70, status: "активна", notes: "" },
      { name: "Теплица №5 — Клубника", type: "поликарбонатная", area: 290, temp_min: 18, temp_max: 24, humidity_min: 55, humidity_max: 75, status: "отключена", notes: "На консервации" },
      { name: "Теплица №6 — Микрозелень", type: "плёночная", area: 180, temp_min: 18, temp_max: 23, humidity_min: 45, humidity_max: 65, status: "активна", notes: "Частый полив" },
    ] as const;

    for (const g of greenhouses) {
      const r = (await insertGreenhouse.run({
        ...g,
        responsible_employee_id: null,
      })) as { lastInsertRowid: number };
      greenhouseIds.push(Number(r.lastInsertRowid));
    }

    // Упрощённый состав персонала по ТЗ диплома: агроном + рабочие.
    const employees = [
      { full_name: "Айгуль Жумабаева", position: "Агроном", greenhouse_id: greenhouseIds[0], phone: "+7 701 000 00 02", status: "на смене", notes: "" },
      { full_name: "Руслан Карабаев", position: "Рабочий", greenhouse_id: greenhouseIds[1], phone: "+7 701 000 00 03", status: "на смене", notes: "" },
      { full_name: "София Нурбекова", position: "Рабочий", greenhouse_id: greenhouseIds[3], phone: "+7 701 000 00 04", status: "на смене", notes: "" },
    ] as const;

    const employeeIds: number[] = [];
    for (const e of employees) {
      const r = (await insertEmployee.run(e)) as { lastInsertRowid: number };
      employeeIds.push(Number(r.lastInsertRowid));
    }

    // Ответственные назначаем из доступного набора (агроном/рабочие).
    await db.prepare("UPDATE greenhouses SET responsible_employee_id = ? WHERE id = ?").run(employeeIds[0], greenhouseIds[0]);
    await db.prepare("UPDATE greenhouses SET responsible_employee_id = ? WHERE id = ?").run(employeeIds[1], greenhouseIds[1]);
    await db.prepare("UPDATE greenhouses SET responsible_employee_id = ? WHERE id = ?").run(employeeIds[1], greenhouseIds[2]);
    await db.prepare("UPDATE greenhouses SET responsible_employee_id = ? WHERE id = ?").run(employeeIds[2], greenhouseIds[3]);
    await db.prepare("UPDATE greenhouses SET responsible_employee_id = ? WHERE id = ?").run(employeeIds[0], greenhouseIds[4]);
    await db.prepare("UPDATE greenhouses SET responsible_employee_id = ? WHERE id = ?").run(employeeIds[2], greenhouseIds[5]);

    const cultures = [
      { name: "Томат Черри", greenhouse_id: greenhouseIds[0], section: "A1", planted_date: "2026-03-10", harvest_date: "2026-06-20", temp_norm: 24, humidity_norm: 65, stage: "Плодоношение", notes: "" },
      { name: "Томат Розовый", greenhouse_id: greenhouseIds[0], section: "A2", planted_date: "2026-03-15", harvest_date: "2026-06-30", temp_norm: 24, humidity_norm: 65, stage: "Цветение", notes: "" },
      { name: "Огурец Герман", greenhouse_id: greenhouseIds[1], section: "B1", planted_date: "2026-03-20", harvest_date: "2026-06-10", temp_norm: 25, humidity_norm: 75, stage: "Рост", notes: "" },
      { name: "Огурец Кураж", greenhouse_id: greenhouseIds[1], section: "B2", planted_date: "2026-03-22", harvest_date: "2026-06-12", temp_norm: 25, humidity_norm: 75, stage: "Цветение", notes: "" },
      { name: "Салат Романо", greenhouse_id: greenhouseIds[2], section: "C1", planted_date: "2026-04-01", harvest_date: "2026-04-28", temp_norm: 19, humidity_norm: 60, stage: "Рост", notes: "" },
      { name: "Салат Айсберг", greenhouse_id: greenhouseIds[2], section: "C2", planted_date: "2026-04-03", harvest_date: "2026-04-30", temp_norm: 19, humidity_norm: 60, stage: "Посев", notes: "" },
      { name: "Перец сладкий", greenhouse_id: greenhouseIds[3], section: "D1", planted_date: "2026-02-28", harvest_date: "2026-07-01", temp_norm: 26, humidity_norm: 60, stage: "Рост", notes: "" },
      { name: "Перец острый", greenhouse_id: greenhouseIds[3], section: "D2", planted_date: "2026-03-05", harvest_date: "2026-07-10", temp_norm: 26, humidity_norm: 60, stage: "Цветение", notes: "" },
      { name: "Клубника Альба", greenhouse_id: greenhouseIds[4], section: "E1", planted_date: "2026-01-15", harvest_date: "2026-05-20", temp_norm: 22, humidity_norm: 70, stage: "Сбор урожая", notes: "" },
      { name: "Микрозелень горох", greenhouse_id: greenhouseIds[5], section: "F1", planted_date: "2026-04-06", harvest_date: "2026-04-16", temp_norm: 21, humidity_norm: 55, stage: "Рост", notes: "" },
    ] as const;

    for (const c of cultures) await insertCulture.run(c);

    const now = new Date();
    const base = new Date(now);
    base.setDate(base.getDate() - 14);
    for (const ghId of greenhouseIds) {
      for (let i = 0; i < 72; i++) {
        const d = new Date(base);
        d.setHours(d.getHours() + i * 5);
        const recorded_at = d.toISOString().slice(0, 19).replace("T", " ");

        const t = 18 + (Math.sin(i / 3) * 3 + Math.random() * 1.5);
        const h = 55 + (Math.cos(i / 2.7) * 8 + Math.random() * 3);
        const co2 = 650 + (Math.sin(i / 4) * 120 + Math.random() * 40);
        await insertSensor.run(ghId, Number(t.toFixed(1)), Number(h.toFixed(1)), Number(co2.toFixed(0)), recorded_at);
      }
    }

    const today = new Date();
    today.setMinutes(0, 0, 0);
    for (let day = -40; day <= 14; day++) {
      for (const ghId of greenhouseIds) {
        const when = new Date(today);
        when.setDate(when.getDate() + day);
        when.setHours(8 + (ghId % 3) * 2, 0, 0, 0);
        const scheduled_at = when.toISOString().slice(0, 19).replace("T", " ");
        const is_done = day <= 0 ? 1 : day <= 2 && ghId % 3 === 0 ? 1 : 0;
        const vol = 150 + (ghId % 6) * 28 + (Math.abs(day) % 9) * 18;
        await insertWatering.run(ghId, "капельный", scheduled_at, 25, vol, is_done, "");
      }
    }

    const tasks = [
      ["Проверить вентиляцию", "Сверить показания и работу вентиляторов", employeeIds[0], greenhouseIds[2], "срочный"],
      ["Подвязка томатов", "Подвязать ряд A1 и A2", employeeIds[4], greenhouseIds[0], "высокий"],
      ["Калибровка CO2 датчика", "Проверить калибровку в теплице №2", employeeIds[2], greenhouseIds[1], "обычный"],
      ["Осмотр капельной ленты", "Проверить протечки", employeeIds[3], greenhouseIds[3], "обычный"],
      ["Внесение удобрений", "По схеме питания на неделю", employeeIds[1], greenhouseIds[0], "высокий"],
      ["Сбор урожая клубники", "Сбор и сортировка", employeeIds[6], greenhouseIds[4], "срочный"],
      ["Проверить влажность субстрата", "Сделать замеры в 3 точках", employeeIds[5], greenhouseIds[5], "обычный"],
      ["Замена фильтра", "Фильтр полива — замена", employeeIds[0], greenhouseIds[1], "высокий"],
      ["Уборка секции C1", "Санитарная обработка", employeeIds[4], greenhouseIds[2], "обычный"],
      ["Осмотр растений на вредителей", "Визуальный контроль", employeeIds[1], greenhouseIds[3], "высокий"],
    ] as const;
    for (let i = 0; i < tasks.length; i++) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + (i % 4));
      deadline.setHours(18, 0, 0, 0);
      const deadlineStr = deadline.toISOString().slice(0, 19).replace("T", " ");
      const assignee = employeeIds[i % employeeIds.length]!;
      await insertTask.run(
        tasks[i][0],
        tasks[i][1],
        assignee,
        tasks[i][3],
        tasks[i][4],
        deadlineStr,
        i % 5 === 0 ? 1 : 0,
      );
    }

    const notif = [
      ["Критическое отклонение температуры", "Теплица №3: температура ниже нормы", "тревога", 0],
      ["Высокий CO2", "Теплица №2: CO2 выше рекомендованного уровня", "предупреждение", 0],
      ["Полив выполнен", "Теплица №1: утренний полив отмечен выполненным", "успех", 1],
      ["Новая задача", "Назначена задача: Подвязка томатов", "информация", 0],
      ["Плановое обслуживание", "Теплица №3 переведена в режим обслуживания", "информация", 1],
      ["Сбор урожая", "Клубника готова к сбору", "предупреждение", 0],
      ["Датчики обновлены", "Получены новые показания", "успех", 1],
      ["Пониженная влажность", "Теплица №6: влажность ниже нормы", "предупреждение", 0],
      ["Отключение теплицы", "Теплица №5 отключена", "информация", 1],
      ["Тревога CO2", "Теплица №1: резкий рост CO2", "тревога", 0],
    ] as const;
    for (let i = 0; i < notif.length; i++) {
      const created = new Date();
      created.setMinutes(created.getMinutes() - i * 45);
      const created_at = created.toISOString().slice(0, 19).replace("T", " ");
      await insertNotification.run(notif[i][0], notif[i][1], notif[i][2], notif[i][3], created_at);
    }
  });
}
