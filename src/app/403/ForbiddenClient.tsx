"use client";

import { useState } from "react";
import Link from "next/link";
import { I18nProvider, useI18n } from "@/components/i18n/I18nContext";
import { LOCALE_STORAGE_KEY, type Locale } from "@/lib/i18n";

export default function ForbiddenClient() {
  const [initialLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") return "ru";
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    return raw === "kk" || raw === "ru" ? raw : "ru";
  });

  return (
    <I18nProvider initialLocale={initialLocale}>
      <ForbiddenInner />
    </I18nProvider>
  );
}

function ForbiddenInner() {
  const { t } = useI18n();
  return (
    <main className="min-h-screen grid place-items-center px-4">
      <div className="max-w-lg w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold">{t("forbidden.title")}</div>
            <div className="text-sm text-[var(--muted)] mt-1">{t("forbidden.text")}</div>
          </div>
          <div className="size-12 rounded-xl grid place-items-center border border-[var(--border)] bg-black/20">
            <span className="text-xl">🔒</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl px-4 py-3 font-medium bg-[color:var(--accent)] text-black hover:brightness-110 active:brightness-95 transition"
          >
            {t("forbidden.home")}
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl px-4 py-3 font-medium border border-[var(--border)] hover:bg-white/5 transition"
          >
            {t("forbidden.switchUser")}
          </Link>
        </div>
      </div>
    </main>
  );
}

