import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRoles } from "@/lib/api/rbac";
import { fetchEsp32Reading, getEsp32SensorUrl } from "@/lib/hardware/esp32-sensor";

export async function GET(req: Request) {
  const auth = await requireApiRoles(["admin"]);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const shouldSave = url.searchParams.get("save") === "1";
  const ghId = Number(url.searchParams.get("greenhouse_id") ?? "1");

  try {
    const reading = await fetchEsp32Reading();
    let savedId: number | null = null;

    if (shouldSave && Number.isFinite(ghId) && ghId > 0) {
      const row = (await db()
        .prepare(
          `
          INSERT INTO sensor_data (greenhouse_id, temperature, humidity, co2, recorded_at, recorded_by_user_id)
          VALUES (?, ?, ?, ?, now(), ?)
          RETURNING id
        `,
        )
        .get(ghId, reading.temperature, reading.humidity, 650, Number(auth.user.id))) as { id: number } | undefined;
      savedId = row?.id != null ? Number(row.id) : null;
    }

    return NextResponse.json({
      ok: true,
      reading,
      sourceUrl: getEsp32SensorUrl(),
      savedId,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ошибка чтения датчика";
    return NextResponse.json({ ok: false, error: message, sourceUrl: getEsp32SensorUrl() }, { status: 502 });
  }
}
