import OpenAI from "openai";
import { ENV } from "@/lib/env";
import { buildPlannerContext } from "@/lib/ai/context";

export type PlannerEventType = "полив" | "задача" | "осмотр" | "обработка" | "уборка";

export type PlannerEvent = {
  id: string;
  date: string;
  time: string;
  greenhouse: string;
  title: string;
  type: PlannerEventType;
  priority?: "обычный" | "высокий" | "срочный";
  notes?: string;
};

export type WeekPlan = {
  generatedAt: string;
  summary: string;
  days: Array<{ date: string; weekday: string; events: PlannerEvent[] }>;
};

function addDays(base: Date, n: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function weekdayRu(d: Date) {
  return d.toLocaleDateString("ru-RU", { weekday: "short" });
}

export function emptyWeekPlan(): WeekPlan {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(start, i);
    return { date: fmtDate(d), weekday: weekdayRu(d), events: [] as PlannerEvent[] };
  });
  return { generatedAt: new Date().toISOString(), summary: "", days };
}

export async function generateWeekPlan(): Promise<WeekPlan | null> {
  let apiKey: string;
  try {
    apiKey = ENV.OPENAI_API_KEY();
  } catch {
    return null;
  }

  const context = await buildPlannerContext();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const dates = Array.from({ length: 7 }, (_, i) => fmtDate(addDays(start, i))).join(", ");

  const client = new OpenAI({ apiKey });

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.45,
      max_tokens: 2200,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Ты планировщик тепличного хозяйства. Составь реалистичный план работ на 7 дней (${dates}).
Верни JSON:
{
  "summary": "1–2 предложения об общей нагрузке недели",
  "events": [
    {
      "date": "YYYY-MM-DD",
      "time": "HH:mm",
      "greenhouse": "название",
      "title": "краткое действие",
      "type": "полив"|"задача"|"осмотр"|"обработка"|"уборка",
      "priority": "обычный"|"высокий"|"срочный",
      "notes": "опционально"
    }
  ]
}
Учитывай существующие задачи и поливы. 3–6 событий в день. Русский язык.`,
        },
        { role: "user", content: context },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { summary?: string; events?: Array<Record<string, unknown>> };
    const events = Array.isArray(parsed.events) ? parsed.events : [];

    const plan = emptyWeekPlan();
    plan.summary = String(parsed.summary ?? "");
    plan.generatedAt = new Date().toISOString();

    let idx = 0;
    for (const ev of events) {
      const date = String(ev.date ?? "");
      const day = plan.days.find((d) => d.date === date);
      if (!day) continue;
      const type = String(ev.type ?? "задача") as PlannerEventType;
      const allowed: PlannerEventType[] = ["полив", "задача", "осмотр", "обработка", "уборка"];
      day.events.push({
        id: `ev-${idx++}`,
        date,
        time: String(ev.time ?? "09:00").slice(0, 5),
        greenhouse: String(ev.greenhouse ?? "—"),
        title: String(ev.title ?? "Работа"),
        type: allowed.includes(type) ? type : "задача",
        priority:
          ev.priority === "срочный" || ev.priority === "высокий" || ev.priority === "обычный"
            ? ev.priority
            : "обычный",
        notes: ev.notes ? String(ev.notes) : undefined,
      });
    }

    for (const d of plan.days) {
      d.events.sort((a, b) => a.time.localeCompare(b.time));
    }

    return plan;
  } catch {
    return null;
  }
}

export const PLANNER_SETTINGS_KEY = "ai_week_plan";
