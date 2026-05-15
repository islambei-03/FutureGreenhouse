import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/api/rbac";
import { computeGreenhouseHealth } from "@/lib/ai/health";

export async function GET() {
  const auth = await requireApiRoles(["admin", "agronomist", "director", "worker"]);
  if (!auth.ok) return auth.response;

  const health = await computeGreenhouseHealth();
  return NextResponse.json({ ok: true, health });
}
