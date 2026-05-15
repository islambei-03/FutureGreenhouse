import { db } from "@/lib/db";

export type AnomalyPoint = {
  recorded_at: string;
  temperature: number;
  humidity: number;
  anomalyTemp: boolean;
  anomalyHumidity: boolean;
};

function zScore(value: number, mean: number, std: number) {
  if (std < 0.01) return 0;
  return Math.abs((value - mean) / std);
}

function stats(values: number[]) {
  if (!values.length) return { mean: 0, std: 0 };
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return { mean, std: Math.sqrt(variance) };
}

/** Статистические выбросы (|z| > порога) + резкие скачки между соседними точками. */
export async function detectSensorAnomalies(
  greenhouseId: number,
  range: "7d" | "14d" = "7d",
): Promise<{ points: AnomalyPoint[]; summary: string }> {
  const days = range === "14d" ? 14 : 7;
  const rows = (await db()
    .prepare(
      `
      SELECT temperature, humidity, recorded_at
      FROM sensor_data
      WHERE greenhouse_id = ?
        AND recorded_at >= NOW() - (?::int * INTERVAL '1 day')
      ORDER BY recorded_at ASC
    `,
    )
    .all(greenhouseId, days)) as Array<{
    temperature: number;
    humidity: number;
    recorded_at: string;
  }>;

  if (rows.length < 5) {
    return { points: [], summary: "Недостаточно истории для анализа (нужно ≥ 5 записей)." };
  }

  const temps = rows.map((r) => r.temperature);
  const hums = rows.map((r) => r.humidity);
  const tStat = stats(temps);
  const hStat = stats(hums);
  const zThreshold = 2.2;
  const jumpTemp = 3.5;
  const jumpHum = 12;

  const points: AnomalyPoint[] = rows.map((r, i) => {
    let anomalyTemp = zScore(r.temperature, tStat.mean, tStat.std) > zThreshold;
    let anomalyHumidity = zScore(r.humidity, hStat.mean, hStat.std) > zThreshold;
    if (i > 0) {
      const prev = rows[i - 1]!;
      if (Math.abs(r.temperature - prev.temperature) >= jumpTemp) anomalyTemp = true;
      if (Math.abs(r.humidity - prev.humidity) >= jumpHum) anomalyHumidity = true;
    }
    return {
      recorded_at: r.recorded_at,
      temperature: r.temperature,
      humidity: r.humidity,
      anomalyTemp,
      anomalyHumidity,
    };
  });

  const count = points.filter((p) => p.anomalyTemp || p.anomalyHumidity).length;
  const summary =
    count === 0
      ? `За ${days} дн. необычных отклонений не найдено (${rows.length} точек).`
      : `Обнаружено ${count} аномальных точек из ${rows.length} (статистика + резкие скачки).`;

  return { points, summary };
}
