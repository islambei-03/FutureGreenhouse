import { db } from "@/lib/db";
import { computeGreenhouseHealth } from "@/lib/ai/health";

export type AiRecommendation = {
  level: "info" | "warning" | "danger" | "success";
  icon: string;
  text: string;
  greenhouse_id: number | null;
};

/** Правила + данные БД; без обязательного вызова OpenAI. */
export async function buildRecommendations(): Promise<AiRecommendation[]> {
  const items: AiRecommendation[] = [];

  const greenhouses = (await db()
    .prepare(
      `
      SELECT
        g.id,
        g.name,
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
          SELECT COUNT(*)::int FROM sensor_data sd
          WHERE sd.greenhouse_id = g.id
            AND sd.recorded_at >= (NOW() AT TIME ZONE 'UTC' - interval '3 days')
            AND (sd.temperature > g.temp_max OR sd.temperature < g.temp_min)
        ) as temp_bad_days
      FROM greenhouses g
      WHERE g.status = 'активна'
      ORDER BY g.id ASC
    `,
    )
    .all()) as Array<{
    id: number;
    name: string;
    temp_min: number;
    temp_max: number;
    humidity_min: number;
    humidity_max: number;
    temperature: number | null;
    humidity: number | null;
    temp_bad_days: number;
  }>;

  for (const g of greenhouses) {
    const badDays = Number(g.temp_bad_days) || 0;
    if (badDays >= 2) {
      items.push({
        level: "warning",
        icon: "⚠️",
        text: `${g.name} — температура ${badDays} дня выше/ниже нормы, рекомендуем проверить вентиляцию и отопление.`,
        greenhouse_id: g.id,
      });
    } else if (typeof g.temperature === "number" && g.temperature > g.temp_max) {
      items.push({
        level: "warning",
        icon: "🌡️",
        text: `${g.name} — сейчас ${g.temperature}°C (норма до ${g.temp_max}°C). Усильте проветривание.`,
        greenhouse_id: g.id,
      });
    } else if (typeof g.humidity === "number" && g.humidity < g.humidity_min) {
      items.push({
        level: "info",
        icon: "💧",
        text: `${g.name} — влажность ${g.humidity}% ниже нормы. Проверьте полив и увлажнение.`,
        greenhouse_id: g.id,
      });
    }
  }

  const overdue = (await db()
    .prepare(
      `
      SELECT g.name, COUNT(*)::int as c
      FROM tasks t
      JOIN greenhouses g ON g.id = t.greenhouse_id
      WHERE t.is_completed = 0 AND t.deadline < (NOW() AT TIME ZONE 'UTC')
      GROUP BY g.id, g.name
      HAVING COUNT(*) > 0
      ORDER BY c DESC
      LIMIT 3
    `,
    )
    .all()) as Array<{ name: string; c: number }>;

  for (const o of overdue) {
    items.push({
      level: "danger",
      icon: "📋",
      text: `${o.name}: ${o.c} просроченных задач — назначьте ответственного и обновите сроки.`,
      greenhouse_id: null,
    });
  }

  const missedWater = (await db()
    .prepare(
      `
      SELECT g.name, COUNT(*)::int as c
      FROM watering_schedule w
      JOIN greenhouses g ON g.id = w.greenhouse_id
      WHERE w.is_done = 0 AND w.scheduled_at < (NOW() AT TIME ZONE 'UTC')
      GROUP BY g.id, g.name
      LIMIT 3
    `,
    )
    .all()) as Array<{ name: string; c: number }>;

  for (const w of missedWater) {
    items.push({
      level: "warning",
      icon: "🚿",
      text: `${w.name}: пропущено ${w.c} полив(ов) — отметьте выполнение или перенесите расписание.`,
      greenhouse_id: null,
    });
  }

  const health = await computeGreenhouseHealth();
  const critical = health.filter((h) => h.healthPct < 50);
  for (const h of critical.slice(0, 2)) {
    items.push({
      level: "danger",
      icon: "🏥",
      text: `${h.name}: здоровье теплицы ${h.healthPct}% — ${h.factors[0] ?? "требуется вмешательство"}.`,
      greenhouse_id: h.id,
    });
  }

  if (!items.length) {
    items.push({
      level: "success",
      icon: "✅",
      text: "Все основные показатели в норме. Продолжайте плановый уход и мониторинг.",
      greenhouse_id: null,
    });
  }

  return items.slice(0, 8);
}
