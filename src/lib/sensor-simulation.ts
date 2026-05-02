import { db, ensureDbReady } from "@/lib/db";

const SETTINGS_KEY = "sensor_simulation_enabled";
/** Интервал записи показаний по всем теплицам (один процесс Node). */
const TICK_MS = 5_000;

declare global {
  var __fgSensorSimTimer: ReturnType<typeof setInterval> | undefined;
}

export async function getSensorSimulationEnabled(): Promise<boolean> {
  await ensureDbReady();
  const row = (await db()
    .prepare(`SELECT value FROM app_settings WHERE key = ?`)
    .get(SETTINGS_KEY)) as { value: string } | undefined;
  const v = row?.value ?? "0";
  return v === "1" || v.toLowerCase() === "true";
}

export async function setSensorSimulationEnabled(enabled: boolean): Promise<void> {
  await ensureDbReady();
  const v = enabled ? "1" : "0";
  await db()
    .prepare(
      `
      INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      RETURNING key
    `,
    )
    .run(SETTINGS_KEY, v);
}

/** Одна порция показаний: по одной строке на каждую теплицу (учитываются нормы из карточки). */
export async function insertSimulationSensorTick(): Promise<void> {
  await ensureDbReady();
  const rows = (await db()
    .prepare(
      `
      SELECT id, temp_min, temp_max, humidity_min, humidity_max
      FROM greenhouses
      ORDER BY id ASC
    `,
    )
    .all()) as Array<{
    id: number;
    temp_min: number;
    temp_max: number;
    humidity_min: number;
    humidity_max: number;
  }>;

  const insert = db().prepare(
    `INSERT INTO sensor_data (greenhouse_id, temperature, humidity, co2, recorded_at) VALUES (?, ?, ?, ?, NOW())`,
  );

  const t0 = Date.now() / TICK_MS;
  for (const g of rows) {
    const tMid = (g.temp_min + g.temp_max) / 2;
    const tSpan = Math.max(0.5, g.temp_max - g.temp_min);
    const rawT = tMid + Math.sin(t0 + g.id * 0.9) * (tSpan * 0.42) + (Math.random() - 0.5) * 1.1;
    const temperature = Math.min(g.temp_max + 0.8, Math.max(g.temp_min - 0.8, rawT));

    const hMid = (g.humidity_min + g.humidity_max) / 2;
    const hSpan = Math.max(1, g.humidity_max - g.humidity_min);
    const rawH = hMid + Math.cos(t0 / 1.4 + g.id) * (hSpan * 0.38) + (Math.random() - 0.5) * 5;
    const humidity = Math.min(g.humidity_max + 6, Math.max(g.humidity_min - 6, rawH));

    const co2 = 620 + Math.sin(t0 / 2.2 + g.id * 0.55) * 160 + Math.random() * 90;

    await insert.run(g.id, Number(temperature.toFixed(1)), Number(humidity.toFixed(1)), Math.round(co2));
  }
}

export function stopSensorSimulationLoop(): void {
  if (globalThis.__fgSensorSimTimer) {
    clearInterval(globalThis.__fgSensorSimTimer);
    globalThis.__fgSensorSimTimer = undefined;
  }
}

/** Запуск фоновых тиков (только в Node, один интервал на процесс). */
export async function startSensorSimulationLoop(): Promise<void> {
  if (typeof window !== "undefined") return;

  stopSensorSimulationLoop();

  globalThis.__fgSensorSimTimer = setInterval(async () => {
    try {
      const on = await getSensorSimulationEnabled();
      if (!on) {
        stopSensorSimulationLoop();
        return;
      }
      await insertSimulationSensorTick();
    } catch (e) {
      console.error("[sensor-simulation]", e);
    }
  }, TICK_MS);
}

/** После перезапуска сервера — если в БД включено, снова поднять цикл. */
export async function restoreSensorSimulationFromDb(): Promise<void> {
  if (typeof window !== "undefined") return;
  try {
    const on = await getSensorSimulationEnabled();
    if (on) await startSensorSimulationLoop();
  } catch (e) {
    console.error("[sensor-simulation] restore", e);
  }
}
