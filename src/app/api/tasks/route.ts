import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRoles } from "@/lib/api/rbac";
import { auditLog } from "@/lib/audit";
import { apiT } from "@/lib/api/i18n";

async function getEmployeeIdForUser(userId: string): Promise<number | null> {
  const row = (await db()
    .prepare("SELECT employee_id FROM users WHERE id = ?")
    .get(Number(userId))) as { employee_id: number | null } | undefined;
  return row?.employee_id ?? null;
}

const CreateSchema = z.object({
  title: z.string().min(2, "Введите название"),
  description: z.string().optional().nullable(),
  assigned_to: z.number().int().nullable().optional(),
  greenhouse_id: z.number().int().nullable().optional(),
  priority: z.enum(["обычный", "высокий", "срочный"]).optional(),
  deadline: z.string().optional().nullable(),
});

const UpdateSchema = z.object({
  id: z.number().int(),
  title: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  assigned_to: z.number().int().nullable().optional(),
  greenhouse_id: z.number().int().nullable().optional(),
  priority: z.enum(["обычный", "высокий", "срочный"]).optional(),
  deadline: z.string().optional().nullable(),
  is_completed: z.number().int().min(0).max(1).optional(),
});

export async function GET(req: Request) {
  const auth = await requireApiRoles("any");
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const onlyToday = url.searchParams.get("today") === "1";

  const whereParts: string[] = [];
  const params: Record<string, unknown> = {};

  if (onlyToday) {
    whereParts.push("t.deadline IS NOT NULL AND left(t.deadline, 10)::date = CURRENT_DATE");
  }

  if (auth.user.role === "worker") {
    const employeeId = await getEmployeeIdForUser(auth.user.id);
    if (!employeeId) return NextResponse.json({ ok: true, tasks: [] });
    whereParts.push("t.assigned_to = @employee_id");
    params.employee_id = employeeId;
  }

  const where = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

  const sql = `
      SELECT
        t.*,
        e.full_name as assigned_name,
        g.name as greenhouse_name
      FROM tasks t
      LEFT JOIN employees e ON e.id = t.assigned_to
      LEFT JOIN greenhouses g ON g.id = t.greenhouse_id
      ${where}
      ORDER BY t.is_completed ASC, t.deadline ASC NULLS LAST, t.created_at DESC
    `;
  const rows =
    Object.keys(params).length > 0 ? await db().prepare(sql).all(params) : await db().prepare(sql).all();

  return NextResponse.json({ ok: true, tasks: rows });
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
    INSERT INTO tasks (title, description, assigned_to, greenhouse_id, priority, deadline, is_completed)
    VALUES (@title, @description, @assigned_to, @greenhouse_id, @priority, @deadline, 0)
  `,
    )
    .run({
      ...parsed.data,
      description: parsed.data.description ?? null,
      assigned_to: parsed.data.assigned_to ?? null,
      greenhouse_id: parsed.data.greenhouse_id ?? null,
      priority: parsed.data.priority ?? "обычный",
      deadline: parsed.data.deadline ?? null,
    })) as { lastInsertRowid: number };

  await auditLog({
    actorUserId: Number(auth.user.id),
    action: "create",
    entity: "tasks",
    entityId: Number(r.lastInsertRowid),
    details: `Создана задача: ${parsed.data.title}`,
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
    if (typeof parsed.data.is_completed !== "number") {
      return NextResponse.json({ ok: false, error: await apiT("api.forbidden") }, { status: 403 });
    }
    const employeeId = await getEmployeeIdForUser(auth.user.id);
    if (!employeeId) return NextResponse.json({ ok: false, error: await apiT("api.forbidden") }, { status: 403 });

    const ok = await db()
      .prepare("UPDATE tasks SET is_completed = ? WHERE id = ? AND assigned_to = ?")
      .run(parsed.data.is_completed, parsed.data.id, employeeId);
    if (ok.changes === 0) {
      return NextResponse.json({ ok: false, error: await apiT("api.forbidden") }, { status: 403 });
    }
    await auditLog({
      actorUserId: Number(auth.user.id),
      action: "mark",
      entity: "tasks",
      entityId: parsed.data.id,
      details: `Рабочий отметил выполнение задачи #${parsed.data.id}: ${parsed.data.is_completed}`,
    });
    return NextResponse.json({ ok: true });
  }

  const fields: string[] = [];
  const params: Record<string, unknown> = { id: parsed.data.id };
  for (const k of ["title", "description", "assigned_to", "greenhouse_id", "priority", "deadline", "is_completed"] as const) {
    if (k in parsed.data && (parsed.data as Record<string, unknown>)[k] !== undefined) {
      fields.push(`${k}=@${k}`);
      params[k] = (parsed.data as Record<string, unknown>)[k] ?? null;
    }
  }

  if (fields.length === 0) return NextResponse.json({ ok: true });

  await db().prepare(`UPDATE tasks SET ${fields.join(", ")} WHERE id=@id`).run(params);
  await auditLog({
    actorUserId: Number(auth.user.id),
    action: "update",
    entity: "tasks",
    entityId: parsed.data.id,
    details: `Обновлена задача #${parsed.data.id}`,
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

  await db().prepare("DELETE FROM tasks WHERE id = ?").run(id);
  await auditLog({ actorUserId: Number(auth.user.id), action: "delete", entity: "tasks", entityId: id, details: `Удалена задача #${id}` });
  return NextResponse.json({ ok: true });
}
