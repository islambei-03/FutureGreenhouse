import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRoles } from "@/lib/api/rbac";
import { auditLog } from "@/lib/audit";
import { apiT } from "@/lib/api/i18n";
const GetQuerySchema = z.object({
  greenhouse_id: z.coerce.number().int().positive().optional(),
  range: z.enum(["day", "7d"]).optional(),
  recent: z.enum(["1"]).optional(),
});

const PostSchema = z.object({
  greenhouse_id: z.number().int().positive(),
  temperature: z.number(),
  humidity: z.number(),
  co2: z.number().optional(),
  co2_level: z.number().nullable().optional(),
  recorded_at: z.string().optional(),
});

function resolveCo2(data: { co2?: number; co2_level?: number | null }) {
  if (typeof data.co2 === "number" && Number.isFinite(data.co2)) return data.co2;
  if (typeof data.co2_level === "number" && Number.isFinite(data.co2_level)) return data.co2_level;
  return 650;
}

async function persistSensorReading(input: {
  greenhouse_id: number;
  temperature: number;
  humidity: number;
  co2: number;
  recorded_at: string;
  recorded_by_user_id: number | null;
  actorUserId: number | null;
}) {

  const gh = (await db()
    .prepare(
      `SELECT id, name, temp_min, temp_max, humidity_min, humidity_max
       FROM greenhouses WHERE id = ?`,
    )
    .get(input.greenhouse_id)) as
    | {
        id: number;
        name: string;
        temp_min: number;
        temp_max: number;
        humidity_min: number;
        humidity_max: number;
      }
    | undefined;

  if (!gh) return { ok: false as const, status: 404, error: await apiT("api.greenhouseNotFound") };

  await db().transaction(async (tx) => {
    await tx
      .prepare(
        `INSERT INTO sensor_data (greenhouse_id, temperature, humidity, co2, recorded_at, recorded_by_user_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.greenhouse_id,
        input.temperature,
        input.humidity,
        input.co2,
        input.recorded_at,
        input.recorded_by_user_id,
      );

    if (input.actorUserId != null) {
      await auditLog(
        {
          actorUserId: input.actorUserId,
          action: "record",
          entity: "sensor_data",
          entityId: null,
          details: `Записаны показания для теплицы #${input.greenhouse_id}: T=${input.temperature}, H=${input.humidity}, CO2=${input.co2} @ ${input.recorded_at}`,
        },
        tx,
      );
    }

    const tempBad = input.temperature < gh.temp_min || input.temperature > gh.temp_max;
    const humBad = input.humidity < gh.humidity_min || input.humidity > gh.humidity_max;

    if (tempBad || humBad) {
      const type = tempBad ? "тревога" : "предупреждение";
      const parts: string[] = [];
      if (tempBad) {
        parts.push(
          `Температура вне нормы: ${input.temperature}°C (норма ${gh.temp_min}–${gh.temp_max}°C)`,
        );
      }
      if (humBad) {
        parts.push(
          `Влажность вне нормы: ${input.humidity}% (норма ${gh.humidity_min}–${gh.humidity_max}%)`,
        );
      }

      await tx
        .prepare(
          `INSERT INTO notifications (title, message, type, is_read, created_at)
           VALUES (?, ?, ?, 0, now())`,
        )
        .run("Отклонение параметров", `${gh.name}: ${parts.join(" · ")}`, type);
    }
  });

  return { ok: true as const };
}

export async function GET(req: Request) {
  const auth = await requireApiRoles("any");
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const parsed = GetQuerySchema.safeParse({
    greenhouse_id: url.searchParams.get("greenhouse_id") ?? undefined,
    range: url.searchParams.get("range") ?? undefined,
    recent: url.searchParams.get("recent") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? (await apiT("api.badParams")) },
      { status: 400 },
    );
  }

  if (parsed.data.recent === "1") {
    if (auth.user.role !== "worker" && auth.user.role !== "admin") {
      return NextResponse.json({ ok: false, error: await apiT("api.forbidden") }, { status: 403 });
    }
    const rows = (await db()
      .prepare(
        `
        SELECT
          sd.id, sd.greenhouse_id, sd.temperature, sd.humidity, sd.co2, sd.recorded_at,
          g.name as greenhouse_name
        FROM sensor_data sd
        JOIN greenhouses g ON g.id = sd.greenhouse_id
        WHERE sd.recorded_by_user_id = ?
        ORDER BY sd.recorded_at DESC
        LIMIT 10
      `,
      )
      .all(Number(auth.user.id))) as unknown[];

    return NextResponse.json({ ok: true, recent: rows });
  }

  const current = (await db()
    .prepare(
      `
      SELECT
        g.id,
        g.name,
        g.temp_min, g.temp_max, g.humidity_min, g.humidity_max,
        g.status,
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
          SELECT sd.recorded_at
          FROM sensor_data sd
          WHERE sd.greenhouse_id = g.id
          ORDER BY sd.recorded_at DESC
          LIMIT 1
        ) as recorded_at
      FROM greenhouses g
      ORDER BY g.id ASC
    `,
    )
    .all()) as Array<{
    id: number;
    name: string;
    temperature: number | null;
    humidity: number | null;
    co2: number | null;
    recorded_at: string | null;
  }>;

  const greenhouse_id = parsed.data.greenhouse_id ?? (current[0]?.id as number | undefined);
  const range = parsed.data.range ?? "day";

  let history: unknown[] = [];
  if (greenhouse_id) {
    const where =
      range === "day"
        ? "sd.recorded_at >= (NOW() AT TIME ZONE 'UTC' - interval '1 day')"
        : "sd.recorded_at >= (NOW() AT TIME ZONE 'UTC' - interval '7 day')";
    history = (await db()
      .prepare(
        `
        SELECT id, greenhouse_id, temperature, humidity, co2, recorded_at
        FROM sensor_data sd
        WHERE sd.greenhouse_id = ? AND ${where}
        ORDER BY sd.recorded_at ASC
      `,
      )
      .all(greenhouse_id)) as unknown[];

    if (history.length === 0) {
      history = (await db()
        .prepare(
          `
          SELECT id, greenhouse_id, temperature, humidity, co2, recorded_at
          FROM sensor_data sd
          WHERE sd.greenhouse_id = ?
          ORDER BY sd.recorded_at DESC
          LIMIT 72
        `,
        )
        .all(greenhouse_id)) as unknown[];
      history.reverse();
    }
  }

  return NextResponse.json({ ok: true, current, selected: greenhouse_id ?? null, range, history });
}

export async function POST(req: Request) {
  const IOT_SECRET = process.env.IOT_SECRET;
  const iotKey = req.headers.get("x-iot-key");

  let actorUserId: number | null = null;
  let recordedByUserId: number | null = null;

  if (iotKey) {
    if (iotKey !== IOT_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    const auth = await requireApiRoles(["admin", "worker"]);
    if (!auth.ok) return auth.response;
    actorUserId = Number(auth.user.id);
    recordedByUserId = actorUserId;
  }

  const json = await req.json().catch(() => null);
  const parsed = PostSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? (await apiT("api.badData")) },
      { status: 400 },
    );
  }

  const co2 = resolveCo2(parsed.data);
  const recorded_at =
    parsed.data.recorded_at?.trim() ||
    new Date().toISOString().slice(0, 19).replace("T", " ");

  const result = await persistSensorReading({
    greenhouse_id: parsed.data.greenhouse_id,
    temperature: parsed.data.temperature,
    humidity: parsed.data.humidity,
    co2,
    recorded_at,
    recorded_by_user_id: recordedByUserId,
    actorUserId,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
