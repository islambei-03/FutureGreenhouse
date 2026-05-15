import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRoles } from "@/lib/api/rbac";
import { buildGreenhouseForecast } from "@/lib/ai/forecast";

const QuerySchema = z.object({
  greenhouse_id: z.coerce.number().int().positive(),
});

export async function GET(req: Request) {
  const auth = await requireApiRoles(["admin", "agronomist", "director", "worker"]);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({ greenhouse_id: url.searchParams.get("greenhouse_id") });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Укажите greenhouse_id" }, { status: 400 });
  }

  const forecast = await buildGreenhouseForecast(parsed.data.greenhouse_id);
  if (!forecast) {
    return NextResponse.json({ ok: false, error: "Теплица не найдена" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, forecast });
}
