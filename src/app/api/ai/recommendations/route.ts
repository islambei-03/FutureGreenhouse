import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/api/rbac";
import { buildRecommendations } from "@/lib/ai/recommendations";

export async function GET() {
  const auth = await requireApiRoles("any");
  if (!auth.ok) return auth.response;

  const recommendations = await buildRecommendations();
  return NextResponse.json({ ok: true, recommendations });
}
