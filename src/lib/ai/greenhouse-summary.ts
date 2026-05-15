import OpenAI from "openai";
import { ENV } from "@/lib/env";
import { buildSingleGreenhouseContext } from "@/lib/ai/context";

export async function generateGreenhouseMapSummary(greenhouseId: number): Promise<string | null> {
  const context = await buildSingleGreenhouseContext(greenhouseId);
  if (!context) return null;

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
      max_tokens: 450,
      messages: [
        {
          role: "system",
          content:
            "Ты диспетчер SCADA-системы тепличного хозяйства Future Greenhouse. Дай краткую оперативную сводку по одной теплице: статус (норма/внимание/тревога), ключевые риски, 2–3 действия на сегодня. Русский язык, без markdown-заголовков, 4–6 предложений.",
        },
        { role: "user", content: context },
      ],
    });
    return completion.choices[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}
