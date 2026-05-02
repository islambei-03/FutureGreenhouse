import type { DbAdapter } from "@/lib/db/adapter";
import { db } from "@/lib/db";

export type AuditAction = "create" | "update" | "delete" | "status" | "mark" | "record";

export async function auditLog(
  opts: {
    actorUserId: number;
    action: AuditAction;
    entity: string;
    entityId: number | null;
    details: string;
  },
  adapter?: DbAdapter,
) {
  const d = adapter ?? db();
  await d
    .prepare(
      `INSERT INTO action_logs (user_id, action, entity, entity_id, details)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(opts.actorUserId, opts.action, opts.entity, opts.entityId, opts.details);
}
