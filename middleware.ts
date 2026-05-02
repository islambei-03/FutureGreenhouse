import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, type UserRole, verifyAuthToken } from "@/lib/auth";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
];

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (pathname.startsWith("/images")) return true;
  /** Cron-роуты защищены своим секретом (без cookie). */
  if (pathname.startsWith("/api/cron/")) return true;
  return false;
}

type RoleRule = { prefix: string; allowed: UserRole[] };

// Правила доступа по разделам (будем расширять по мере добавления страниц).
const ROLE_RULES: RoleRule[] = [
  { prefix: "/api/admin", allowed: ["admin"] },
  { prefix: "/users", allowed: ["admin"] }, // управление пользователями
  { prefix: "/db", allowed: ["admin"] }, // просмотр таблиц БД (admin)
  { prefix: "/sensor-entry", allowed: ["admin", "worker"] }, // ввод данных датчиков (план B)
  { prefix: "/reports", allowed: ["admin", "agronomist", "director"] }, // отчёты: директор только просмотр
  { prefix: "/cultures", allowed: ["admin", "agronomist", "director"] }, // культуры: директор только просмотр
  { prefix: "/ai", allowed: ["admin", "agronomist", "director"] }, // директору можно рекомендации/аналитику
];

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

