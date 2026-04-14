import { db } from "@/lib/db";

export type AuditAction = "create" | "update" | "delete" | "status" | "mark" | "record";

export function auditLog(opts: {
  actorUserId: number;
  action: AuditAction;
  entity: string;
  entityId: number | null;
  details: string;
}) {
  db()
    .prepare(
      `INSERT INTO action_logs (user_id, action, entity, entity_id, details)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(opts.actorUserId, opts.action, opts.entity, opts.entityId, opts.details);
}

