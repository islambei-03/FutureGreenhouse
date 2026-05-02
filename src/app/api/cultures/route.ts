import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRoles } from "@/lib/api/rbac";
import { auditLog } from "@/lib/audit";
import { apiT } from "@/lib/api/i18n";

const StageEnum = z.enum(["Посев", "Рост", "Цветение", "Плодоношение", "Сбор урожая"]);

const CreateSchema = z.object({
  name: z.string().min(2, "Введите название"),
  greenhouse_id: z.number().int(),
  section: z.string().optional().nullable(),
  planted_date: z.string().optional().nullable(),
  harvest_date: z.string().optional().nullable(),
  temp_norm: z.number().optional().nullable(),
  humidity_norm: z.number().optional().nullable(),
  stage: StageEnum.optional(),
  notes: z.string().optional().nullable(),
});

const UpdateSchema = CreateSchema.partial().extend({
  id: z.number().int(),
});

export async function GET(req: Request) {
  const auth = await requireApiRoles(["admin", "agronomist", "director"]);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const greenhouseId = url.searchParams.get("greenhouse_id");
  const q = (url.searchParams.get("q") ?? "").trim();

  const where: string[] = [];
  const params: Record<string, unknown> = {};

  if (greenhouseId) {
    const id = Number(greenhouseId);
    if (Number.isFinite(id) && id > 0) {
      where.push("c.greenhouse_id = @greenhouse_id");
      params.greenhouse_id = id;
    }
  }

  if (q) {
    where.push("LOWER(c.name) LIKE @q");
    params.q = `%${q.toLowerCase()}%`;
  }

  const sql = `
    SELECT
      c.*,
      g.name as greenhouse_name
    FROM cultures c
    JOIN greenhouses g ON g.id = c.greenhouse_id
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY c.id DESC
  `;

  const rows =
    Object.keys(params).length > 0 ? await db().prepare(sql).all(params) : await db().prepare(sql).all();
  return NextResponse.json({ ok: true, cultures: rows });
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
      INSERT INTO cultures
        (name, greenhouse_id, section, planted_date, harvest_date, temp_norm, humidity_norm, stage, notes)
      VALUES
        (@name, @greenhouse_id, @section, @planted_date, @harvest_date, @temp_norm, @humidity_norm, @stage, @notes)
    `,
    )
    .run({
      ...parsed.data,
      section: parsed.data.section ?? null,
      planted_date: parsed.data.planted_date ?? null,
      harvest_date: parsed.data.harvest_date ?? null,
      temp_norm: parsed.data.temp_norm ?? null,
      humidity_norm: parsed.data.humidity_norm ?? null,
      stage: parsed.data.stage ?? "Рост",
      notes: parsed.data.notes ?? null,
    })) as { lastInsertRowid: number };

  await auditLog({
    actorUserId: Number(auth.user.id),
    action: "create",
    entity: "cultures",
    entityId: Number(r.lastInsertRowid),
    details: `Создана культура: ${parsed.data.name}`,
  });

  return NextResponse.json({ ok: true, id: Number(r.lastInsertRowid) });
}

export async function PUT(req: Request) {
  const auth = await requireApiRoles(["admin", "agronomist"]);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? (await apiT("api.badData")) },
      { status: 400 },
    );
  }

  const fields: string[] = [];
  const params: Record<string, unknown> = { id: parsed.data.id };
  for (const k of [
    "name",
    "greenhouse_id",
    "section",
    "planted_date",
    "harvest_date",
    "temp_norm",
    "humidity_norm",
    "stage",
    "notes",
  ] as const) {
    if (k in parsed.data && (parsed.data as Record<string, unknown>)[k] !== undefined) {
      fields.push(`${k}=@${k}`);
      params[k] = (parsed.data as Record<string, unknown>)[k] ?? null;
    }
  }

  if (fields.length === 0) return NextResponse.json({ ok: true });

  await db().prepare(`UPDATE cultures SET ${fields.join(", ")} WHERE id=@id`).run(params);
  await auditLog({
    actorUserId: Number(auth.user.id),
    action: "update",
    entity: "cultures",
    entityId: parsed.data.id,
    details: `Обновлена культура #${parsed.data.id}`,
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

  await db().prepare("DELETE FROM cultures WHERE id = ?").run(id);
  await auditLog({
    actorUserId: Number(auth.user.id),
    action: "delete",
    entity: "cultures",
    entityId: id,
    details: `Удалена культура #${id}`,
  });
  return NextResponse.json({ ok: true });
}
