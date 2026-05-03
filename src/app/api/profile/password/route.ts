import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireApiRoles } from "@/lib/api/rbac";
import { db } from "@/lib/db";
import { apiT } from "@/lib/api/i18n";
import { auditLog } from "@/lib/audit";

const BodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export async function PUT(req: Request) {
  const auth = await requireApiRoles("any");
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: await apiT("api.badData") }, { status: 400 });
  }

  const user = (await db()
    .prepare(`SELECT id, password_hash FROM users WHERE id = ?`)
    .get(Number(auth.user.id))) as { id: number; password_hash: string } | undefined;

  if (!user) {
    return NextResponse.json({ ok: false, error: await apiT("api.badId") }, { status: 404 });
  }

  const ok = bcrypt.compareSync(parsed.data.currentPassword, user.password_hash);
  if (!ok) {
    return NextResponse.json({ ok: false, error: await apiT("api.forbidden") }, { status: 403 });
  }

  const hash = bcrypt.hashSync(parsed.data.newPassword, 10);
  await db().prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(hash, user.id);

  await auditLog({
    actorUserId: user.id,
    action: "update",
    entity: "profile",
    entityId: user.id,
    details: "Смена пароля",
  });

  return NextResponse.json({ ok: true });
}
