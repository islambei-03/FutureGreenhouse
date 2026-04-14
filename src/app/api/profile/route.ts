import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRoles } from "@/lib/api/rbac";
import { db } from "@/lib/db";
import { apiT } from "@/lib/api/i18n";
import { auditLog } from "@/lib/audit";

const UpdateSchema = z.object({
  full_name: z.string().min(3),
});

export async function GET() {
  const auth = await requireApiRoles("any");
  if (!auth.ok) return auth.response;

  const me = db()
    .prepare(
      `
      SELECT id, full_name, login, role, is_active, last_login, totp_enabled
      FROM users
      WHERE id = ?
    `,
    )
    .get(Number(auth.user.id)) as
    | {
        id: number;
        full_name: string;
        login: string;
        role: string;
        is_active: number;
        last_login: string | null;
        totp_enabled: number;
      }
    | undefined;

  if (!me) {
    return NextResponse.json({ ok: false, error: await apiT("api.badId") }, { status: 404 });
  }

  const logins = db()
    .prepare(
      `
      SELECT id, ip, user_agent, created_at
      FROM login_history
      WHERE user_id = ?
      ORDER BY datetime(created_at) DESC
      LIMIT 10
    `,
    )
    .all(me.id) as Array<{ id: number; ip: string | null; user_agent: string | null; created_at: string }>;

  return NextResponse.json({
    ok: true,
    me: {
      id: me.id,
      full_name: me.full_name,
      login: me.login,
      role: me.role,
      last_login: me.last_login,
      totp_enabled: !!me.totp_enabled,
    },
    logins,
  });
}

export async function PUT(req: Request) {
  const auth = await requireApiRoles("any");
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: await apiT("api.badData") }, { status: 400 });
  }

  db().prepare(`UPDATE users SET full_name = ? WHERE id = ?`).run(parsed.data.full_name.trim(), Number(auth.user.id));

  auditLog({
    actorUserId: Number(auth.user.id),
    action: "update",
    entity: "profile",
    entityId: Number(auth.user.id),
    details: "Обновление ФИО",
  });

  return NextResponse.json({ ok: true });
}

