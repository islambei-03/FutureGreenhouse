import OpenAI from "openai";
import { ENV } from "@/lib/env";

export async function generateReportSummary(reportContext: string): Promise<string | null> {
  let apiKey: string;
  try {
    apiKey = ENV.OPENAI_API_KEY();
  } catch {
    return null;
  }

  const client = new OpenAI({ apiKey });

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      max_tokens: 650,
      messages: [
        {
          role: "system",
          content:
            "Ты агроном-аналитик Future Greenhouse. Пиши на русском, структурированно: итоги периода, что хорошо, что плохо, рекомендации на следующий месяц. Без markdown-заголовков с #, используй короткие абзацы и маркированные списки через «•».",
        },
        {
          role: "user",
          content: `Сформируй раздел «Выводы и рекомендации» для PDF-отчёта по данным:\n\n${reportContext}`,
        },
      ],
    });
    return completion.choices[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}
