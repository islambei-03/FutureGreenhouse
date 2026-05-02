import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRoles } from "@/lib/api/rbac";
import { auditLog } from "@/lib/audit";
import { apiT } from "@/lib/api/i18n";
import { listGreenhousesWithStatus } from "@/lib/repo/greenhouses";

const CreateSchema = z.object({
  name: z.string().min(2, "Введите название"),
  type: z.enum(["стеклянная", "поликарбонатная", "плёночная"]),
  area: z.number().positive("Площадь должна быть > 0"),
  temp_min: z.number(),
  temp_max: z.number(),
  humidity_min: z.number(),
  humidity_max: z.number(),
  status: z.enum(["активна", "обслуживание", "отключена"]).optional(),
  responsible_employee_id: z.number().int().nullable().optional(),
  notes: z.string().optional().nullable(),
});

const UpdateSchema = CreateSchema.extend({
  id: z.number().int(),
});

export async function GET() {
  const auth = await requireApiRoles("any");
  if (!auth.ok) return auth.response;

  const rows = await listGreenhousesWithStatus();

  const data = rows.map((r) => ({
    ...r,
    cultures:
      typeof r.culture_names === "string" && r.culture_names.length
        ? (r.culture_names as string).split("||")
        : [],
  }));

  return NextResponse.json({ ok: true, greenhouses: data });
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
    INSERT INTO greenhouses
      (name, type, area, temp_min, temp_max, humidity_min, humidity_max, status, responsible_employee_id, notes)
    VALUES
      (@name, @type, @area, @temp_min, @temp_max, @humidity_min, @humidity_max, @status, @responsible_employee_id, @notes)
  `,
    )
    .run({
      ...parsed.data,
      status: parsed.data.status ?? "активна",
      notes: parsed.data.notes ?? null,
      responsible_employee_id: parsed.data.responsible_employee_id ?? null,
    })) as { lastInsertRowid: number };

  await auditLog({
    actorUserId: Number(auth.user.id),
    action: "create",
    entity: "greenhouses",
    entityId: Number(r.lastInsertRowid),
    details: `Создана теплица: ${parsed.data.name}`,
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

  await db()
    .prepare(
      `
    UPDATE greenhouses SET
      name=@name,
      type=@type,
      area=@area,
      temp_min=@temp_min,
      temp_max=@temp_max,
      humidity_min=@humidity_min,
      humidity_max=@humidity_max,
      status=@status,
      responsible_employee_id=@responsible_employee_id,
      notes=@notes
    WHERE id=@id
  `,
    )
    .run({
      ...parsed.data,
      status: parsed.data.status ?? "активна",
      notes: parsed.data.notes ?? null,
      responsible_employee_id: parsed.data.responsible_employee_id ?? null,
    });

  await auditLog({
    actorUserId: Number(auth.user.id),
    action: "update",
    entity: "greenhouses",
    entityId: parsed.data.id,
    details: `Обновлена теплица #${parsed.data.id}`,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const auth = await requireApiRoles(["admin"]);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: await apiT("api.badId") }, { status: 400 });
  }

  await db().prepare("DELETE FROM greenhouses WHERE id = ?").run(id);
  await auditLog({ actorUserId: Number(auth.user.id), action: "delete", entity: "greenhouses", entityId: id, details: `Удалена теплица #${id}` });
  return NextResponse.json({ ok: true });
}
