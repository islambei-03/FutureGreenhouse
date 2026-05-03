import { SignJWT, jwtVerify } from "jose";
import type { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ENV } from "@/lib/env";

export type UserRole = "admin" | "director" | "agronomist" | "worker";

export type AuthTokenPayload = {
  sub: string; // user id
  login: string;
  role: UserRole;
  fullName: string;
};

const COOKIE_NAME = "fg_token";

function secretKey() {
  return new TextEncoder().encode(ENV.JWT_SECRET());
}

export async function signAuthToken(payload: AuthTokenPayload) {
  const expiresIn = ENV.JWT_EXPIRES_IN(); // e.g. 7d
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({ login: payload.login, role: payload.role, fullName: payload.fullName })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.sub)
    .setIssuedAt(now)
    .setExpirationTime(expiresIn)
    .sign(secretKey());
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey());
  const role = payload.role;
  if (role !== "admin" && role !== "director" && role !== "agronomist" && role !== "worker") {
    throw new Error("Некорректная роль в токене");
  }
  return {
    sub: String(payload.sub ?? ""),
    login: String(payload.login ?? ""),
    role,
    fullName: String(payload.fullName ?? ""),
  } satisfies AuthTokenPayload;
}

function authCookieAttrs(): { httpOnly: true; sameSite: "lax"; secure: boolean; path: string } {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

/** Для Route Handlers: cookie обязательно вешать на `NextResponse`, иначе на Vercel заголовок Set-Cookie может не уйти клиенту. */
export function attachAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, authCookieAttrs());
}

export function attachClearAuthCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", { ...authCookieAttrs(), maxAge: 0 });
}

export async function setAuthCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, authCookieAttrs());
}

export async function clearAuthCookie() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", { ...authCookieAttrs(), maxAge: 0 });
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;

