import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRoles } from "@/lib/api/rbac";
import { apiT } from "@/lib/api/i18n";

const QuerySchema = z.object({
  period: z.enum(["day", "week", "month"]).optional(),
});

function periodWhere(p: "day" | "week" | "month") {
  if (p === "day") return "t.created_at >= datetime('now','-1 day')";
  if (p === "week") return "t.created_at >= datetime('now','-7 day')";
  return "t.created_at >= datetime('now','-30 day')";
}

export async function GET(req: Request) {
  const auth = await requireApiRoles("any");
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({ period: url.searchParams.get("period") ?? undefined });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: await apiT("api.badParams") }, { status: 400 });
  }

  const period = parsed.data.period ?? "week";

  const active = db()
    .prepare("SELECT COUNT(*) as c FROM greenhouses WHERE status = 'активна'")
    .get() as { c: number };

  const cultures = db().prepare("SELECT COUNT(*) as c FROM cultures").get() as { c: number };

  const staffToday = db()
    .prepare("SELECT COUNT(*) as c FROM employees WHERE status = 'на смене'")
    .get() as { c: number };

  // средняя температура по последним показаниям каждой теплицы
  const temps = db()
    .prepare(
      `
      SELECT AVG(x.temperature) as avgTemp
      FROM (
        SELECT (
          SELECT sd.temperature
          FROM sensor_data sd
          WHERE sd.greenhouse_id = g.id
          ORDER BY sd.recorded_at DESC
          LIMIT 1
        ) as temperature
        FROM greenhouses g
      ) x
      WHERE x.temperature IS NOT NULL
    `,
    )
    .get() as { avgTemp: number | null };

  const where = periodWhere(period);
  const tasksAgg = db()
    .prepare(
      `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as done
      FROM tasks t
      WHERE ${where}
    `,
    )
    .get() as { total: number; done: number | null };

  return NextResponse.json({
    ok: true,
    period,
    kpi: {
      activeGreenhouses: active.c,
      avgTemp: temps.avgTemp,
      cultures: cultures.c,
      staffToday: staffToday.c,
      tasksTotal: tasksAgg.total,
      tasksDone: tasksAgg.done ?? 0,
    },
  });
}

