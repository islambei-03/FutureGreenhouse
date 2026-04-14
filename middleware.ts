import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, type UserRole, verifyAuthToken } from "@/lib/auth";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
];

type RoleRule = { prefix: string; allowed: UserRole[] };

// Правила доступа по разделам (будем расширять по мере добавления страниц).
const ROLE_RULES: RoleRule[] = [
  { prefix: "/users", allowed: ["admin"] }, // управление пользователями
  { prefix: "/db", allowed: ["admin"] }, // просмотр таблиц БД (admin)
  { prefix: "/sensor-entry", allowed: ["admin", "operator"] }, // ввод данных датчиков
  { prefix: "/reports", allowed: ["admin", "agronomist", "viewer"] }, // оператору отчёты нельзя
  { prefix: "/cultures", allowed: ["admin", "agronomist", "viewer"] }, // оператору культуры нельзя
  { prefix: "/ai", allowed: ["admin", "agronomist", "viewer"] }, // оператору ИИ не нужен по ТЗ
];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (pathname.startsWith("/images")) return true;
  return false;
}

function allowedRolesForPath(pathname: string): UserRole[] | null {
  const rule = ROLE_RULES.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
  return rule ? rule.allowed : null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  try {
    const session = await verifyAuthToken(token);
    const allowed = allowedRolesForPath(pathname);
    if (allowed && !allowed.includes(session.role)) {
      const url = req.nextUrl.clone();
      url.pathname = "/403";
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    /*
      Защищаем всё, кроме статики Next.js.
      Login и auth API пропускаем в middleware() через isPublicPath.
    */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

