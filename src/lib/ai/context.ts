import { db } from "@/lib/db";

export async function buildGreenhouseContext(): Promise<string> {
  const rows = (await db()
    .prepare(
      `
      SELECT
        g.id,
        g.name,
        g.status,
        g.temp_min, g.temp_max,
        g.humidity_min, g.humidity_max,
        (
          SELECT sd.temperature
          FROM sensor_data sd
          WHERE sd.greenhouse_id = g.id
          ORDER BY sd.recorded_at DESC
          LIMIT 1
        ) as temperature,
        (
          SELECT sd.humidity
          FROM sensor_data sd
          WHERE sd.greenhouse_id = g.id
          ORDER BY sd.recorded_at DESC
          LIMIT 1
        ) as humidity,
        (
          SELECT sd.co2
          FROM sensor_data sd
          WHERE sd.greenhouse_id = g.id
          ORDER BY sd.recorded_at DESC
          LIMIT 1
        ) as co2,
        (
          SELECT string_agg(c.name, ', ' ORDER BY c.id)
          FROM cultures c
          WHERE c.greenhouse_id = g.id
        ) as cultures
      FROM greenhouses g
      ORDER BY g.id ASC
    `,
    )
    .all()) as Array<Record<string, unknown>>;

  const lines = rows.map((r) => {
    const t = r.temperature ?? "—";
    const h = r.humidity ?? "—";
    const c = r.co2 ?? "—";
    const cultures = r.cultures ?? "—";
    return [
      `- ${r.name} (ID ${r.id}, статус: ${r.status})`,
      `  Температура: ${t}°C (норма ${r.temp_min}–${r.temp_max})`,
      `  Влажность: ${h}% (норма ${r.humidity_min}–${r.humidity_max})`,
      `  CO2: ${c} ppm`,
      `  Культуры: ${cultures}`,
    ].join("\n");
  });

  return `Текущие данные теплиц:\n${lines.join("\n")}`;
}

export async function buildSingleGreenhouseContext(greenhouseId: number): Promise<string | null> {
  const g = (await db()
    .prepare(
      `
      SELECT id, name, status, temp_min, temp_max, humidity_min, humidity_max
      FROM greenhouses
      WHERE id = ?
    `,
    )
    .get(greenhouseId)) as
    | {
        id: number;
        name: string;
        status: string;
        temp_min: number;
        temp_max: number;
        humidity_min: number;
        humidity_max: number;
      }
    | undefined;

  if (!g) return null;

  const sensor = (await db()
    .prepare(
      `
      SELECT temperature, humidity, co2, recorded_at
      FROM sensor_data
      WHERE greenhouse_id = ?
      ORDER BY recorded_at DESC
      LIMIT 1
    `,
    )
    .get(greenhouseId)) as
    | { temperature: number | null; humidity: number | null; co2: number | null; recorded_at: string }
    | undefined;

  const nextWatering = (await db()
    .prepare(
      `
      SELECT watering_type, scheduled_at, duration_minutes, volume_liters, is_done
      FROM watering_schedule
      WHERE greenhouse_id = ?
        AND is_done = 0
      ORDER BY scheduled_at ASC
      LIMIT 1
    `,
    )
    .get(greenhouseId)) as
    | { watering_type: string; scheduled_at: string; duration_minutes: number; volume_liters: number; is_done: number }
    | undefined;

  const tasks = (await db()
    .prepare(
      `
      SELECT title, priority, deadline, is_completed
      FROM tasks
      WHERE greenhouse_id = ?
      ORDER BY
        CASE priority
          WHEN 'срочный' THEN 0
          WHEN 'высокий' THEN 1
          WHEN 'обычный' THEN 2
          ELSE 9
        END ASC,
        COALESCE(deadline, '9999-12-31') ASC
      LIMIT 8
    `,
    )
    .all(greenhouseId)) as Array<{ title: string; priority: string; deadline: string | null; is_completed: number }>;

  const cultures = (await db()
    .prepare(
      `
      SELECT name, stage, notes
      FROM cultures
      WHERE greenhouse_id = ?
      ORDER BY id DESC
      LIMIT 10
    `,
    )
    .all(greenhouseId)) as Array<{ name: string; stage: string; notes: string | null }>;

  const lines = [
    `Выбранная теплица: ${g.name} (ID ${g.id}, статус: ${g.status})`,
    `Нормы: температура ${g.temp_min}–${g.temp_max}°C, влажность ${g.humidity_min}–${g.humidity_max}%`,
    "",
    `Последние датчики: ${
      sensor
        ? `${sensor.temperature ?? "—"}°C, ${sensor.humidity ?? "—"}%, CO2 ${sensor.co2 ?? "—"} ppm (время: ${sensor.recorded_at})`
        : "нет данных"
    }`,
    `Ближайший полив: ${
      nextWatering
        ? `${nextWatering.watering_type} · ${nextWatering.scheduled_at} · ${nextWatering.duration_minutes} мин · ${nextWatering.volume_liters} л · выполнено: ${nextWatering.is_done}`
        : "нет запланированных"
    }`,
    "",
    `Культуры: ${
      cultures.length
        ? cultures.map((c) => `${c.name} (${c.stage}${c.notes ? `, ${c.notes}` : ""})`).join("; ")
        : "—"
    }`,
    `Задачи: ${
      tasks.length
        ? tasks
            .map((t) => `${t.is_completed ? "✓" : "•"} ${t.title} [${t.priority}${t.deadline ? `, до ${t.deadline}` : ""}]`)
            .join("; ")
        : "—"
    }`,
  ];

  return lines.join("\n");
}

