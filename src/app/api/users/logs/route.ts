import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRoles } from "@/lib/api/rbac";

export async function GET() {
  const auth = await requireApiRoles(["admin"]);
  if (!auth.ok) return auth.response;

  const rows = (await db()
    .prepare(
      `
      SELECT
        l.id,
        l.action,
        l.entity,
        l.entity_id,
        l.details,
        l.created_at,
        u.full_name as user_full_name,
        u.login as user_login,
        u.role as user_role
      FROM action_logs l
      JOIN users u ON u.id = l.user_id
      ORDER BY l.created_at DESC
      LIMIT 50
    `,
    )
    .all()) as unknown[];

  return NextResponse.json({ ok: true, logs: rows });
}
