import type Database from "better-sqlite3";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

type SeedUser = {
  full_name: string;
  login: string;
  password: string;
  role: "admin" | "agronomist" | "operator" | "viewer";
};

const seedUsers: SeedUser[] = [
  { full_name: "Администратор", login: "admin", password: "admin123", role: "admin" },
  { full_name: "Агроном Асель", login: "asel", password: "asel123", role: "agronomist" },
  { full_name: "Оператор Нурлан", login: "nurlan", password: "nurlan123", role: "operator" },
  { full_name: "Директор", login: "director", password: "dir123", role: "viewer" },
];

function seedUsersIfEmpty(db: Database.Database) {
  const row = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  if (row.c > 0) return;

  const insert = db.prepare(`
    INSERT INTO users (full_name, login, password_hash, role, is_active)
    VALUES (@full_name, @login, @password_hash, @role, 1)
  `);

  const tx = db.transaction(() => {
    for (const u of seedUsers) {
      const password_hash = bcrypt.hashSync(u.password, SALT_ROUNDS);
      insert.run({ full_name: u.full_name, login: u.login, password_hash, role: u.role });
    }
  });

  tx();
}

function seedDomainIfEmpty(db: Database.Database) {
  const ghCount = db.prepare("SELECT COUNT(*) as c FROM greenhouses").get() as { c: number };
  if (ghCount.c > 0) return;

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

  const tx = db.transaction(() => {
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
      const r = insertGreenhouse.run({
        ...g,
        responsible_employee_id: null,
      }) as { lastInsertRowid: number };
      greenhouseIds.push(Number(r.lastInsertRowid));
    }

    const employees = [
      { full_name: "Илья Сатыбалдиев", position: "Инженер", greenhouse_id: greenhouseIds[2], phone: "+7 701 000 00 01", status: "на смене", notes: "" },
      { full_name: "Айгуль Жумабаева", position: "Агроном", greenhouse_id: greenhouseIds[0], phone: "+7 701 000 00 02", status: "на смене", notes: "" },
      { full_name: "Руслан Карабаев", position: "Оператор", greenhouse_id: greenhouseIds[1], phone: "+7 701 000 00 03", status: "перерыв", notes: "" },
      { full_name: "София Нурбекова", position: "Оператор", greenhouse_id: greenhouseIds[3], phone: "+7 701 000 00 04", status: "на смене", notes: "" },
      { full_name: "Данияр Тулеуов", position: "Рабочий", greenhouse_id: greenhouseIds[5], phone: "+7 701 000 00 05", status: "на смене", notes: "" },
      { full_name: "Елена Ким", position: "Лаборант", greenhouse_id: greenhouseIds[0], phone: "+7 701 000 00 06", status: "на смене", notes: "" },
      { full_name: "Мадина Ораз", position: "Агроном", greenhouse_id: greenhouseIds[4], phone: "+7 701 000 00 07", status: "выходной", notes: "" },
      { full_name: "Арман Сейдахмет", position: "Охрана", greenhouse_id: null, phone: "+7 701 000 00 08", status: "больничный", notes: "" },
    ] as const;

    const employeeIds: number[] = [];
    for (const e of employees) {
      const r = insertEmployee.run(e) as { lastInsertRowid: number };
      employeeIds.push(Number(r.lastInsertRowid));
    }

    // назначим ответственных
    db.prepare("UPDATE greenhouses SET responsible_employee_id = ? WHERE id = ?").run(employeeIds[1], greenhouseIds[0]);
    db.prepare("UPDATE greenhouses SET responsible_employee_id = ? WHERE id = ?").run(employeeIds[2], greenhouseIds[1]);
    db.prepare("UPDATE greenhouses SET responsible_employee_id = ? WHERE id = ?").run(employeeIds[0], greenhouseIds[2]);
    db.prepare("UPDATE greenhouses SET responsible_employee_id = ? WHERE id = ?").run(employeeIds[3], greenhouseIds[3]);
    db.prepare("UPDATE greenhouses SET responsible_employee_id = ? WHERE id = ?").run(employeeIds[6], greenhouseIds[4]);
    db.prepare("UPDATE greenhouses SET responsible_employee_id = ? WHERE id = ?").run(employeeIds[4], greenhouseIds[5]);

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

    for (const c of cultures) insertCulture.run(c);

    // датчики: 7 дней, каждые 6 часов = 28 точек на теплицу
    const now = new Date();
    const base = new Date(now);
    base.setDate(base.getDate() - 7);
    for (const ghId of greenhouseIds) {
      for (let i = 0; i < 28; i++) {
        const d = new Date(base);
        d.setHours(d.getHours() + i * 6);
        const recorded_at = d.toISOString().slice(0, 19).replace("T", " ");

        const t = 18 + (Math.sin(i / 3) * 3 + Math.random() * 1.5);
        const h = 55 + (Math.cos(i / 2.7) * 8 + Math.random() * 3);
        const co2 = 650 + (Math.sin(i / 4) * 120 + Math.random() * 40);
        insertSensor.run(ghId, Number(t.toFixed(1)), Number(h.toFixed(1)), Number(co2.toFixed(0)), recorded_at);
      }
    }

    // полив на неделю
    const today = new Date();
    today.setMinutes(0, 0, 0);
    for (let day = 0; day < 7; day++) {
      for (const ghId of greenhouseIds) {
        const when = new Date(today);
        when.setDate(when.getDate() + day);
        when.setHours(8 + (ghId % 3) * 2);
        const scheduled_at = when.toISOString().slice(0, 19).replace("T", " ");
        const is_done = day === 0 && (ghId % 2 === 0) ? 1 : 0;
        insertWatering.run(ghId, "капельный", scheduled_at, 25, 180 + (ghId % 4) * 25, is_done, "");
      }
    }

    // задачи (10)
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
      insertTask.run(tasks[i][0], tasks[i][1], tasks[i][2], tasks[i][3], tasks[i][4], deadlineStr, i % 5 === 0 ? 1 : 0);
    }

    // уведомления (10)
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
      insertNotification.run(notif[i][0], notif[i][1], notif[i][2], notif[i][3], created_at);
    }
  });

  tx();
}

export function seedAll(db: Database.Database) {
  seedUsersIfEmpty(db);
  seedDomainIfEmpty(db);

  // Привязка тестовых users к сотрудникам (для ограничений "оператор видит свои задачи")
  // Безопасно для уже созданной БД: обновляем только если employee_id ещё не задан.
  try {
    const agr = db
      .prepare("SELECT id FROM employees WHERE position = 'Агроном' ORDER BY id ASC LIMIT 1")
      .get() as { id: number } | undefined;
    const op = db
      .prepare("SELECT id FROM employees WHERE position = 'Оператор' ORDER BY id ASC LIMIT 1")
      .get() as { id: number } | undefined;

    if (agr?.id) db.prepare("UPDATE users SET employee_id = ? WHERE login = 'asel' AND employee_id IS NULL").run(agr.id);
    if (op?.id) db.prepare("UPDATE users SET employee_id = ? WHERE login = 'nurlan' AND employee_id IS NULL").run(op.id);
  } catch {
    // если таблицы ещё не созданы/пустые — пропускаем
  }
}

