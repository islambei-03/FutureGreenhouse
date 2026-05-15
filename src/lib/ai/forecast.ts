import { db } from "@/lib/db";

export type ForecastPoint = {
  day: string;
  temperature: number;
  humidity: number;
  kind: "history" | "forecast";
  tempRisk: "ok" | "warn" | "danger";
  humRisk: "ok" | "warn" | "danger";
};

export type GreenhouseForecast = {
  greenhouse: {
    id: number;
    name: string;
    temp_min: number;
    temp_max: number;
    humidity_min: number;
    humidity_max: number;
  };
  points: ForecastPoint[];
  summary: string;
};

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function linRegForecast(values: number[], futureDays: number): number[] {
  if (!values.length) return Array(futureDays).fill(0);
  const n = values.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i]!;
    sumXY += i * values[i]!;
    sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const out: number[] = [];
  for (let i = 0; i < futureDays; i++) {
    out.push(intercept + slope * (n + i));
  }
  return out;
}

function riskLevel(value: number, min: number, max: number): "ok" | "warn" | "danger" {
  if (value >= min && value <= max) return "ok";
  const span = Math.max(1, max - min);
  const margin = span * 0.15;
  if (value >= min - margin && value <= max + margin) return "warn";
  return "danger";
}

export async function buildGreenhouseForecast(greenhouseId: number): Promise<GreenhouseForecast | null> {
  const g = (await db()
    .prepare(
      `SELECT id, name, temp_min, temp_max, humidity_min, humidity_max FROM greenhouses WHERE id = ?`,
    )
    .get(greenhouseId)) as
    | {
        id: number;
        name: string;
        temp_min: number;
        temp_max: number;
        humidity_min: number;
        humidity_max: number;
      }
    | undefined;

  if (!g) return null;

  const daily = (await db()
    .prepare(
      `
      SELECT
        to_char(date_trunc('day', recorded_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') as day,
        AVG(temperature)::float8 as avg_temp,
        AVG(humidity)::float8 as avg_hum
      FROM sensor_data
      WHERE greenhouse_id = ?
        AND recorded_at >= (NOW() AT TIME ZONE 'UTC' - interval '7 days')
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    )
    .all(greenhouseId)) as Array<{ day: string; avg_temp: number; avg_hum: number }>;

  const temps = daily.map((d) => Number(d.avg_temp));
  const hums = daily.map((d) => Number(d.avg_hum));

  const forecastTemp = linRegForecast(temps.length ? temps : [22], 3);
  const forecastHum = linRegForecast(hums.length ? hums : [60], 3);

  const points: ForecastPoint[] = [];

  for (const d of daily) {
    const t = Number(d.avg_temp);
    const h = Number(d.avg_hum);
    points.push({
      day: d.day,
      temperature: Math.round(t * 10) / 10,
      humidity: Math.round(h * 10) / 10,
      kind: "history",
      tempRisk: riskLevel(t, g.temp_min, g.temp_max),
      humRisk: riskLevel(h, g.humidity_min, g.humidity_max),
    });
  }

  const base = new Date();
  for (let i = 0; i < 3; i++) {
    const fd = new Date(base);
    fd.setUTCDate(fd.getUTCDate() + i + 1);
    const t = Math.round(forecastTemp[i]! * 10) / 10;
    const h = Math.round(forecastHum[i]! * 10) / 10;
    points.push({
      day: dayKey(fd),
      temperature: t,
      humidity: h,
      kind: "forecast",
      tempRisk: riskLevel(t, g.temp_min, g.temp_max),
      humRisk: riskLevel(h, g.humidity_min, g.humidity_max),
    });
  }

  const dangerCount = points.filter((p) => p.kind === "forecast" && (p.tempRisk === "danger" || p.humRisk === "danger")).length;
  const warnCount = points.filter((p) => p.kind === "forecast" && (p.tempRisk === "warn" || p.humRisk === "warn")).length;

  let summary = "Прогноз на 3 дня: условия в пределах нормы.";
  if (dangerCount) summary = `Прогноз: ${dangerCount} дн. с повышенным риском — проверьте климат-контроль.`;
  else if (warnCount) summary = `Прогноз: возможны отклонения (${warnCount} дн.) — рекомендуется усилить мониторинг.`;

  return {
    greenhouse: {
      id: g.id,
      name: g.name,
      temp_min: g.temp_min,
      temp_max: g.temp_max,
      humidity_min: g.humidity_min,
      humidity_max: g.humidity_max,
    },
    points,
    summary,
  };
}
