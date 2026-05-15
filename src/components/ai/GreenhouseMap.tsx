"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/I18nContext";

export type MapCell = {
  id: number;
  name: string;
  status: string;
  healthPct: number;
  factors: string[];
  area: number;
  type: string;
  temperature: number | null;
  humidity: number | null;
};

function heatStyle(pct: number) {
  if (pct >= 70) {
    return {
      bg: "from-emerald-600/80 via-emerald-500/50 to-emerald-900/60",
      border: "border-emerald-400/50",
      glow: "shadow-[0_0_24px_rgba(16,185,129,0.35)]",
      pulse: false,
    };
  }
  if (pct >= 45) {
    return {
      bg: "from-amber-500/80 via-yellow-500/40 to-orange-900/50",
      border: "border-amber-400/50",
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.25)]",
      pulse: false,
    };
  }
  return {
    bg: "from-red-600/90 via-red-500/50 to-red-950/70",
    border: "border-red-400/60",
    glow: "shadow-[0_0_28px_rgba(239,68,68,0.45)]",
    pulse: true,
  };
}

export default function GreenhouseMap() {
  const { t } = useI18n();
  const [cells, setCells] = useState<MapCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MapCell | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/map", { cache: "no-store" });
      const data = (await res.json()) as { ok: boolean; cells?: MapCell[]; error?: string };
      if (data.ok && data.cells) {
        setCells(data.cells);
        if (!data.cells.length) setError(t("ai.map.noGreenhouses"));
      } else setError(data.error || `${t("ai.error.noReply")} (${res.status})`);
    } catch {
      setError(t("error.network"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  async function openSummary(cell: MapCell) {
    setSelected(cell);
    setSummary(null);
    setSummaryLoading(true);
    try {
      const res = await fetch("/api/ai/map/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ greenhouse_id: cell.id }),
      });
      const data = (await res.json()) as { ok: boolean; summary?: string; error?: string };
      if (data.ok && data.summary) setSummary(data.summary);
      else setSummary(data.error || t("ai.map.summaryFailed"));
    } catch {
      setSummary(t("error.network"));
    } finally {
      setSummaryLoading(false);
    }
  }

  const maxArea = Math.max(...cells.map((c) => c.area), 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-semibold">{t("ai.map.title")}</div>
          <p className="text-sm text-[var(--muted)] mt-1">{t("ai.map.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-xl px-4 py-2 text-sm border border-[var(--border)] bg-black/20 hover:bg-white/5"
        >
          {loading ? t("common.loading") : t("ai.map.refresh")}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      <div
        className="relative rounded-2xl border border-cyan-500/20 overflow-hidden min-h-[320px] p-4 sm:p-6"
        style={{
          background:
            "linear-gradient(180deg, #0a1628 0%, #061018 100%), repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(34,211,238,0.06) 24px), repeating-linear-gradient(90deg, transparent, transparent 23px, rgba(34,211,238,0.06) 24px)",
        }}
      >
        <div className="absolute top-3 left-4 text-[10px] uppercase tracking-widest text-cyan-400/70 font-mono">
          SCADA · Future Greenhouse
        </div>
        <div className="absolute top-3 right-4 flex flex-wrap gap-3 text-[10px] text-[var(--muted)]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> {t("ai.map.legend.ok")}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> {t("ai.map.legend.warn")}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> {t("ai.map.legend.alert")}
          </span>
        </div>

        {loading && !cells.length ? (
          <p className="text-sm text-cyan-200/60 mt-12 text-center">{t("common.loading")}</p>
        ) : (
          <div className="mt-10 flex flex-wrap gap-3 items-end justify-center min-h-[240px]">
            {cells.map((cell) => {
              const h = heatStyle(cell.healthPct);
              const flexGrow = 0.6 + (cell.area / maxArea) * 1.4;
              return (
                <button
                  key={cell.id}
                  type="button"
                  onClick={() => openSummary(cell)}
                  style={{ flex: `${flexGrow} 1 120px`, minHeight: `${100 + (cell.area / maxArea) * 80}px` }}
                  className={[
                    "relative max-w-[280px] min-w-[100px] rounded-lg border-2 p-3 text-left transition transform hover:scale-[1.02] hover:z-10",
                    "bg-gradient-to-br",
                    h.bg,
                    h.border,
                    h.glow,
                    h.pulse ? "animate-pulse" : "",
                  ].join(" ")}
                >
                  <div className="font-mono text-[10px] text-white/50">GH-{String(cell.id).padStart(2, "0")}</div>
                  <div className="font-semibold text-white text-sm mt-1 truncate">{cell.name}</div>
                  <div className="mt-2 font-mono text-lg text-white">{cell.healthPct}%</div>
                  <div className="text-[10px] text-white/70 mt-1">
                    {cell.temperature != null ? `${cell.temperature.toFixed(1)}°C` : "—"} ·{" "}
                    {cell.humidity != null ? `${cell.humidity.toFixed(0)}%` : "—"}
                  </div>
                  <div className="text-[10px] text-white/50 mt-1 truncate">{cell.status}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelected(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-[#0c1a2e] shadow-2xl p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-cyan-400/80 font-mono">AI SCADA</div>
                <div className="text-lg font-semibold text-white mt-1">{selected.name}</div>
                <div className="text-sm text-white/60">
                  {t("ai.health.score")}: {selected.healthPct}%
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg px-2 py-1 text-white/60 hover:text-white border border-white/10"
                aria-label={t("common.cancel")}
              >
                ✕
              </button>
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/90 whitespace-pre-wrap min-h-[100px]">
              {summaryLoading ? <span className="text-cyan-300/70">{t("ai.map.summaryLoading")}</span> : summary}
            </div>
            {selected.factors.length ? (
              <ul className="mt-3 text-xs text-white/50 space-y-1">
                {selected.factors.slice(0, 4).map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
