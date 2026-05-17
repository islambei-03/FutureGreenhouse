"use client";

import { useCallback, useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import { useI18n } from "@/components/i18n/I18nContext";

type CurrentRow = {
  id: number;
  temperature: number | null;
  humidity: number | null;
  recorded_at: string | null;
};

const GH_ID = 1;
const REFRESH_MS = 3000;

export default function LiveSensorPanel() {
  const { t } = useI18n();
  const [temp, setTemp] = useState<number | null>(null);
  const [hum, setHum] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/sensors?greenhouse_id=${GH_ID}&range=day`, { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as null | {
        ok: boolean;
        current?: CurrentRow[];
      };
      if (!data?.ok || !data.current) return;
      const row = data.current.find((g) => g.id === GH_ID) ?? data.current[0];
      if (!row) return;
      setTemp(row.temperature);
      setHum(row.humidity);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  return (
    <Card className="p-5 border-cyan-500/25 bg-gradient-to-br from-cyan-500/10 via-[var(--card)] to-emerald-500/5">
      <p className="text-xs text-[var(--muted)] mb-4">{t("hardware.title")}</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-5 text-center">
          <p className="text-4xl sm:text-5xl font-bold tabular-nums text-sky-100">
            {temp != null ? `${temp.toFixed(1)}°` : "—"}
          </p>
          <p className="text-xs text-sky-200/70 mt-1">{t("hardware.temperature")}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
          <p className="text-4xl sm:text-5xl font-bold tabular-nums text-emerald-100">
            {hum != null ? `${Math.round(hum)}%` : "—"}
          </p>
          <p className="text-xs text-emerald-200/70 mt-1">{t("hardware.humidity")}</p>
        </div>
      </div>
    </Card>
  );
}
