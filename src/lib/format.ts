/** Дата для таблиц и карточек (без времени). */
export function formatDisplayDate(value: string | null | undefined, locale = "ru-RU"): string {
  if (!value) return "—";
  const raw = value.trim();
  const d = new Date(raw.includes("T") ? raw : `${raw}T12:00:00`);
  if (Number.isNaN(d.getTime())) return raw.slice(0, 10);
  return d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" });
}
