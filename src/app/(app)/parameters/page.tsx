"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n/I18nContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import type { ChartOptions } from "chart.js";
import { Line } from "react-chartjs-2";
import TableScroll from "@/components/ui/TableScroll";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type CurrentRow = {
  id: number;
  name: string;
  temp_min: number;
  temp_max: number;
  humidity_min: number;
  humidity_max: number;
  status: "активна" | "обслуживание" | "отключена";
  temperature: number | null;
  humidity: number | null;
  co2: number | null;
  recorded_at: string | null;
};

type HistoryRow = {
  id: number;
  greenhouse_id: number;
  temperature: number;
  humidity: number;
  co2: number;
  recorded_at: string;
};

function badgeClass(ok: boolean) {
  return ok
    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
    : "border-red-500/30 bg-red-500/15 text-red-200";
}

function Progress({ value, min, max }: { value: number | null; min: number; max: number }) {
  const pct = useMemo(() => {
    if (value === null) return 0;
    if (max <= min) return 0;
    const clamped = Math.max(min, Math.min(max, value));
    return Math.round(((clamped - min) / (max - min)) * 100);
  }, [value, min, max]);

  return (
    <div className="mt-2 h-2 rounded-full bg-black/30 border border-[var(--border)] overflow-hidden">
      <div className="h-full bg-[color:var(--accent)]" style={{ width: `${pct}%`, transition: "width 300ms ease" }} />
    </div>
  );
}