export async function buildPlannerContext(): Promise<string> {
  const greenhouses = await buildGreenhouseContext();

  const tasks = (await db()
    .prepare(
      `
      SELECT t.title, t.priority, t.deadline, t.is_completed, g.name as greenhouse
      FROM tasks t
      LEFT JOIN greenhouses g ON g.id = t.greenhouse_id
      WHERE t.is_completed = 0
      ORDER BY COALESCE(t.deadline, '9999-12-31') ASC
      LIMIT 40
    `,
    )
    .all()) as Array<{ title: string; priority: string; deadline: string | null; is_completed: number; greenhouse: string | null }>;

  const watering = (await db()
    .prepare(
      `
      SELECT w.watering_type, w.scheduled_at, w.duration_minutes, w.volume_liters, w.is_done, g.name as greenhouse
      FROM watering_schedule w
      JOIN greenhouses g ON g.id = w.greenhouse_id
      WHERE w.scheduled_at >= NOW() - INTERVAL '1 day'
        AND w.scheduled_at <= NOW() + INTERVAL '14 days'
      ORDER BY w.scheduled_at ASC
      LIMIT 50
    `,
    )
    .all()) as Array<{
    watering_type: string;
    scheduled_at: string;
    duration_minutes: number;
    volume_liters: number;
    is_done: number;
    greenhouse: string;
  }>;

  const taskLines = tasks.length
    ? tasks.map((t) => `• ${t.title} [${t.priority}]${t.greenhouse ? ` · ${t.greenhouse}` : ""}${t.deadline ? ` · до ${t.deadline}` : ""}`).join("\n")
    : "нет открытых задач";

  const waterLines = watering.length
    ? watering
        .map(
          (w) =>
            `• ${w.greenhouse}: ${w.watering_type} · ${w.scheduled_at} · ${w.duration_minutes} мин · ${w.volume_liters} л · ${w.is_done ? "выполнено" : "ожидает"}`,
        )
        .join("\n")
    : "нет записей на ближайшие 2 недели";

  return [greenhouses, "", "Открытые задачи:", taskLines, "", "График полива (±2 недели):", waterLines].join("\n");
}
