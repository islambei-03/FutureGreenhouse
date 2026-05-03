import { NextResponse } from "next/server";
import { attachClearAuthCookie } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  attachClearAuthCookie(res);
  return res;
}

