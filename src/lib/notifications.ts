import { db } from "@/lib/db";

export type NotificationType = "тревога" | "предупреждение" | "информация" | "успех";

export async function getUserIdByEmployeeId(employeeId: number): Promise<number | null> {
  const row = (await db()
    .prepare("SELECT id FROM users WHERE employee_id = ? AND is_active = 1 LIMIT 1")
    .get(employeeId)) as { id: number } | undefined;
  return row?.id ?? null;
}

/** target_user_id = null → видно всем (системные алерты датчиков). */
export async function createNotification(opts: {
  title: string;
  message: string;
  type?: NotificationType;
  targetUserId?: number | null;
}) {
  const type = opts.type ?? "информация";
  const target = opts.targetUserId ?? null;
  await db()
    .prepare(
      `
      INSERT INTO notifications (title, message, type, is_read, target_user_id, created_at)
      VALUES (?, ?, ?, 0, ?, NOW())
    `,
    )
    .run(opts.title, opts.message, type, target);
}

export async function notifyEmployeeTask(employeeId: number, title: string, message: string) {
  const userId = await getUserIdByEmployeeId(employeeId);
  if (!userId) return;
  await createNotification({
    title,
    message,
    type: "информация",
    targetUserId: userId,
  });
}
