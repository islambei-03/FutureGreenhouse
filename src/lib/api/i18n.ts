import { cookies } from "next/headers";
import { LOCALE_COOKIE_NAME, type I18nKey, type Locale, t } from "@/lib/i18n";

export async function getRequestLocale(): Promise<Locale> {
  const jar = await cookies();
  const raw = jar.get(LOCALE_COOKIE_NAME)?.value;
  return raw === "kk" || raw === "ru" ? raw : "ru";
}

export async function apiT(key: I18nKey): Promise<string> {
  const locale = await getRequestLocale();
  return t(locale, key);
}

