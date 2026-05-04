"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/auth";
import { NAV_ITEMS } from "@/components/layout/nav";
import { useI18n } from "@/components/i18n/I18nContext";

function allowed(itemAllowed: UserRole[] | "any", role: UserRole) {
  if (itemAllowed === "any") return true;
  return itemAllowed.includes(role);
}

/** Общий список разделов: десктопный сайдбар и мобильное меню. */
export function AppNavLinks({
  role,
  notificationCount,
  onNavigate,
}: {
  role: UserRole;
  notificationCount: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav className="px-3">
      <div className="stagger space-y-1">
        {NAV_ITEMS.filter((i) => allowed(i.allowed, role)).map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const badge =
            item.badge === "notifications" && notificationCount > 0 ? notificationCount : null;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onNavigate?.()}
              className={[
                "flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 py-2.5 border transition active:scale-[0.99]",
                isActive
                  ? "bg-[color:var(--accent)]/10 border-[color:var(--accent)]/30 text-[var(--text)]"
                  : "border-transparent hover:bg-white/5 text-[var(--muted)] hover:text-[var(--text)]",
              ].join(" ")}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-5 shrink-0 text-center">{item.icon}</span>
                <span className="text-sm font-medium truncate">{t(item.labelKey)}</span>
              </div>
              {badge ? (
                <span className="min-w-6 h-6 px-2 shrink-0 rounded-full text-xs grid place-items-center bg-[color:var(--accent)] text-black">
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function Sidebar({
  role,
  notificationCount,
  fullName,
}: {
  role: UserRole;
  notificationCount: number;
  fullName: string;
}) {
  const { t } = useI18n();

  return (
    <aside className="hidden md:flex md:w-72 md:flex-col md:gap-4 md:border-r md:border-[var(--border)] md:bg-black/10">
      <div className="px-4 pt-5">
        <Link href="/" className="flex items-center gap-3 rounded-2xl px-3 py-3 hover:bg-white/5 transition">
          <div className="size-10 rounded-xl grid place-items-center border border-[var(--border)] bg-black/20">
            <span className="text-xl">🌿</span>
          </div>
          <div>
            <div className="font-semibold leading-tight">Future Greenhouse</div>
            <div className="text-xs text-[var(--muted)] leading-tight">{t("sidebar.system")}</div>
          </div>
        </Link>
      </div>

      <AppNavLinks role={role} notificationCount={notificationCount} />

      <div className="mt-auto px-4 pb-5">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow)]">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl grid place-items-center bg-black/20 border border-[var(--border)]">
              <span className="text-sm font-semibold">{fullName.slice(0, 1).toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{fullName}</div>
              <div className="text-xs text-[var(--muted)]">{t("sidebar.user.online")}</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

