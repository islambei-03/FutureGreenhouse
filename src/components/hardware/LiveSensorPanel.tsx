"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import RippleButton from "@/components/ui/RippleButton";
import { useI18n } from "@/components/i18n/I18nContext";

type Reading = {
  temperature: number;
  humidity: number;
  sourceUrl: string;
  fetchedAt: string;
};

type LiveRes =
  | { ok: true; reading: Reading; sourceUrl: string; savedId?: number | null }
  | { ok: false; error?: string; sourceUrl?: string };

export default function LiveSensorPanel() {
  const { t } = useI18n();
  const [reading, setReading] = useState<Reading | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState<string | null>(null);
  const [greenhouseId, setGreenhouseId] = useState(1);
  const tickRef = useRef(0);

  const load = useCallback(async (opts?: { save?: boolean }) => {
    const id = ++tickRef.current;
    if (!opts?.save) setLoading(true);
    setError(null);
    if (!opts?.save) setSaveOk(null);
    try {
      const sp = new URLSearchParams();
      if (opts?.save) {
        sp.set("save", "1");
        sp.set("greenhouse_id", String(greenhouseId));
      }
      const res = await fetch(`/api/hardware/live-sensor?${sp.toString()}`, { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as LiveRes | null;
      if (id !== tickRef.current) return;
      if (data?.ok && data.reading) {
        setReading(data.reading);
        setSourceUrl(data.sourceUrl || data.reading.sourceUrl);
        setOnline(true);
        if (opts?.save && data.savedId) {
          setSaveOk(t("hardware.savedOk"));
        }
      } else {
        setOnline(false);
        const errText = data && !data.ok ? data.error : undefined;
        setError(errText || t("hardware.error"));
      }
    } catch {
      if (id !== tickRef.current) return;
      setOnline(false);
      setError(t("error.network"));
    } finally {
      if (id === tickRef.current) setLoading(false);
      setSaving(false);
    }
  }, [greenhouseId, t]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 2500);
    return () => clearInterval(id);
  }, [load]);

  const temp = reading?.temperature;
  const hum = reading?.humidity;
  const updated = reading?.fetchedAt
    ? new Date(reading.fetchedAt).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

  return (
    <section className="space-y-4">
      <Card className="relative overflow-hidden p-6 sm:p-8 border-cyan-500/25 bg-gradient-to-br from-cyan-500/10 via-[var(--card)] to-emerald-500/5">
        <div
          className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-cyan-400/10 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={[
                  "inline-block size-2.5 rounded-full",
                  online ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" : "bg-red-400",
                ].join(" ")}
              />
              <span className="text-xs uppercase tracking-wider text-[var(--muted)]">
                {online ? t("hardware.online") : t("hardware.offline")}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold mt-2">{t("hardware.title")}</h2>
            <p className="text-sm text-[var(--muted)] mt-2 max-w-xl leading-relaxed">{t("hardware.subtitle")}</p>
            <p className="text-xs text-[var(--muted)] mt-3 font-mono break-all">
              {t("hardware.source")}: {sourceUrl || "—"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <RippleButton variant="outline" className="px-4 py-2.5" onClick={() => void load()} disabled={loading}>
              {loading ? t("common.loading") : t("ai.refresh")}
            </RippleButton>
            <RippleButton
              className="px-4 py-2.5"
              disabled={saving || !online}
              onClick={() => {
                setSaving(true);
                void load({ save: true });
              }}
            >
              {saving ? t("common.saving") : t("hardware.saveToDb")}
            </RippleButton>
          </div>
        </div>

        <div className="relative mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-6 text-center">
            <p className="text-sm text-sky-200/80">{t("hardware.temperature")}</p>
            <p className="mt-2 text-5xl sm:text-6xl font-bold tabular-nums tracking-tight text-sky-100">
              {temp != null ? temp.toFixed(1) : "—"}
              <span className="text-2xl font-medium text-sky-300/80">°C</span>
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
            <p className="text-sm text-emerald-200/80">{t("hardware.humidity")}</p>
            <p className="mt-2 text-5xl sm:text-6xl font-bold tabular-nums tracking-tight text-emerald-100">
              {hum != null ? hum.toFixed(0) : "—"}
              <span className="text-2xl font-medium text-emerald-300/80">%</span>
            </p>
          </div>
        </div>

        <p className="relative mt-4 text-center text-xs text-[var(--muted)]">
          {t("hardware.updated")}: {updated}
          {loading ? ` · ${t("common.loading")}` : ""}
        </p>

        {error ? (
          <p className="relative mt-4 text-sm text-red-200 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            {error}
          </p>
        ) : null}
        {saveOk ? (
          <p className="relative mt-3 text-sm text-emerald-200 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            {saveOk}
          </p>
        ) : null}
      </Card>

      <Card className="p-5">
        <p className="text-sm text-[var(--muted)] leading-relaxed">{t("hardware.hint")}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-sm text-[var(--muted)]">{t("hardware.greenhouse")}</label>
          <select
            value={greenhouseId}
            onChange={(e) => setGreenhouseId(Number(e.target.value))}
            className="rounded-xl bg-black/20 border border-[var(--border)] px-4 py-2.5"
          >
            {[1, 2, 3, 4, 5, 6].map((id) => (
              <option key={id} value={id}>
                {t("hardware.greenhouseN")} {id}
              </option>
            ))}
          </select>
        </div>
      </Card>
    </section>
  );
}
