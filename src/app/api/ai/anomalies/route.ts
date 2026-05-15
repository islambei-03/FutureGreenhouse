import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRoles } from "@/lib/api/rbac";
import { detectSensorAnomalies } from "@/lib/ai/anomalies";

const QuerySchema = z.object({
  greenhouse_id: z.coerce.number().int().positive(),
  range: z.enum(["7d", "14d"]).optional(),
});

export async function GET(req: Request) {
  const auth = await requireApiRoles(["admin", "agronomist", "director", "worker"]);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    greenhouse_id: url.searchParams.get("greenhouse_id"),
    range: url.searchParams.get("range") ?? "7d",
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Укажите greenhouse_id" }, { status: 400 });
  }

  const data = await detectSensorAnomalies(parsed.data.greenhouse_id, parsed.data.range ?? "7d");
  return NextResponse.json({ ok: true, ...data });
}
