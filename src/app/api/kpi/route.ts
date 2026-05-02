import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRoles } from "@/lib/api/rbac";
import { apiT } from "@/lib/api/i18n";
import { loadKpi, loadKpiSeries } from "@/lib/repo/kpi";

const QuerySchema = z.object({
  period: z.enum(["day", "week", "month"]).optional(),
});

export async function GET(req: Request) {
  const auth = await requireApiRoles("any");
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({ period: url.searchParams.get("period") ?? undefined });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: await apiT("api.badParams") }, { status: 400 });
  }

  const period = parsed.data.period ?? "week";
  const kpi = await loadKpi(period);
  const series = await loadKpiSeries(period);

  return NextResponse.json({
    ok: true,
    period,
    kpi,
    series,
  });
}
