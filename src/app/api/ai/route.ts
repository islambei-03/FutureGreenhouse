import { NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";
import { requireApiRoles } from "@/lib/api/rbac";
import { db } from "@/lib/db";
import { ENV } from "@/lib/env";

const BodySchema = z.object({
  message: z.string().min(1, "Введите сообщение"),
  greenhouse_id: z.number().int().positive().nullable().optional(),
});

function buildGreenhouseContext() {
  const rows = db()
    .prepare(
      `
      SELECT
        g.id,
        g.name,
        g.status,
        g.temp_min, g.temp_max,
        g.humidity_min, g.humidity_max,
        (
          SELECT sd.temperature
          FROM sensor_data sd
          WHERE sd.greenhouse_id = g.id
          ORDER BY sd.recorded_at DESC
          LIMIT 1
        ) as temperature,
        (
          SELECT sd.humidity
          FROM sensor_data sd
          WHERE sd.greenhouse_id = g.id
          ORDER BY sd.recorded_at DESC
          LIMIT 1
        ) as humidity,
        (
          SELECT sd.co2
          FROM sensor_data sd
          WHERE sd.greenhouse_id = g.id
          ORDER BY sd.recorded_at DESC
          LIMIT 1
        ) as co2,
        (
          SELECT group_concat(c.name, ', ')
          FROM cultures c
          WHERE c.greenhouse_id = g.id
        ) as cultures
      FROM greenhouses g
      ORDER BY g.id ASC
    `,
    )
    .all() as Array<Record<string, any>>;

  const lines = rows.map((r) => {
    const t = r.temperature ?? "—";
    const h = r.humidity ?? "—";
    const c = r.co2 ?? "—";
    const cultures = r.cultures ?? "—";
    return [
      `- ${r.name} (ID ${r.id}, статус: ${r.status})`,
      `  Температура: ${t}°C (норма ${r.temp_min}–${r.temp_max})`,
      `  Влажность: ${h}% (норма ${r.humidity_min}–${r.humidity_max})`,
      `  CO2: ${c} ppm`,
      `  Культуры: ${cultures}`,
    ].join("\n");
  });

  return `Текущие данные теплиц:\n${lines.join("\n")}`;
}

function buildSingleGreenhouseContext(greenhouseId: number) {
  const g = db()
    .prepare(
      `
      SELECT id, name, status, temp_min, temp_max, humidity_min, humidity_max
      FROM greenhouses
      WHERE id = ?
    `,
    )
    .get(greenhouseId) as
    | {
        id: number;
        name: string;
        status: string;
        temp_min: number;
        temp_max: number;
        humidity_min: number;
        humidity_max: number;
      }
    | undefined;

  if (!g) return null;

  const sensor = db()
    .prepare(
      `
      SELECT temperature, humidity, co2, recorded_at
      FROM sensor_data
      WHERE greenhouse_id = ?
      ORDER BY recorded_at DESC
      LIMIT 1
    `,
    )
    .get(greenhouseId) as { temperature: number | null; humidity: number | null; co2: number | null; recorded_at: string } | undefined;

  const nextWatering = db()
    .prepare(
      `
      SELECT type, scheduled_at, duration_min, volume_l, status
      FROM watering_schedule
      WHERE greenhouse_id = ?
        AND status != 'выполнен'
      ORDER BY scheduled_at ASC
      LIMIT 1
    `,
    )
    .get(greenhouseId) as
    | { type: string; scheduled_at: string; duration_min: number | null; volume_l: number | null; status: string }
    | undefined;

  const tasks = db()
    .prepare(
      `
      SELECT title, priority, deadline, is_completed
      FROM tasks
      WHERE greenhouse_id = ?
      ORDER BY
        CASE priority
          WHEN 'срочно' THEN 0
          WHEN 'высокий' THEN 1
          WHEN 'средний' THEN 2
          WHEN 'низкий' THEN 3
          ELSE 9
        END ASC,
        COALESCE(deadline, '9999-12-31') ASC
      LIMIT 8
    `,
    )
    .all(greenhouseId) as Array<{ title: string; priority: string; deadline: string | null; is_completed: number }>;

  const cultures = db()
    .prepare(
      `
      SELECT name, stage, progress
      FROM cultures
      WHERE greenhouse_id = ?
      ORDER BY id DESC
      LIMIT 10
    `,
    )
    .all(greenhouseId) as Array<{ name: string; stage: string; progress: number | null }>;

  const lines = [
    `Выбранная теплица: ${g.name} (ID ${g.id}, статус: ${g.status})`,
    `Нормы: температура ${g.temp_min}–${g.temp_max}°C, влажность ${g.humidity_min}–${g.humidity_max}%`,
    "",
    `Последние датчики: ${
      sensor
        ? `${sensor.temperature ?? "—"}°C, ${sensor.humidity ?? "—"}%, CO2 ${sensor.co2 ?? "—"} ppm (время: ${sensor.recorded_at})`
        : "нет данных"
    }`,
    `Ближайший полив: ${
      nextWatering
        ? `${nextWatering.type} · ${nextWatering.scheduled_at} · ${nextWatering.duration_min ?? "—"} мин · ${nextWatering.volume_l ?? "—"} л · статус: ${nextWatering.status}`
        : "нет запланированных"
    }`,
    "",
    `Культуры: ${
      cultures.length
        ? cultures.map((c) => `${c.name} (${c.stage}${c.progress != null ? `, ${c.progress}%` : ""})`).join("; ")
        : "—"
    }`,
    `Задачи: ${
      tasks.length
        ? tasks
            .map((t) => `${t.is_completed ? "✓" : "•"} ${t.title} [${t.priority}${t.deadline ? `, до ${t.deadline}` : ""}]`)
            .join("; ")
        : "—"
    }`,
  ];

  return lines.join("\n");
}

export async function GET() {
  const auth = await requireApiRoles(["admin", "agronomist", "viewer"]);
  if (!auth.ok) return auth.response;

  const rows = db()
    .prepare(
      `
      SELECT id, role, content, created_at
      FROM ai_chat_history
      ORDER BY datetime(created_at) ASC
      LIMIT 200
    `,
    )
    .all();

  return NextResponse.json({ ok: true, messages: rows });
}

export async function POST(req: Request) {
  const auth = await requireApiRoles(["admin", "agronomist", "viewer"]);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 },
    );
  }

  const apiKey = ENV.OPENAI_API_KEY();
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Не задан OPENAI_API_KEY в .env" }, { status: 500 });
  }

  const client = new OpenAI({ apiKey });

  const userMessage = parsed.data.message.trim();
  const ghId = parsed.data.greenhouse_id ?? null;
  const selectedContext = ghId ? buildSingleGreenhouseContext(ghId) : null;

  const systemPrompt = [
    "Ты агроном-эксперт системы Future Greenhouse.",
    "Отвечай на русском языке, коротко и практично.",
    "Если данных недостаточно — уточняй, какие параметры нужны.",
    "",
    selectedContext ? selectedContext : buildGreenhouseContext(),
  ].join("\n");

  const history = db()
    .prepare(
      `
      SELECT role, content
      FROM ai_chat_history
      ORDER BY datetime(created_at) ASC
      LIMIT 40
    `,
    )
    .all() as Array<{ role: "system" | "user" | "assistant"; content: string }>;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  const tx = db().transaction(() => {
    db().prepare(`INSERT INTO ai_chat_history (role, content) VALUES ('user', ?)`).run(userMessage);
  });
  tx();

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.4,
  });

  const assistantMessage = completion.choices[0]?.message?.content?.trim() || "Не смог сформировать ответ. Попробуйте переформулировать вопрос.";

  db().prepare(`INSERT INTO ai_chat_history (role, content) VALUES ('assistant', ?)`).run(assistantMessage);

  return NextResponse.json({ ok: true, reply: assistantMessage });
}

