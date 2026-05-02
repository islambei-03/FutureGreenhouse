import { NextResponse } from "next/server";
import { ENV } from "@/lib/env";
import { ensureDbReady } from "@/lib/db";
import { getSensorSimulationEnabled, insertSimulationSensorTick } from "@/lib/sensor-simulation";

export const runtime = "nodejs";

/**
 * Один тик симуляции для serverless / внешнего cron.
 * Заголовок: Authorization: Bearer <CRON_SECRET> или ?secret=
 */
export async function GET(req: Request) {
  const secret = ENV.CRON_SECRET();
  if (!secret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET не задан" }, { status: 503 });
  }

  const auth = req.headers.get("authorization");
  const q = new URL(req.url).searchParams.get("secret");
  if (auth !== `Bearer ${secret}` && q !== secret) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 401 });
  }

  await ensureDbReady();
  const on = await getSensorSimulationEnabled();
  if (!on) {
    return NextResponse.json({ ok: true, ticked: false, reason: "disabled" });
  }

  await insertSimulationSensorTick();
  return NextResponse.json({ ok: true, ticked: true });
}
