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
  co2: z.number(),
  recorded_at: z.string().optional(),
});

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

    /** Если за период пусто — показываем последние точки, чтобы график не был «пустым». */
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
  const auth = await requireApiRoles(["admin", "worker"]);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = PostSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? (await apiT("api.badData")) },
      { status: 400 },
    );
  }

  const { greenhouse_id, temperature, humidity, co2 } = parsed.data;
  const recorded_at =
    parsed.data.recorded_at?.trim() ||
    new Date().toISOString().slice(0, 19).replace("T", " ");

  const gh = (await db()
    .prepare(
      `SELECT id, name, temp_min, temp_max, humidity_min, humidity_max
       FROM greenhouses WHERE id = ?`,
    )
    .get(greenhouse_id)) as
    | {
        id: number;
        name: string;
        temp_min: number;
        temp_max: number;
        humidity_min: number;
        humidity_max: number;
      }
    | undefined;

  if (!gh) return NextResponse.json({ ok: false, error: await apiT("api.greenhouseNotFound") }, { status: 404 });

  await db().transaction(async (tx) => {
    await tx
      .prepare(
        `INSERT INTO sensor_data (greenhouse_id, temperature, humidity, co2, recorded_at, recorded_by_user_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(greenhouse_id, temperature, humidity, co2, recorded_at, Number(auth.user.id));

    await auditLog(
      {
        actorUserId: Number(auth.user.id),
        action: "record",
        entity: "sensor_data",
        entityId: null,
        details: `Записаны показания для теплицы #${greenhouse_id}: T=${temperature}, H=${humidity}, CO2=${co2} @ ${recorded_at}`,
      },
      tx,
    );

    const tempBad = temperature < gh.temp_min || temperature > gh.temp_max;
    const humBad = humidity < gh.humidity_min || humidity > gh.humidity_max;

    if (tempBad || humBad) {
      const type = tempBad ? "тревога" : "предупреждение";
      const parts: string[] = [];
      if (tempBad) parts.push(`Температура вне нормы: ${temperature}°C (норма ${gh.temp_min}–${gh.temp_max}°C)`);
      if (humBad) parts.push(`Влажность вне нормы: ${humidity}% (норма ${gh.humidity_min}–${gh.humidity_max}%)`);

      await tx
        .prepare(
          `INSERT INTO notifications (title, message, type, is_read, created_at)
           VALUES (?, ?, ?, 0, now())`,
        )
        .run("Отклонение параметров", `${gh.name}: ${parts.join(" · ")}`, type);
    }
  });

  return NextResponse.json({ ok: true });
}
