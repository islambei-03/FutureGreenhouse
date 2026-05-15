import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRoles } from "@/lib/api/rbac";
import { db } from "@/lib/db";
import { generateWeekPlan, PLANNER_SETTINGS_KEY, type WeekPlan } from "@/lib/ai/planner";
import { ENV } from "@/lib/env";

const PlanSchema = z.object({
  plan: z.object({
    generatedAt: z.string(),
    summary: z.string(),
    days: z.array(
      z.object({
        date: z.string(),
        weekday: z.string(),
        events: z.array(
          z.object({
            id: z.string(),
            date: z.string(),
            time: z.string(),
            greenhouse: z.string(),
            title: z.string(),
            type: z.enum(["полив", "задача", "осмотр", "обработка", "уборка"]),
            priority: z.enum(["обычный", "высокий", "срочный"]).optional(),
            notes: z.string().optional(),
          }),
        ),
      }),
    ),
  }),
});

async function loadSavedPlan(): Promise<WeekPlan | null> {
  const row = (await db()
    .prepare(`SELECT value FROM app_settings WHERE key = ?`)
    .get(PLANNER_SETTINGS_KEY)) as { value: string } | undefined;
  if (!row?.value) return null;
  try {
    return JSON.parse(row.value) as WeekPlan;
  } catch {
    return null;
  }
}

async function savePlan(plan: WeekPlan) {
  await db()
    .prepare(
      `
      INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `,
    )
    .run(PLANNER_SETTINGS_KEY, JSON.stringify(plan));
}

export async function GET() {
  const auth = await requireApiRoles(["admin", "agronomist", "director"]);
  if (!auth.ok) return auth.response;

  const plan = await loadSavedPlan();
  return NextResponse.json({ ok: true, plan });
}

export async function POST() {
  const auth = await requireApiRoles(["admin", "agronomist", "director"]);
  if (!auth.ok) return auth.response;

  try {
    ENV.OPENAI_API_KEY();
  } catch {
    return NextResponse.json({ ok: false, error: "Не задан OPENAI_API_KEY в .env" }, { status: 500 });
  }

  const plan = await generateWeekPlan();
  if (!plan) {
    return NextResponse.json({ ok: false, error: "Не удалось составить план" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, plan });
}

export async function PUT(req: Request) {
  const auth = await requireApiRoles(["admin", "agronomist", "director"]);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = PlanSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Некорректный план" }, { status: 400 });
  }

  await savePlan(parsed.data.plan);
  return NextResponse.json({ ok: true });
}
