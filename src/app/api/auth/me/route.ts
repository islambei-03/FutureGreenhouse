import { NextResponse } from "next/server";
import { RoleLabel } from "@/lib/rbac";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  return NextResponse.json({
    ok: true,
    user: {
      id: session.sub,
      fullName: session.fullName,
      login: session.login,
      role: session.role,
      roleLabel: RoleLabel[session.role],
    },
  });
}

