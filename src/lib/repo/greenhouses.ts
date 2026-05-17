import { db } from "@/lib/db";

export type GreenhouseRow = {
  id: number;
  name: string;
  type: string;
  area: number;
  temp_min: number;
  temp_max: number;
  humidity_min: number;
  humidity_max: number;
  status: string;
  responsible_employee_id: number | null;
  notes: string | null;
  created_at: string;
  responsible_name: string | null;
  culture_names: string | null;
  temperature: number | null;
  humidity: number | null;
  co2: number | null;
  next_watering_at: string | null;
};

export async function listGreenhousesWithStatus(): Promise<GreenhouseRow[]> {
  // Оптимизация: берём последние датчики через DISTINCT ON вместо подзапросов на каждую теплицу.
  const sql = `
    WITH last_sensor AS (
      SELECT DISTINCT ON (greenhouse_id)
        greenhouse_id,
        temperature,
        humidity,
        co2,
        recorded_at
      FROM sensor_data
      ORDER BY greenhouse_id, recorded_at DESC
    ),
    next_w AS (
      SELECT DISTINCT ON (greenhouse_id)
        greenhouse_id,
        scheduled_at
      FROM watering_schedule
      WHERE is_done = 0
      ORDER BY greenhouse_id, scheduled_at ASC
    )
    SELECT
      g.*,
      e.full_name as responsible_name,
      (
        SELECT string_agg(c.name, '||' ORDER BY c.id)
        FROM cultures c
        WHERE c.greenhouse_id = g.id
          AND (c.notes IS NULL OR c.notes NOT IN ('demo', 'demo-rich'))
          AND c.name NOT LIKE 'Демо-%'
      ) as culture_names,
      ls.temperature,
      ls.humidity,
      ls.co2,
      nw.scheduled_at as next_watering_at
    FROM greenhouses g
    LEFT JOIN employees e ON e.id = g.responsible_employee_id
    LEFT JOIN last_sensor ls ON ls.greenhouse_id = g.id
    LEFT JOIN next_w nw ON nw.greenhouse_id = g.id
    ORDER BY g.id ASC
  `;

  return (await db().prepare(sql).all()) as unknown as GreenhouseRow[];
}

