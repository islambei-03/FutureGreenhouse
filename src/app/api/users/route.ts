import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireApiRoles } from "@/lib/api/rbac";
import { auditLog } from "@/lib/audit";
import { apiT } from "@/lib/api/i18n";

const RoleEnum = z.enum(["admin", "director", "agronomist", "worker"]);

const CreateSchema = z.object({
  full_name: z.string().min(3, "Введите ФИО"),
  login: z.string().min(3, "Введите логин"),
  password: z.string().min(6, "Пароль минимум 6 символов"),
  role: RoleEnum,
  employee_id: z.number().int().nullable().optional(),
  is_active: z.number().int().min(0).max(1).optional(),
});

const UpdateSchema = z.object({
  id: z.number().int().positive(),
  full_name: z.string().min(3).optional(),
  login: z.string().min(3).optional(),
  password: z.string().min(6).optional(),
  role: RoleEnum.optional(),
  employee_id: z.number().int().nullable().optional(),
  is_active: z.number().int().min(0).max(1).optional(),
});

export async function GET() {
  const auth = await requireApiRoles(["admin"]);
  if (!auth.ok) return auth.response;

  const rows = (await db()
    .prepare(
      `
      SELECT
        u.id,
        u.full_name,
        u.login,
        u.role,
        u.employee_id,
        u.is_active,
        u.last_login,
        u.created_at,
        e.full_name as employee_name
      FROM users u
      LEFT JOIN employees e ON e.id = u.employee_id
      ORDER BY u.id ASC
    `,
    )
    .all()) as unknown[];

  return NextResponse.json({ ok: true, users: rows });
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

  const exists = (await db().prepare("SELECT 1 as x FROM users WHERE login = ?").get(parsed.data.login)) as
    | { x: number }
    | undefined;
  if (exists) return NextResponse.json({ ok: false, error: "Логин уже занят" }, { status: 409 });

  const password_hash = bcrypt.hashSync(parsed.data.password, 10);

  const r = (await db()
    .prepare(
      `
      INSERT INTO users (full_name, login, password_hash, role, employee_id, is_active)
      VALUES (@full_name, @login, @password_hash, @role, @employee_id, @is_active)
    `,
    )
    .run({
      full_name: parsed.data.full_name,
      login: parsed.data.login,
      password_hash,
      role: parsed.data.role,
      employee_id: parsed.data.employee_id ?? null,
      is_active: parsed.data.is_active ?? 1,
    })) as { lastInsertRowid: number };

  await auditLog({
    actorUserId: Number(auth.user.id),
    action: "create",
    entity: "users",
    entityId: Number(r.lastInsertRowid),
    details: `Создан пользователь ${parsed.data.login}`,
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

  const current = (await db()
    .prepare("SELECT id, login, role FROM users WHERE id = ?")
    .get(parsed.data.id)) as { id: number; login: string; role: string } | undefined;
  if (!current) return NextResponse.json({ ok: false, error: "Пользователь не найден" }, { status: 404 });

  const actorId = Number(auth.user.id);
  if (current.id === actorId) {
    if (parsed.data.role && parsed.data.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Нельзя изменить свою роль администратора" }, { status: 400 });
    }
    if (typeof parsed.data.is_active === "number" && parsed.data.is_active === 0) {
      return NextResponse.json({ ok: false, error: "Нельзя заблокировать самого себя" }, { status: 400 });
    }
  }

  if (parsed.data.login && parsed.data.login !== current.login) {
    const taken = (await db().prepare("SELECT 1 as x FROM users WHERE login = ?").get(parsed.data.login)) as
      | { x: number }
      | undefined;
    if (taken) return NextResponse.json({ ok: false, error: "Логин уже занят" }, { status: 409 });
  }

  const fields: string[] = [];
  const params: Record<string, unknown> = { id: parsed.data.id };

  for (const k of ["full_name", "login", "role", "employee_id", "is_active"] as const) {
    if (k in parsed.data && (parsed.data as Record<string, unknown>)[k] !== undefined) {
      fields.push(`${k}=@${k}`);
      params[k] = (parsed.data as Record<string, unknown>)[k] ?? null;
    }
  }

  if (parsed.data.password) {
    const password_hash = bcrypt.hashSync(parsed.data.password, 10);
    fields.push("password_hash=@password_hash");
    params.password_hash = password_hash;
  }

  if (fields.length === 0) return NextResponse.json({ ok: true });

  await db().prepare(`UPDATE users SET ${fields.join(", ")} WHERE id=@id`).run(params);

  await auditLog({
    actorUserId: actorId,
    action: "update",
    entity: "users",
    entityId: parsed.data.id,
    details: `Обновлён пользователь ${current.login}`,
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

  const actorId = Number(auth.user.id);
  if (id === actorId) return NextResponse.json({ ok: false, error: "Нельзя удалить самого себя" }, { status: 400 });

  const target = (await db().prepare("SELECT login FROM users WHERE id = ?").get(id)) as { login: string } | undefined;
  if (!target) return NextResponse.json({ ok: false, error: "Пользователь не найден" }, { status: 404 });

  await db().prepare("DELETE FROM users WHERE id = ?").run(id);
  await auditLog({
    actorUserId: actorId,
    action: "delete",
    entity: "users",
    entityId: id,
    details: `Удалён пользователь ${target.login}`,
  });

  return NextResponse.json({ ok: true });
}
