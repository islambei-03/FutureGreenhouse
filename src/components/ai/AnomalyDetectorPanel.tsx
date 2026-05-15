"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useI18n } from "@/components/i18n/I18nContext";
import type { AnomalyPoint } from "@/lib/ai/anomalies";
import AiTabInfo from "@/components/ai/AiTabInfo";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

type Gh = { id: number; name: string };

export default function AnomalyDetectorPanel() {
  const { t } = useI18n();
  const [greenhouses, setGreenhouses] = useState<Gh[]>([]);
  const [ghId, setGhId] = useState<number | null>(null);
  const [range, setRange] = useState<"7d" | "14d">("7d");
  const [points, setPoints] = useState<AnomalyPoint[]>([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/greenhouses", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { ok?: boolean; greenhouses?: Gh[] }) => {
        if (d.ok && d.greenhouses?.length) {
          setGreenhouses(d.greenhouses);
          setGhId(d.greenhouses[0]!.id);
        }
      })
      .catch(() => null);
  }, []);

  async function run() {
    if (!ghId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai/anomalies?greenhouse_id=${ghId}&range=${range}`, { cache: "no-store" });
      const data = (await res.json()) as { ok: boolean; points?: AnomalyPoint[]; summary?: string; error?: string };
      if (data.ok && data.points) {
        setPoints(data.points);
        setSummary(data.summary ?? "");
      } else setError(data.error || t("ai.anomaly.failed"));
    } catch {
      setError(t("error.network"));
    } finally {
      setLoading(false);
    }
  }

  const chartData = useMemo(() => {
    const labels = points.map((p) => p.recorded_at.slice(5, 16).replace("T", " "));
    return {
      labels,
      datasets: [
        {
          label: t("ai.anomaly.chartTemp"),
          data: points.map((p) => p.temperature),
          borderColor: "rgb(56, 189, 248)",
          backgroundColor: points.map((p) => (p.anomalyTemp ? "rgb(239, 68, 68)" : "rgb(56, 189, 248)")),
          pointRadius: points.map((p) => (p.anomalyTemp ? 7 : 2)),
          pointHoverRadius: 8,
          tension: 0.25,
        },
        {
          label: t("ai.anomaly.chartHum"),
          data: points.map((p) => p.humidity),
          borderColor: "rgb(52, 211, 153)",
          backgroundColor: points.map((p) => (p.anomalyHumidity ? "rgb(239, 68, 68)" : "rgb(52, 211, 153)")),
          pointRadius: points.map((p) => (p.anomalyHumidity ? 7 : 2)),
          pointHoverRadius: 8,
          tension: 0.25,
          yAxisID: "y1",
        },
      ],
    };
  }, [points, t]);

  const chartOpts = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index" as const, intersect: false },
      plugins: {
        legend: { labels: { color: "#94a3b8" } },
        tooltip: {
          callbacks: {
            afterBody: (items: { dataIndex: number }[]) => {
              const i = items[0]?.dataIndex;
              if (i == null || !points[i]) return [];
              const p = points[i]!;
              const flags: string[] = [];
              if (p.anomalyTemp) flags.push(t("ai.anomaly.flagTemp"));
              if (p.anomalyHumidity) flags.push(t("ai.anomaly.flagHum"));
              return flags.length ? flags : [t("ai.anomaly.flagOk")];
            },
          },
        },
      },
      scales: {
        x: { ticks: { color: "#64748b", maxRotation: 45 }, grid: { color: "rgba(255,255,255,0.06)" } },
        y: { ticks: { color: "#64748b" }, grid: { color: "rgba(255,255,255,0.06)" } },
        y1: {
          position: "right" as const,
          ticks: { color: "#64748b" },
          grid: { drawOnChartArea: false },
        },
      },
    }),
    [points, t],
  );

  return (
    <section className="space-y-4">
      <header>
        <h3 className="font-semibold">{t("ai.anomaly.title")}</h3>
        <p className="text-sm text-[var(--muted)] mt-1">{t("ai.anomaly.subtitle")}</p>
      </header>

      <div className="flex flex-wrap gap-3">
        <select
          value={ghId ?? ""}
          onChange={(e) => setGhId(Number(e.target.value))}
          className="flex-1 min-w-[180px] rounded-xl bg-black/20 border border-[var(--border)] px-4 py-2.5"
        >
          {greenhouses.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as "7d" | "14d")}
          className="rounded-xl bg-black/20 border border-[var(--border)] px-4 py-2.5"
        >
          <option value="7d">7 {t("ai.anomaly.days")}</option>
          <option value="14d">14 {t("ai.anomaly.days")}</option>
        </select>
        <button
          type="button"
          onClick={run}
          disabled={loading || !ghId}
          className="rounded-xl px-5 py-2.5 font-medium bg-[color:var(--accent)] text-black disabled:opacity-50"
        >
          {loading ? t("common.loading") : t("ai.anomaly.run")}
        </button>
      </div>

      {error ? <p className="text-sm text-red-200 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">{error}</p> : null}
      {summary ? <p className="text-sm text-[var(--muted)]">{summary}</p> : null}

      {points.length ? (
        <div className="h-72 rounded-2xl border border-[var(--border)] bg-black/20 p-3">
          <Line data={chartData} options={chartOpts} />
        </div>
      ) : null}

      <p className="text-xs text-red-300/80">{t("ai.anomaly.legend")}</p>

      <AiTabInfo titleKey="ai.info.anomaly.title" bodyKey="ai.info.anomaly.body" dataKey="ai.info.anomaly.data" />
    </section>
  );
}
