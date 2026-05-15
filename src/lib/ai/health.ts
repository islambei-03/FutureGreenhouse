import { db } from "@/lib/db";

export type GreenhouseHealth = {
  id: number;
  name: string;
  status: string;
  healthPct: number;
  factors: string[];
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/** Оценка 0–100: датчики, просроченные задачи, пропущенный полив, статус теплицы. */
export async function computeGreenhouseHealth(): Promise<GreenhouseHealth[]> {
  const rows = (await db()
    .prepare(
      `
      SELECT
        g.id,
        g.name,
        g.status,
        g.temp_min,
        g.temp_max,
        g.humidity_min,
        g.humidity_max,
        (
          SELECT sd.temperature FROM sensor_data sd
          WHERE sd.greenhouse_id = g.id ORDER BY sd.recorded_at DESC LIMIT 1
        ) as temperature,
        (
          SELECT sd.humidity FROM sensor_data sd
          WHERE sd.greenhouse_id = g.id ORDER BY sd.recorded_at DESC LIMIT 1
        ) as humidity,
        (
          SELECT COUNT(*)::int FROM tasks t
          WHERE t.greenhouse_id = g.id AND t.is_completed = 0
            AND t.deadline IS NOT NULL AND t.deadline < (NOW() AT TIME ZONE 'UTC')
        ) as overdue_tasks,
        (
          SELECT COUNT(*)::int FROM watering_schedule w
          WHERE w.greenhouse_id = g.id AND w.is_done = 0
            AND w.scheduled_at < (NOW() AT TIME ZONE 'UTC')
        ) as missed_watering
      FROM greenhouses g
      ORDER BY g.id ASC
    `,
    )
    .all()) as Array<{
    id: number;
    name: string;
    status: string;
    temp_min: number;
    temp_max: number;
    humidity_min: number;
    humidity_max: number;
    temperature: number | null;
    humidity: number | null;
    overdue_tasks: number;
    missed_watering: number;
  }>;

  return rows.map((g) => {
    let score = 100;
    const factors: string[] = [];

    if (g.status !== "активна") {
      score -= 20;
      factors.push(`Статус: ${g.status}`);
    }

    const t = g.temperature;
    if (typeof t === "number") {
      if (t < g.temp_min || t > g.temp_max) {
        score -= 18;
        factors.push(`Температура ${t}°C вне нормы ${g.temp_min}–${g.temp_max}`);
      }
    } else {
      score -= 8;
      factors.push("Нет данных по температуре");
    }

    const h = g.humidity;
    if (typeof h === "number") {
      if (h < g.humidity_min || h > g.humidity_max) {
        score -= 15;
        factors.push(`Влажность ${h}% вне нормы ${g.humidity_min}–${g.humidity_max}`);
      }
    } else {
      score -= 6;
      factors.push("Нет данных по влажности");
    }

    const overdue = Number(g.overdue_tasks) || 0;
    if (overdue > 0) {
      score -= Math.min(30, overdue * 10);
      factors.push(`Просроченных задач: ${overdue}`);
    }

    const missed = Number(g.missed_watering) || 0;
    if (missed > 0) {
      score -= Math.min(24, missed * 8);
      factors.push(`Пропущенных поливов: ${missed}`);
    }

    if (!factors.length) factors.push("Показатели в норме");

    return {
      id: g.id,
      name: g.name,
      status: g.status,
      healthPct: clamp(Math.round(score), 0, 100),
      factors,
    };
  });
}
