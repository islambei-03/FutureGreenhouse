"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { UserRole } from "@/lib/auth";
import { RoleLabel } from "@/lib/rbac";
import { THEME_STORAGE_KEY, ThemeLabel, type ThemeName } from "@/lib/theme";
import { LocaleLabel, type Locale } from "@/lib/i18n";
import { useI18n } from "@/components/i18n/I18nContext";

type MeResponse =
  | { ok: true; user: { id: string; fullName: string; login: string; role: UserRole; roleLabel: string } }
  | { ok: false };

function applyTheme(theme: ThemeName) {
  const html = document.documentElement;
  if (theme === "dark") html.removeAttribute("data-theme");
  else html.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function nextTheme(theme: ThemeName): ThemeName {
  if (theme === "dark") return "light";
  if (theme === "light") return "blue";
  return "dark";
}

export default function Topbar({
  notificationCount,
  onMe,
  onNotifications,
  onOpenMobileNav,
}: {
  notificationCount: number;
  onMe: (me: MeResponse) => void;
  onNotifications: (count: number) => void;
  onOpenMobileNav?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [theme, setTheme] = useState<ThemeName>(() => {
    if (typeof window === "undefined") return "dark";
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return (raw === "light" || raw === "blue" || raw === "dark" ? raw : "dark") satisfies ThemeName;
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const { locale, setLocale, t } = useI18n();

  const themeIcon = useMemo(() => {
    if (theme === "dark") return "🌙";
    if (theme === "light") return "☀️";
    return "🔵";
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await res.json().catch(() => ({ ok: false }))) as MeResponse;
      if (cancelled) return;
      setMe(data);
      onMe(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, onMe]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as null | { ok?: boolean; unreadCount?: number };
      if (cancelled) return;
      if (data && data.ok && typeof data.unreadCount === "number") onNotifications(data.unreadCount);
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, onNotifications]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/login");
    router.refresh();
  }

  function toggleTheme() {
    const t = nextTheme(theme);
    setTheme(t);
    applyTheme(t);
  }

  function toggleLocale() {
    const next: Locale = locale === "ru" ? "kk" : "ru";
    setLocale(next);
  }

  const roleLabel =
    me && me.ok ? (me.user.roleLabel || RoleLabel[me.user.role]) : "—";
  const fullName = me && me.ok ? me.user.fullName : "Пользователь";

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg)]/75 backdrop-blur">
      <div className="h-14 sm:h-16 px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onOpenMobileNav ? (
            <button
              type="button"
              onClick={onOpenMobileNav}
              className="md:hidden size-11 shrink-0 rounded-xl border border-[var(--border)] bg-black/20 hover:bg-white/5 transition grid place-items-center text-lg leading-none"
              aria-label="Открыть меню"
            >
              ☰
            </button>
          ) : (
            <div className="md:hidden size-10 shrink-0 rounded-xl grid place-items-center border border-[var(--border)] bg-black/20">
              🌿
            </div>
          )}
          <div className="hidden sm:block">
            <div className="text-sm font-semibold leading-tight">{fullName}</div>
            <div className="text-xs text-[var(--muted)] leading-tight">{roleLabel}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <input
              placeholder={t("topbar.search")}
              className="w-72 rounded-xl bg-black/20 border border-[var(--border)] px-4 py-2.5 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
            />
          </div>

          <button
            onClick={toggleLocale}
            className="h-10 px-3 rounded-xl border border-[var(--border)] bg-black/20 hover:bg-white/5 transition text-sm font-semibold"
            title={LocaleLabel[locale]}
          >
            {LocaleLabel[locale]}
          </button>

          <button
            onClick={toggleTheme}
            className="h-10 px-3 rounded-xl border border-[var(--border)] bg-black/20 hover:bg-white/5 transition text-sm"
            title={`Тема: ${ThemeLabel[theme]}`}
          >
            {themeIcon}
          </button>

          <Link
            href="/notifications"
            className="relative size-10 rounded-xl grid place-items-center border border-[var(--border)] bg-black/20 hover:bg-white/5 transition"
            title={t("topbar.notifications")}
          >
            🔔
            {notificationCount > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full text-[10px] grid place-items-center bg-[color:var(--accent)] text-black">
                {notificationCount}
              </span>
            ) : null}
          </Link>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="h-10 px-3 rounded-xl border border-[var(--border)] bg-black/20 hover:bg-white/5 transition flex items-center gap-2"
              title={t("topbar.menu")}
            >
              <span className="size-7 rounded-lg grid place-items-center border border-[var(--border)] bg-black/20 text-xs font-semibold">
                {fullName.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden sm:inline text-sm">⋯</span>
            </button>

            {menuOpen ? (
              <div className="absolute right-0 mt-2 w-[min(14rem,calc(100vw-1.5rem))] max-h-[min(70vh,24rem)] overflow-y-auto overscroll-contain rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-2 animate-fadeIn">
                <Link
                  href="/profile"
                  className="block rounded-xl px-3 py-2 text-sm hover:bg-white/5 transition"
                  onClick={() => setMenuOpen(false)}
                >
                  {t("topbar.profile")}
                </Link>
                <button
                  onClick={logout}
                  className="w-full text-left rounded-xl px-3 py-2 text-sm hover:bg-white/5 transition text-red-200"
                >
                  {t("topbar.logout")}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

