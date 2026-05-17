import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { requireApiRoles } from "@/lib/api/rbac";
import { syncTeamAll } from "@/lib/team-sync";

export async function POST() {
  const auth = await requireApiRoles(["admin"]);
  if (!auth.ok) return auth.response;

  const pool = getDbPool();
  const result = await syncTeamAll(pool);

  return NextResponse.json({ ok: true, ...result });
}
