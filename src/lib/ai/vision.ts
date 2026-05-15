import OpenAI from "openai";
import { ENV } from "@/lib/env";

export type PlantVisionResult = {
  diagnosis: string;
  confidence: "низкая" | "средняя" | "высокая";
  issues: string[];
  actions: string[];
  prevention: string;
};

export async function analyzePlantPhoto(imageBase64: string, mimeType: string): Promise<PlantVisionResult | null> {
  let apiKey: string;
  try {
    apiKey = ENV.OPENAI_API_KEY();
  } catch {
    return null;
  }

  const client = new OpenAI({ apiKey });
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.25,
      max_tokens: 900,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Ты агроном-эксперт тепличного хозяйства. По фото определи состояние объекта: растение, плод, цветок, лист, вредитель, субстрат, оборудование и т.д.
Дай практичный вывод для оператора: болезни, дефициты, качество плода, созревание, повреждения, вредители.
Ответь строго JSON:
{
  "diagnosis": "краткий основной вывод",
  "confidence": "низкая" | "средняя" | "высокая",
  "issues": ["список наблюдений"],
  "actions": ["что сделать сегодня и на неделе"],
  "prevention": "профилактика"
}
Если объект не связан с теплицей — всё равно опиши что видишь и дай общие рекомендации. Русский язык.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Проанализируй изображение в контексте тепличного хозяйства (растение, плод, урожай или проблема)." },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlantVisionResult;
    if (!parsed.diagnosis) return null;
    return {
      diagnosis: String(parsed.diagnosis),
      confidence: parsed.confidence === "высокая" || parsed.confidence === "низкая" ? parsed.confidence : "средняя",
      issues: Array.isArray(parsed.issues) ? parsed.issues.map(String) : [],
      actions: Array.isArray(parsed.actions) ? parsed.actions.map(String) : [],
      prevention: String(parsed.prevention ?? ""),
    };
  } catch {
    return null;
  }
}
