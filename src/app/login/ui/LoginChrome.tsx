"use client";

import { useMemo, useState } from "react";
import LoginForm from "@/app/login/ui/LoginForm";
import { I18nProvider, useI18n } from "@/components/i18n/I18nContext";
import { LOCALE_STORAGE_KEY, type Locale } from "@/lib/i18n";

export default function LoginChrome() {
  const [initialLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") return "ru";
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    return raw === "kk" || raw === "ru" ? raw : "ru";
  });

  return (
    <I18nProvider initialLocale={initialLocale}>
      <LoginChromeInner />
    </I18nProvider>
  );
}

function LoginChromeInner() {
  const { t } = useI18n();

  const testAccounts = useMemo(
    () => [
      { login: "admin", pass: "admin123" },
      { login: "asel", pass: "asel123" },
      { login: "nurlan", pass: "nurlan123" },
      { login: "director", pass: "dir123" },
    ],
    [],
  );

  return (
    <main className="min-h-screen grid place-items-center px-4 bg-glow overflow-hidden">
      <div className="w-full max-w-md animate-slideUp">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-6 md:p-7">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-xl grid place-items-center bg-black/20 border border-[var(--border)]">
              <span className="text-xl">🌿</span>
            </div>
            <div>
              <div className="text-lg font-semibold leading-tight">{t("login.title")}</div>
              <div className="text-sm text-[var(--muted)] leading-tight">{t("login.subtitle")}</div>
            </div>
          </div>

          <div className="mt-6">
            <LoginForm />
          </div>

          <div className="mt-6 text-xs text-[var(--muted)]">{t("login.adminOnly")}</div>
        </div>

        <div className="mt-4 text-center text-xs text-[var(--muted)]">
          {testAccounts.map((a, idx) => (
            <span key={a.login}>
              {idx === 0 ? " " : " · "}
              <span className="text-[var(--text)]">
                {a.login} / {a.pass}
              </span>
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}

