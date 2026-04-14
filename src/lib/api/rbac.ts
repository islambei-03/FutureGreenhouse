import { NextResponse } from "next/server";
import type { UserRole } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { apiT } from "@/lib/api/i18n";

export type ApiAuthResult =
  | { ok: true; user: { id: string; login: string; fullName: string; role: UserRole } }
  | { ok: false; response: NextResponse };

export async function requireApiRoles(allowed: UserRole[] | "any"): Promise<ApiAuthResult> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: await apiT("api.unauthorized") }, { status: 401 }),
    };
  }

  const user = { id: session.sub, login: session.login, fullName: session.fullName, role: session.role };

  if (allowed !== "any" && !allowed.includes(user.role)) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: await apiT("api.forbidden") }, { status: 403 }),
    };
  }

  return { ok: true, user };
}

