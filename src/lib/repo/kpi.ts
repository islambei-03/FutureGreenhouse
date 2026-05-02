import { db } from "@/lib/db";

export type Kpi = {
  activeGreenhouses: number;
  avgTemp: number | null;
  cultures: number;
  staffToday: number;
  tasksTotal: number;
  tasksDone: number;
};

export type KpiSeries = {
  waterDaily: Array<{ day: string; liters: number }>;
  tasksDaily: Array<{ day: string; total: number; done: number }>;
  sensorsDaily: Array<{ day: string; avgTemp: number | null; avgHum: number | null }>;
};

function intervalFor(period: "day" | "week" | "month") {
  if (period === "day") return "1 day";
  if (period === "week") return "7 day";
  return "30 day";
}

export async function loadKpi(period: "day" | "week" | "month"): Promise<Kpi> {
  const where =
    period === "day"
      ? "t.created_at::timestamp >= (NOW() AT TIME ZONE 'UTC' - interval '1 day')"
      : period === "week"
        ? "t.created_at::timestamp >= (NOW() AT TIME ZONE 'UTC' - interval '7 day')"
        : "t.created_at::timestamp >= (NOW() AT TIME ZONE 'UTC' - interval '30 day')";

  const active = (await db()
    .prepare("SELECT COUNT(*)::int as c FROM greenhouses WHERE status = 'активна'")
    .get()) as { c: number };

  const cultures = (await db().prepare("SELECT COUNT(*)::int as c FROM cultures").get()) as { c: number };

  const staffToday = (await db()
    .prepare("SELECT COUNT(*)::int as c FROM employees WHERE status = 'на смене'")
    .get()) as { c: number };

  // Средняя температура по последним показаниям каждой теплицы (DISTINCT ON быстрее, чем N подзапросов).
  const temps = (await db()
    .prepare(
      `
      WITH last_sensor AS (
        SELECT DISTINCT ON (greenhouse_id)
          greenhouse_id,
          temperature
        FROM sensor_data
        ORDER BY greenhouse_id, recorded_at DESC
      )
      SELECT AVG(temperature) as "avgTemp"
      FROM last_sensor
      WHERE temperature IS NOT NULL
    `,
    )
    .get()) as { avgTemp: number | null };

  const tasksAgg = (await db()
    .prepare(
      `
      SELECT
        COUNT(*)::int as total,
        SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END)::int as done
      FROM tasks t
      WHERE ${where}
    `,
    )
    .get()) as { total: number; done: number | null };

  return {
    activeGreenhouses: active.c,
    avgTemp: temps.avgTemp,
    cultures: cultures.c,
    staffToday: staffToday.c,
    tasksTotal: tasksAgg.total,
    tasksDone: tasksAgg.done ?? 0,
  };
}

export async function loadKpiSeries(period: "day" | "week" | "month"): Promise<KpiSeries> {
  const iv = intervalFor(period);

  const waterDaily = (await db()
    .prepare(
      `
      SELECT
        to_char(date_trunc('day', scheduled_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') as day,
        COALESCE(SUM(volume_liters), 0)::float8 as liters
      FROM watering_schedule
      WHERE scheduled_at >= (NOW() AT TIME ZONE 'UTC' - ?::interval)
        AND scheduled_at <= (NOW() AT TIME ZONE 'UTC')
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    )
    .all(iv)) as Array<{ day: string; liters: number }>;

  const tasksDaily = (await db()
    .prepare(
      `
      SELECT
        to_char(date_trunc('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') as day,
        COUNT(*)::int as total,
        SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END)::int as done
      FROM tasks
      WHERE created_at >= (NOW() AT TIME ZONE 'UTC' - ?::interval)
        AND created_at <= (NOW() AT TIME ZONE 'UTC')
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    )
    .all(iv)) as Array<{ day: string; total: number; done: number }>;

  const sensorsDaily = (await db()
    .prepare(
      `
      SELECT
        to_char(date_trunc('day', recorded_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') as day,
        AVG(temperature)::float8 as "avgTemp",
        AVG(humidity)::float8 as "avgHum"
      FROM sensor_data
      WHERE recorded_at >= (NOW() AT TIME ZONE 'UTC' - ?::interval)
        AND recorded_at <= (NOW() AT TIME ZONE 'UTC')
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    )
    .all(iv)) as Array<{ day: string; avgTemp: number | null; avgHum: number | null }>;

  return { waterDaily, tasksDaily, sensorsDaily };
}

