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

  const rows = db()
    .prepare(
      `
      SELECT id, title, message, type, is_read, created_at
      FROM notifications
      ORDER BY datetime(created_at) DESC
      LIMIT 50
    `,
    )
    .all();

  const unread = db().prepare("SELECT COUNT(*) as c FROM notifications WHERE is_read = 0").get() as { c: number };

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
    db().prepare("UPDATE notifications SET is_read = 1 WHERE is_read = 0").run();
    auditLog({ actorUserId: Number(auth.user.id), action: "mark", entity: "notifications", entityId: null, details: "Отмечены все уведомления прочитанными" });
    return NextResponse.json({ ok: true });
  }

  if (typeof parsed.data.id === "number") {
    db().prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(parsed.data.id);
    auditLog({ actorUserId: Number(auth.user.id), action: "mark", entity: "notifications", entityId: parsed.data.id, details: `Отмечено уведомление #${parsed.data.id} прочитанным` });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: await apiT("api.needIdOrAll") }, { status: 400 });
}

