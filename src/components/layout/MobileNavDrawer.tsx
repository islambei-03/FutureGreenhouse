"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { UserRole } from "@/lib/auth";
import { AppNavLinks } from "@/components/layout/Sidebar";
import { useI18n } from "@/components/i18n/I18nContext";

export default function MobileNavDrawer({
  open,
  onClose,
  role,
  notificationCount,
  fullName,
}: {
  open: boolean;
  onClose: () => void;
  role: UserRole;
  notificationCount: number;
  fullName: string;
}) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Меню">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label="Закрыть меню"
        onClick={onClose}
      />
      <aside className="absolute left-0 top-0 bottom-0 flex w-[min(100%,18.5rem)] flex-col border-r border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-3 py-3">
          <Link
            href="/"
            className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/5"
            onClick={onClose}
          >
            <div className="size-9 shrink-0 rounded-lg grid place-items-center border border-[var(--border)] bg-black/20 text-lg">
              🌿
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight truncate">Future Greenhouse</div>
              <div className="text-[11px] text-[var(--muted)] leading-tight">{t("sidebar.system")}</div>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="size-11 shrink-0 rounded-xl border border-[var(--border)] bg-black/20 text-lg leading-none hover:bg-white/5"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain py-3">
          <AppNavLinks role={role} notificationCount={notificationCount} onNavigate={onClose} />
        </div>

        <div className="border-t border-[var(--border)] p-3">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-black/15 px-3 py-2">
            <div className="size-9 shrink-0 rounded-lg grid place-items-center border border-[var(--border)] bg-black/20 text-xs font-semibold">
              {fullName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{fullName}</div>
              <div className="text-[11px] text-[var(--muted)]">{t("sidebar.user.online")}</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
