export type LiveSensorReading = {
  temperature: number;
  humidity: number;
  sourceUrl: string;
  fetchedAt: string;
};

export function getEsp32SensorUrl() {
  const fromEnv = process.env.ARDUINO_SENSOR_URL?.trim();
  return fromEnv || "http://10.233.53.143/";
}

function parseNumber(raw: string) {
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Парсит HTML/текст с ESP32 (Температура: 22°C, Влажность: 66%). */
export function parseEsp32Payload(body: string, sourceUrl: string): LiveSensorReading {
  const tempMatch =
    body.match(/Температура:\s*([\d.,]+)/i) ??
    body.match(/temperature["\s:>]+([\d.,]+)/i) ??
    body.match(/"temp(?:erature)?"\s*:\s*([\d.,]+)/i);
  const humMatch =
    body.match(/Влажность:\s*([\d.,]+)/i) ??
    body.match(/humidity["\s:>]+([\d.,]+)/i) ??
    body.match(/"hum(?:idity)?"\s*:\s*([\d.,]+)/i);

  const temperature = tempMatch ? parseNumber(tempMatch[1]!) : null;
  const humidity = humMatch ? parseNumber(humMatch[1]!) : null;

  if (temperature == null || humidity == null) {
    throw new Error("Не удалось прочитать температуру и влажность с контроллера");
  }

  return {
    temperature,
    humidity,
    sourceUrl,
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchEsp32Reading(): Promise<LiveSensorReading> {
  const sourceUrl = getEsp32SensorUrl();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(sourceUrl, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "text/html,application/json,text/plain" },
    });
    if (!res.ok) throw new Error(`Контроллер ответил: HTTP ${res.status}`);
    const body = await res.text();
    return parseEsp32Payload(body, sourceUrl);
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("Контроллер не отвечает (таймаут). Проверьте Wi‑Fi и IP.");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
