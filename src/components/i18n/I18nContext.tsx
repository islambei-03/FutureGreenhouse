"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { LOCALE_COOKIE_NAME, LOCALE_STORAGE_KEY, type I18nKey, type Locale, t } from "@/lib/i18n";

type I18nValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: I18nKey) => string;
};

const Ctx = createContext<I18nValue | null>(null);

export function I18nProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem(LOCALE_STORAGE_KEY, l);
    document.documentElement.lang = l === "kk" ? "kk" : "ru";
    document.cookie = `${encodeURIComponent(LOCALE_COOKIE_NAME)}=${encodeURIComponent(l)}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale,
      t: (key) => t(locale, key),
    }),
    [locale],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n должен использоваться внутри I18nProvider");
  return v;
}

