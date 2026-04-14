import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRoles } from "@/lib/api/rbac";
import { auditLog } from "@/lib/audit";
import { apiT } from "@/lib/api/i18n";

const CreateSchema = z.object({
  full_name: z.string().min(3, "Введите ФИО"),
  position: z.string().min(2, "Введите должность"),
  greenhouse_id: z.number().int().nullable().optional(),
  phone: z.string().optional().nullable(),
  status: z.enum(["на смене", "перерыв", "больничный", "выходной"]).optional(),
  notes: z.string().optional().nullable(),
});

const UpdateSchema = CreateSchema.extend({ id: z.number().int() });

export async function GET() {
  const auth = await requireApiRoles("any");
  if (!auth.ok) return auth.response;

  const rows = db()
    .prepare(
      `
      SELECT
        e.*,
        g.name as greenhouse_name,
        (
          SELECT COUNT(*)
          FROM tasks t
          WHERE t.assigned_to = e.id
        ) as task_count
      FROM employees e
      LEFT JOIN greenhouses g ON g.id = e.greenhouse_id
      ORDER BY e.full_name ASC
    `,
    )
    .all();

  return NextResponse.json({ ok: true, employees: rows });
}

export async function POST(req: Request) {
  const auth = await requireApiRoles(["admin"]);
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
    INSERT INTO employees (full_name, position, greenhouse_id, phone, status, notes)
    VALUES (@full_name, @position, @greenhouse_id, @phone, @status, @notes)
  `,
    )
    .run({
      ...parsed.data,
      greenhouse_id: parsed.data.greenhouse_id ?? null,
      phone: parsed.data.phone ?? null,
      status: parsed.data.status ?? "на смене",
      notes: parsed.data.notes ?? null,
    }) as { lastInsertRowid: number };

  auditLog({
    actorUserId: Number(auth.user.id),
    action: "create",
    entity: "employees",
    entityId: Number(r.lastInsertRowid),
    details: `Создан сотрудник: ${parsed.data.full_name}`,
  });

  return NextResponse.json({ ok: true, id: Number(r.lastInsertRowid) });
}

export async function PUT(req: Request) {
  const auth = await requireApiRoles(["admin"]);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? (await apiT("api.badData")) },
      { status: 400 },
    );
  }

  db()
    .prepare(
      `
    UPDATE employees SET
      full_name=@full_name,
      position=@position,
      greenhouse_id=@greenhouse_id,
      phone=@phone,
      status=@status,
      notes=@notes
    WHERE id=@id
  `,
    )
    .run({
      ...parsed.data,
      greenhouse_id: parsed.data.greenhouse_id ?? null,
      phone: parsed.data.phone ?? null,
      status: parsed.data.status ?? "на смене",
      notes: parsed.data.notes ?? null,
    });

  auditLog({
    actorUserId: Number(auth.user.id),
    action: "update",
    entity: "employees",
    entityId: parsed.data.id,
    details: `Обновлён сотрудник #${parsed.data.id}`,
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

  db().prepare("DELETE FROM employees WHERE id = ?").run(id);
  auditLog({ actorUserId: Number(auth.user.id), action: "delete", entity: "employees", entityId: id, details: `Удалён сотрудник #${id}` });
  return NextResponse.json({ ok: true });
}

