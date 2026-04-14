"use client";

import { useEffect } from "react";
import { LOCALE_STORAGE_KEY, type Locale } from "@/lib/i18n";

function applyLocale(locale: Locale) {
  document.documentElement.lang = locale === "kk" ? "kk" : "ru";
}

export default function LocaleInit() {
  useEffect(() => {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    const locale = (raw === "kk" || raw === "ru" ? raw : "ru") satisfies Locale;
    applyLocale(locale);
  }, []);
  return null;
}

