import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/api/rbac";
import { computeGreenhouseHealth } from "@/lib/ai/health";
import { db } from "@/lib/db";

export async function GET() {
  const auth = await requireApiRoles(["admin", "agronomist", "director", "worker"]);
  if (!auth.ok) return auth.response;

  const health = await computeGreenhouseHealth();

  const extras = (await db()
    .prepare(
      `
      SELECT
        g.id,
        g.area,
        g.type,
        (
          SELECT sd.temperature FROM sensor_data sd
          WHERE sd.greenhouse_id = g.id ORDER BY sd.recorded_at DESC LIMIT 1
        ) as temperature,
        (
          SELECT sd.humidity FROM sensor_data sd
          WHERE sd.greenhouse_id = g.id ORDER BY sd.recorded_at DESC LIMIT 1
        ) as humidity
      FROM greenhouses g
      ORDER BY g.id ASC
    `,
    )
    .all()) as Array<{ id: number; area: number; type: string; temperature: number | null; humidity: number | null }>;

  const byId = new Map(extras.map((e) => [e.id, e]));

  const cells = health.map((h) => {
    const e = byId.get(h.id);
    return {
      ...h,
      area: e?.area ?? 100,
      type: e?.type ?? "",
      temperature: e?.temperature ?? null,
      humidity: e?.humidity ?? null,
    };
  });

  return NextResponse.json({ ok: true, cells, updatedAt: new Date().toISOString() });
}
