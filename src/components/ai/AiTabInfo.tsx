"use client";

import { useI18n } from "@/components/i18n/I18nContext";
import type { I18nKey } from "@/lib/i18n";

type Props = {
  titleKey: I18nKey;
  bodyKey: I18nKey;
  dataKey?: I18nKey;
};

export default function AiTabInfo({ titleKey, bodyKey, dataKey }: Props) {
  const { t } = useI18n();
  return (
    <aside className="mt-6 rounded-2xl border border-[var(--border)] bg-black/15 p-4 sm:p-5 text-sm">
      <p className="font-medium text-[color:var(--accent)]">{t(titleKey)}</p>
      <p className="mt-2 text-[var(--muted)] leading-relaxed whitespace-pre-wrap">{t(bodyKey)}</p>
      {dataKey ? (
        <p className="mt-3 text-xs text-[var(--muted)] border-t border-[var(--border)] pt-3">
          <span className="text-[var(--text)]">{t("ai.info.dataLabel")}: </span>
          {t(dataKey)}
        </p>
      ) : null}
    </aside>
  );
}
