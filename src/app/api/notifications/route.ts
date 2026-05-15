import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRoles } from "@/lib/api/rbac";
import { auditLog } from "@/lib/audit";
import { apiT } from "@/lib/api/i18n";

const MarkSchema = z.object({
  id: z.number().int().optional(),
  all: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireApiRoles("any");
  if (!auth.ok) return auth.response;

  const userId = Number(auth.user.id);
  const isPrivileged = auth.user.role === "admin" || auth.user.role === "agronomist" || auth.user.role === "director";

  const rows = isPrivileged
    ? ((await db()
        .prepare(
          `
      SELECT id, title, message, type, is_read, created_at, target_user_id
      FROM notifications
      ORDER BY created_at DESC
      LIMIT 80
    `,
        )
        .all()) as unknown[])
    : ((await db()
        .prepare(
          `
      SELECT id, title, message, type, is_read, created_at, target_user_id
      FROM notifications
      WHERE target_user_id IS NULL OR target_user_id = ?
      ORDER BY created_at DESC
      LIMIT 80
    `,
        )
        .all(userId)) as unknown[]);

  const unread = isPrivileged
    ? ((await db().prepare("SELECT COUNT(*)::int as c FROM notifications WHERE is_read = 0").get()) as { c: number })
    : ((await db()
        .prepare(
          "SELECT COUNT(*)::int as c FROM notifications WHERE is_read = 0 AND (target_user_id IS NULL OR target_user_id = ?)",
        )
        .get(userId)) as { c: number });

  return NextResponse.json({ ok: true, notifications: rows, unreadCount: unread.c });
}

export async function PUT(req: Request) {
  const auth = await requireApiRoles("any");
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = MarkSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? (await apiT("api.badData")) },
      { status: 400 },
    );
  }

  if (parsed.data.all) {
    await db().prepare("UPDATE notifications SET is_read = 1 WHERE is_read = 0").run();
    await auditLog({
      actorUserId: Number(auth.user.id),
      action: "mark",
      entity: "notifications",
      entityId: null,
      details: "Отмечены все уведомления прочитанными",
    });
    return NextResponse.json({ ok: true });
  }

  if (typeof parsed.data.id === "number") {
    await db().prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(parsed.data.id);
    await auditLog({
      actorUserId: Number(auth.user.id),
      action: "mark",
      entity: "notifications",
      entityId: parsed.data.id,
      details: `Отмечено уведомление #${parsed.data.id} прочитанным`,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: await apiT("api.needIdOrAll") }, { status: 400 });
}
