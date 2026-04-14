import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRoles } from "@/lib/api/rbac";
import { auditLog } from "@/lib/audit";
import { apiT } from "@/lib/api/i18n";

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
  const where =
    range === "today"
      ? "date(ws.scheduled_at) = date('now')"
      : "ws.scheduled_at >= datetime('now', 'start of day') AND ws.scheduled_at < datetime('now', 'start of day', '+7 day')";

  const rows = db()
    .prepare(
      `
      SELECT
        ws.*,
        g.name as greenhouse_name
      FROM watering_schedule ws
      JOIN greenhouses g ON g.id = ws.greenhouse_id
      WHERE ${where}
      ORDER BY datetime(ws.scheduled_at) ASC
    `,
    )
    .all();

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

  const r = db()
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
    }) as { lastInsertRowid: number };

  auditLog({
    actorUserId: Number(auth.user.id),
    action: "create",
    entity: "watering_schedule",
    entityId: Number(r.lastInsertRowid),
    details: `Создан полив для теплицы #${parsed.data.greenhouse_id} на ${parsed.data.scheduled_at}`,
  });

  return NextResponse.json({ ok: true, id: Number(r.lastInsertRowid) });
}

export async function PUT(req: Request) {
  const auth = await requireApiRoles(["admin", "agronomist", "operator"]);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? (await apiT("api.badData")) },
      { status: 400 },
    );
  }

  // оператору разрешаем только отметку выполнения
  if (auth.user.role === "operator") {
    if (typeof parsed.data.is_done !== "number") {
      return NextResponse.json({ ok: false, error: await apiT("api.forbidden") }, { status: 403 });
    }
    db().prepare("UPDATE watering_schedule SET is_done = ? WHERE id = ?").run(parsed.data.is_done, parsed.data.id);
    auditLog({
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
    if (k in parsed.data && (parsed.data as any)[k] !== undefined) {
      fields.push(`${k}=@${k}`);
      params[k] = (parsed.data as any)[k] ?? null;
    }
  }
  if (fields.length === 0) return NextResponse.json({ ok: true });

  db().prepare(`UPDATE watering_schedule SET ${fields.join(", ")} WHERE id=@id`).run(params);
  auditLog({
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

  db().prepare("DELETE FROM watering_schedule WHERE id = ?").run(id);
  auditLog({ actorUserId: Number(auth.user.id), action: "delete", entity: "watering_schedule", entityId: id, details: `Удалён полив #${id}` });
  return NextResponse.json({ ok: true });
}

