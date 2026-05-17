"use client";

import Card from "@/components/ui/Card";
import LiveSensorPanel from "@/components/hardware/LiveSensorPanel";
import { useI18n } from "@/components/i18n/I18nContext";

export default function DbPage() {
  const { t } = useI18n();

  return (
    <main className="min-w-0 max-w-full space-y-4">
      <Card className="p-6">
        <div className="text-xl font-semibold">{t("db.title")}</div>
        <div className="text-sm text-[var(--muted)] mt-1 leading-relaxed">{t("db.subtitle")}</div>
      </Card>
      <LiveSensorPanel />
    </main>
  );
}
