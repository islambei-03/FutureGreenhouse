import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRoles } from "@/lib/api/rbac";
import { generateGreenhouseMapSummary } from "@/lib/ai/greenhouse-summary";
import { ENV } from "@/lib/env";

const BodySchema = z.object({
  greenhouse_id: z.number().int().positive(),
});

export async function POST(req: Request) {
  const auth = await requireApiRoles(["admin", "agronomist", "director", "worker"]);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Некорректный ID теплицы" }, { status: 400 });
  }

  try {
    ENV.OPENAI_API_KEY();
  } catch {
    return NextResponse.json({ ok: false, error: "Не задан OPENAI_API_KEY в .env" }, { status: 500 });
  }

  const summary = await generateGreenhouseMapSummary(parsed.data.greenhouse_id);
  if (!summary) {
    return NextResponse.json({ ok: false, error: "Не удалось сформировать сводку" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, summary });
}
