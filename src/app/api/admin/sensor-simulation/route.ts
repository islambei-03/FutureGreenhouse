import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiRoles } from "@/lib/api/rbac";
import {
  getSensorSimulationEnabled,
  setSensorSimulationEnabled,
  startSensorSimulationLoop,
  stopSensorSimulationLoop,
  insertSimulationSensorTick,
} from "@/lib/sensor-simulation";

export const runtime = "nodejs";

const BodySchema = z.object({
  enabled: z.boolean(),
  /** Сразу записать один замер (удобно проверить графики). */
  tickNow: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireApiRoles(["admin"]);
  if (!auth.ok) return auth.response;

  try {
    const enabled = await getSensorSimulationEnabled();
    return NextResponse.json({ ok: true, enabled });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireApiRoles(["admin"]);
  if (!auth.ok) return auth.response;

  let body: z.infer<typeof BodySchema>;
  try {
    const json = await req.json();
    body = BodySchema.parse(json);
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректное тело запроса" }, { status: 400 });
  }

  try {
    await setSensorSimulationEnabled(body.enabled);
    if (body.enabled) {
      await startSensorSimulationLoop();
      if (body.tickNow) await insertSimulationSensorTick();
    } else {
      stopSensorSimulationLoop();
    }
    return NextResponse.json({ ok: true, enabled: body.enabled });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
