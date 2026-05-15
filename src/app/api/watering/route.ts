import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRoles } from "@/lib/api/rbac";
import { auditLog } from "@/lib/audit";
import { apiT } from "@/lib/api/i18n";

async function getEmployeeGreenhouseId(userId: string): Promise<number | null> {
  const row = (await db()
    .prepare(
      `
      SELECT e.greenhouse_id
      FROM users u
      JOIN employees e ON e.id = u.employee_id
      WHERE u.id = ?
    `,
    )
    .get(Number(userId))) as { greenhouse_id: number | null } | undefined;
  return row?.greenhouse_id ?? null;
}

const GetQuerySchema = z.object({
  range: z.enum(["today", "week"]).optional(),
});

const CreateSchema = z.object({
  greenhouse_id: z.number().int().positive(),
  watering_type: z.string().min(2, "Укажите тип полива"),
  scheduled_at: z.string().min(10, "Укажите дату/время"),
  duration_minutes: z.number().int().positive("Длительность должна быть > 0"),
  volume_liters: z.number().positive("Объём должен быть > 0"),
  notes: z.string().optional().nullable(),
});

const UpdateSchema = CreateSchema.partial().extend({
  id: z.number().int().positive(),
  is_done: z.number().int().min(0).max(1).optional(),
});

export async function GET(req: Request) {
  const auth = await requireApiRoles("any");
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const parsed = GetQuerySchema.safeParse({ range: url.searchParams.get("range") ?? undefined });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? (await apiT("api.badParams")) },
      { status: 400 },
    );
  }

  const range = parsed.data.range ?? "today";
  let where =
    range === "today"
      ? "(ws.scheduled_at AT TIME ZONE 'UTC')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date"
      : "ws.scheduled_at >= date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AND ws.scheduled_at < date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') + interval '7 day'";

  if (auth.user.role === "worker") {
    const ghId = await getEmployeeGreenhouseId(auth.user.id);
    if (!ghId) return NextResponse.json({ ok: true, range, items: [] });
    where += ` AND ws.greenhouse_id = ${ghId}`;
  }

  const rows = (await db()
    .prepare(
      `
      SELECT
        ws.*,
        g.name as greenhouse_name
      FROM watering_schedule ws
      JOIN greenhouses g ON g.id = ws.greenhouse_id
      WHERE ${where}
      ORDER BY ws.scheduled_at ASC
    `,
    )
    .all()) as unknown[];

  return NextResponse.json({ ok: true, range, items: rows });
}

export async function POST(req: Request) {
  const auth = await requireApiRoles(["admin", "agronomist"]);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? (await apiT("api.badData")) },
      { status: 400 },
    );
  }

  const r = (await db()
    .prepare(
      `
      INSERT INTO watering_schedule
        (greenhouse_id, watering_type, scheduled_at, duration_minutes, volume_liters, is_done, notes)
      VALUES
        (@greenhouse_id, @watering_type, @scheduled_at, @duration_minutes, @volume_liters, 0, @notes)
    `,
    )
    .run({
      ...parsed.data,
      notes: parsed.data.notes ?? null,
    })) as { lastInsertRowid: number };

  await auditLog({
    actorUserId: Number(auth.user.id),
    action: "create",
    entity: "watering_schedule",
    entityId: Number(r.lastInsertRowid),
    details: `Создан полив для теплицы #${parsed.data.greenhouse_id} на ${parsed.data.scheduled_at}`,
  });

  return NextResponse.json({ ok: true, id: Number(r.lastInsertRowid) });
}

export async function PUT(req: Request) {
  const auth = await requireApiRoles(["admin", "agronomist", "worker"]);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? (await apiT("api.badData")) },
      { status: 400 },
    );
  }

  if (auth.user.role === "worker") {
    if (typeof parsed.data.is_done !== "number") {
      return NextResponse.json({ ok: false, error: await apiT("api.forbidden") }, { status: 403 });
    }
    const ghId = await getEmployeeGreenhouseId(auth.user.id);
    if (!ghId) return NextResponse.json({ ok: false, error: await apiT("api.forbidden") }, { status: 403 });
    const ok = await db()
      .prepare("UPDATE watering_schedule SET is_done = ? WHERE id = ? AND greenhouse_id = ?")
      .run(parsed.data.is_done, parsed.data.id, ghId);
    if (ok.changes === 0) {
      return NextResponse.json({ ok: false, error: await apiT("api.forbidden") }, { status: 403 });
    }
    await auditLog({
      actorUserId: Number(auth.user.id),
      action: "mark",
      entity: "watering_schedule",
      entityId: parsed.data.id,
      details: `Оператор отметил полив #${parsed.data.id} как выполненный: ${parsed.data.is_done}`,
    });
    return NextResponse.json({ ok: true });
  }

  const fields: string[] = [];
  const params: Record<string, unknown> = { id: parsed.data.id };
  for (const k of [
    "greenhouse_id",
    "watering_type",
    "scheduled_at",
    "duration_minutes",
    "volume_liters",
    "is_done",
    "notes",
  ] as const) {
    if (k in parsed.data && (parsed.data as Record<string, unknown>)[k] !== undefined) {
      fields.push(`${k}=@${k}`);
      params[k] = (parsed.data as Record<string, unknown>)[k] ?? null;
    }
  }
  if (fields.length === 0) return NextResponse.json({ ok: true });

  await db().prepare(`UPDATE watering_schedule SET ${fields.join(", ")} WHERE id=@id`).run(params);
  await auditLog({
    actorUserId: Number(auth.user.id),
    action: "update",
    entity: "watering_schedule",
    entityId: parsed.data.id,
    details: `Обновлён полив #${parsed.data.id}`,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const auth = await requireApiRoles(["admin", "agronomist"]);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: await apiT("api.badId") }, { status: 400 });
  }

  await db().prepare("DELETE FROM watering_schedule WHERE id = ?").run(id);
  await auditLog({
    actorUserId: Number(auth.user.id),
    action: "delete",
    entity: "watering_schedule",
    entityId: id,
    details: `Удалён полив #${id}`,
  });
  return NextResponse.json({ ok: true });
}