export default function ParametersPage() {
  const { t: tr, locale } = useI18n();
  const [current, setCurrent] = useState<CurrentRow[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [range, setRange] = useState<"day" | "7d">("day");
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load(nextSelected?: number | null, nextRange?: "day" | "7d") {
    const gh = nextSelected ?? selected;
    const r = nextRange ?? range;
    const sp = new URLSearchParams();
    if (gh) sp.set("greenhouse_id", String(gh));
    sp.set("range", r);

    setLoading(true);
    try {
      const res = await fetch(`/api/sensors?${sp.toString()}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => null)) as null | {
        ok: boolean;
        current: CurrentRow[];
        selected: number | null;
        range: "day" | "7d";
        history: HistoryRow[];
      };
      if (data?.ok) {
        setCurrent(data.current);
        setSelected(data.selected);
        setRange(data.range);
        setHistory(data.history);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(null, "day");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => load(), 10_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, range]);

  const alerts = useMemo(() => {
    const a: Array<{ level: "danger" | "warn"; text: string }> = [];
    function formatTempAlert(name: string, temperature: number) {
      if (locale === "kk") return `${name}: ${tr("alerts.tempOutOfNorm")} (${temperature}°C)`;
      return `${name}: ${tr("alerts.tempOutOfNorm")} (${temperature}°C)`;
    }
    function formatHumAlert(name: string, humidity: number) {
      if (locale === "kk") return `${name}: ${tr("alerts.humidityOutOfNorm")} (${humidity}%)`;
      return `${name}: ${tr("alerts.humidityOutOfNorm")} (${humidity}%)`;
    }
    for (const g of current) {
      if (g.temperature != null && (g.temperature < g.temp_min || g.temperature > g.temp_max)) {
        a.push({ level: "danger", text: formatTempAlert(g.name, g.temperature) });
      } else if (g.humidity != null && (g.humidity < g.humidity_min || g.humidity > g.humidity_max)) {
        a.push({ level: "warn", text: formatHumAlert(g.name, g.humidity) });
      }
    }
    return a.slice(0, 3);
  }, [current, locale, tr]);

  const selectedMeta = useMemo(() => current.find((c) => c.id === selected) ?? null, [current, selected]);

  const chartLabels = useMemo(() => {
    return history.map((h) => h.recorded_at.slice(5, 16).replace(" ", "\n"));
  }, [history]);

  const tempData = useMemo(() => {
    return {
      labels: chartLabels,
      datasets: [
        {
          label: locale === "kk" ? "Температура, °C" : "Температура, °C",
          data: history.map((h) => h.temperature),
          borderColor: "rgba(34,197,94,0.95)",
          backgroundColor: "rgba(34,197,94,0.15)",
          tension: 0.32,
          pointRadius: 2,
        },
      ],
    };
  }, [chartLabels, history, locale]);

  const humData = useMemo(() => {
    return {
      labels: chartLabels,
      datasets: [
        {
          label: locale === "kk" ? "Ылғалдылық, %" : "Влажность, %",
          data: history.map((h) => h.humidity),
          borderColor: "rgba(59,130,246,0.95)",
          backgroundColor: "rgba(59,130,246,0.15)",
          tension: 0.32,
          pointRadius: 2,
        },
      ],
    };
  }, [chartLabels, history, locale]);

  const hasChartPoints = history.length > 0;

  const tempChartOptions = useMemo<ChartOptions<"line">>(() => {
    const yNorm =
      !hasChartPoints && selectedMeta
        ? { min: selectedMeta.temp_min - 3, max: selectedMeta.temp_max + 3 }
        : {};
    return {
      responsive: true,
      plugins: {
        legend: { display: true, labels: { color: "rgba(232,245,238,0.8)" } },
        title: { display: false },
        tooltip: { enabled: true },
      },
      scales: {
        x: { ticks: { color: "rgba(232,245,238,0.6)" }, grid: { color: "rgba(232,245,238,0.08)" } },
        y: {
          ticks: { color: "rgba(232,245,238,0.6)" },
          grid: { color: "rgba(232,245,238,0.08)" },
          ...yNorm,
        },
      },
    };
  }, [hasChartPoints, selectedMeta]);

  const humChartOptions = useMemo<ChartOptions<"line">>(() => {
    const yNorm =
      !hasChartPoints && selectedMeta
        ? {
            min: Math.max(0, selectedMeta.humidity_min - 10),
            max: Math.min(100, selectedMeta.humidity_max + 10),
          }
        : {};
    return {
      responsive: true,
      plugins: {
        legend: { display: true, labels: { color: "rgba(232,245,238,0.8)" } },
        title: { display: false },
        tooltip: { enabled: true },
      },
      scales: {
        x: { ticks: { color: "rgba(232,245,238,0.6)" }, grid: { color: "rgba(232,245,238,0.08)" } },
        y: {
          ticks: { color: "rgba(232,245,238,0.6)" },
          grid: { color: "rgba(232,245,238,0.08)" },
          ...yNorm,
        },
      },
    };
  }, [hasChartPoints, selectedMeta]);

  return (
    <main className="min-w-0 max-w-full space-y-4">
      {alerts.length ? (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div
              key={i}
              className={[
                "rounded-2xl border px-4 py-3 text-sm",
                a.level === "danger"
                  ? "border-red-500/30 bg-red-500/10 text-red-200"
                  : "border-yellow-400/30 bg-yellow-400/10 text-yellow-100",
              ].join(" ")}
            >
              <span
                className={
                  a.level === "danger"
                    ? "mr-2 inline-block size-2 rounded-full bg-red-400 animate-pulse"
                    : "mr-2 inline-block size-2 rounded-full bg-yellow-300"
                }
              />
              {a.text}
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="text-xl font-semibold">{tr("parameters.title")}</div>
            <div className="text-sm text-[var(--muted)] mt-1">{tr("parameters.subtitle")}</div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:shrink-0">
            <select
              value={selected ?? ""}
              onChange={(e) => load(Number(e.target.value), range)}
              className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-2.5 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition sm:min-w-[12rem]"
            >
              {current.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <select
              value={range}
              onChange={(e) => load(selected, e.target.value as "day" | "7d")}
              className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-2.5 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition sm:w-auto"
            >
              <option value="day">{tr("parameters.range.day")}</option>
              <option value="7d">{tr("parameters.range.week")}</option>
            </select>
          </div>
        </div>

        {selectedMeta ? (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-[var(--border)] bg-black/10 p-4">
              <div className="text-xs text-[var(--muted)]">{tr("parameters.temperature")}</div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span
                  className={[
                    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                    badgeClass(
                      selectedMeta.temperature != null &&
                        selectedMeta.temperature >= selectedMeta.temp_min &&
                        selectedMeta.temperature <= selectedMeta.temp_max,
                    ),
                  ].join(" ")}
                >
                  {selectedMeta.temperature ?? "—"}{selectedMeta.temperature != null ? "°C" : ""}
                </span>
                <span className="text-xs text-[var(--muted)]">
                  Норма: {selectedMeta.temp_min}–{selectedMeta.temp_max}
                </span>
              </div>
              <Progress value={selectedMeta.temperature} min={selectedMeta.temp_min} max={selectedMeta.temp_max} />
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-black/10 p-4">
              <div className="text-xs text-[var(--muted)]">{tr("parameters.humidity")}</div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span
                  className={[
                    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                    badgeClass(
                      selectedMeta.humidity != null &&
                        selectedMeta.humidity >= selectedMeta.humidity_min &&
                        selectedMeta.humidity <= selectedMeta.humidity_max,
                    ),
                  ].join(" ")}
                >
                  {selectedMeta.humidity ?? "—"}{selectedMeta.humidity != null ? "%" : ""}
                </span>
                <span className="text-xs text-[var(--muted)]">
                  Норма: {selectedMeta.humidity_min}–{selectedMeta.humidity_max}
                </span>
              </div>
              <Progress value={selectedMeta.humidity} min={selectedMeta.humidity_min} max={selectedMeta.humidity_max} />
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-black/10 p-4">
              <div className="text-xs text-[var(--muted)]">CO2</div>
              <div className="mt-2 text-2xl font-semibold">
                {selectedMeta.co2 ?? "—"}{selectedMeta.co2 != null ? " ppm" : ""}
              </div>
              <div className="mt-2 text-xs text-[var(--muted)]">Последняя запись: {selectedMeta.recorded_at ?? "—"}</div>
            </div>
          </div>
        ) : null}
      </div>

      {!hasChartPoints && selectedMeta ? (
        <div className="rounded-xl border border-[var(--border)] bg-black/15 px-4 py-3 text-sm text-[var(--muted)]">
          {tr("parameters.charts.noData")}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-5">
          <div className="font-semibold">{tr("parameters.charts.temperature")}</div>
          <div className="mt-3">
            <Line options={tempChartOptions} data={tempData} />
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-5">
          <div className="font-semibold">{tr("parameters.charts.humidity")}</div>
          <div className="mt-3">
            <Line options={humChartOptions} data={humData} />
          </div>
        </section>
      </div>

      <section className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]">
        <div className="p-5 border-b border-[var(--border)]">
          <div className="font-semibold">{tr("parameters.table.title")}</div>
          <div className="text-sm text-[var(--muted)] mt-1">{tr("parameters.table.subtitle")}</div>
        </div>
        <TableScroll>
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="text-left text-[var(--muted)]">
              <tr className="border-b border-[var(--border)]">
                <th className="p-4">{tr("parameters.table.greenhouse")}</th>
                <th className="p-4">{tr("parameters.table.temperature")}</th>
                <th className="p-4">{tr("parameters.table.humidity")}</th>
                <th className="p-4">{tr("parameters.table.co2")}</th>
                <th className="p-4">{tr("parameters.table.time")}</th>
              </tr>
            </thead>
            <tbody>
              {current.map((g) => {
                const tOk = g.temperature != null && g.temperature >= g.temp_min && g.temperature <= g.temp_max;
                const hOk = g.humidity != null && g.humidity >= g.humidity_min && g.humidity <= g.humidity_max;
                return (
                  <tr key={g.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-white/5 transition">
                    <td className="p-4">
                      <div className="font-medium">{g.name}</div>
                      <div className="text-xs text-[var(--muted)]">Статус: {g.status}</div>
                    </td>
                    <td className="p-4">
                      <span className={["inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", badgeClass(tOk)].join(" ")}>
                        {g.temperature ?? "—"}{g.temperature != null ? "°C" : ""}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={["inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", badgeClass(hOk)].join(" ")}>
                        {g.humidity ?? "—"}{g.humidity != null ? "%" : ""}
                      </span>
                    </td>
                    <td className="p-4 text-[var(--muted)]">{g.co2 ?? "—"}{g.co2 != null ? " ppm" : ""}</td>
                    <td className="p-4 text-[var(--muted)]">{g.recorded_at ?? "—"}</td>
                  </tr>
                );
              })}
              {!current.length ? (
                <tr>
                  <td className="p-6 text-[var(--muted)]" colSpan={5}>
                    {loading ? tr("common.loading") : "—"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </TableScroll>
      </section>
    </main>
  );
}

