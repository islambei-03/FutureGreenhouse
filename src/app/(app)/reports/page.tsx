"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import type { ChartData, ChartOptions } from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import RippleButton from "@/components/ui/RippleButton";
import TableScroll from "@/components/ui/TableScroll";
import { useI18n } from "@/components/i18n/I18nContext";
import type { I18nKey } from "@/lib/i18n";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

type Period = "day" | "week" | "month" | "year";

const REPORT_PERIOD_I18N = {
  day: "reports.period.day",
  week: "reports.period.week",
  month: "reports.period.month",
  year: "reports.period.year",
} as const satisfies Record<Period, I18nKey>;

type Report = {
  period: Period;
  periodTitle: string;
  kpi: {
    harvested: number;
    waterLiters: number;
    tasksTotal: number;
    tasksDone: number;
    tasksCompletionPct: number;
  };
  chart: { labels: string[]; values: number[] };
  table: Array<{ id: number; name: string; harvested: number }>;
  series: {
    waterDaily: Array<{ day: string; liters: number }>;
    tasksDaily: Array<{ day: string; total: number; done: number }>;
    sensorsDaily: Array<{ day: string; avgTemp: number | null; avgHum: number | null }>;
  };
};

function kpiCard(label: string, value: string) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-5 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(0,0,0,0.38)] transition">
      <div className="text-xs text-[var(--muted)]">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

export default function ReportsPage() {
  const { t: tr } = useI18n();
  const [period, setPeriod] = useState<Period>("month");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(p: Period) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports?period=${p}`, { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as null | { ok: boolean; report: Report; error?: string };
      if (data?.ok) setReport(data.report);
      else setError(data?.error || "Не удалось загрузить отчёт");
    } catch {
      setError("Ошибка сети. Повторите попытку.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(period);
  }, [period]);

  const barData = useMemo<ChartData<"bar"> | null>(() => {
    if (!report) return null;
    return {
      labels: report.chart.labels,
      datasets: [
        {
          label: tr("reports.table.harvested"),
          data: report.chart.values,
          backgroundColor: "rgba(34, 197, 94, 0.45)",
          borderColor: "rgba(34, 197, 94, 0.95)",
          borderWidth: 1,
        },
      ],
    };
  }, [report, tr]);

  const barOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      plugins: {
        legend: { display: true, labels: { color: "rgba(232,245,238,0.8)" } },
        tooltip: { enabled: true },
        title: { display: false },
      },
      scales: {
        x: { ticks: { color: "rgba(232,245,238,0.6)" }, grid: { color: "rgba(232,245,238,0.08)" } },
        y: { ticks: { color: "rgba(232,245,238,0.6)" }, grid: { color: "rgba(232,245,238,0.08)" } },
      },
    }),
    [],
  );

  const waterDailyData = useMemo<ChartData<"bar"> | null>(() => {
    if (!report) return null;
    const labels = report.series.waterDaily.map((r) => r.day.slice(5));
    const values = report.series.waterDaily.map((r) => r.liters);
    return {
      labels,
      datasets: [
        {
          label: tr("reports.kpi.water"),
          data: values,
          backgroundColor: "rgba(59, 130, 246, 0.35)",
          borderColor: "rgba(59, 130, 246, 0.9)",
          borderWidth: 1,
        },
      ],
    };
  }, [report, tr]);

  const tasksDailyData = useMemo<ChartData<"bar"> | null>(() => {
    if (!report) return null;
    const labels = report.series.tasksDaily.map((r) => r.day.slice(5));
    const total = report.series.tasksDaily.map((r) => r.total);
    const done = report.series.tasksDaily.map((r) => r.done);
    return {
      labels,
      datasets: [
        {
          label: tr("reports.kpi.tasksCompletion"),
          data: done,
          backgroundColor: "rgba(34, 197, 94, 0.35)",
          borderColor: "rgba(34, 197, 94, 0.9)",
          borderWidth: 1,
        },
        {
          label: tr("tasks.title"),
          data: total,
          backgroundColor: "rgba(232, 245, 238, 0.10)",
          borderColor: "rgba(232, 245, 238, 0.25)",
          borderWidth: 1,
        },
      ],
    };
  }, [report, tr]);

  const sensorsDailyData = useMemo<ChartData<"line"> | null>(() => {
    if (!report) return null;
    const labels = report.series.sensorsDaily.map((r) => r.day.slice(5));
    return {
      labels,
      datasets: [
        {
          label: tr("dashboard.kpi.avgTemp"),
          data: report.series.sensorsDaily.map((r) => (typeof r.avgTemp === "number" ? Number(r.avgTemp.toFixed(1)) : null)),
          borderColor: "rgba(34, 197, 94, 0.95)",
          backgroundColor: "rgba(34, 197, 94, 0.15)",
          tension: 0.28,
          pointRadius: 2,
        },
        {
          label: tr("parameters.humidity"),
          data: report.series.sensorsDaily.map((r) => (typeof r.avgHum === "number" ? Number(r.avgHum.toFixed(1)) : null)),
          borderColor: "rgba(59, 130, 246, 0.95)",
          backgroundColor: "rgba(59, 130, 246, 0.15)",
          tension: 0.28,
          pointRadius: 2,
        },
      ],
    };
  }, [report, tr]);

  const compactBarOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      plugins: { legend: { display: true, labels: { color: "rgba(232,245,238,0.8)" } }, tooltip: { enabled: true } },
      scales: {
        x: { ticks: { color: "rgba(232,245,238,0.6)" }, grid: { color: "rgba(232,245,238,0.08)" } },
        y: { ticks: { color: "rgba(232,245,238,0.6)" }, grid: { color: "rgba(232,245,238,0.08)" } },
      },
    }),
    [],
  );

  const lineOptions = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      plugins: { legend: { display: true, labels: { color: "rgba(232,245,238,0.8)" } }, tooltip: { enabled: true } },
      scales: {
        x: { ticks: { color: "rgba(232,245,238,0.6)" }, grid: { color: "rgba(232,245,238,0.08)" } },
        y: { ticks: { color: "rgba(232,245,238,0.6)" }, grid: { color: "rgba(232,245,238,0.08)" } },
      },
    }),
    [],
  );

  function download(format: "pdf" | "excel") {
    const url = `/api/reports?period=${period}&format=${format === "excel" ? "excel" : "pdf"}`;
    window.open(url, "_blank");
  }

  return (
    <main className="min-w-0 max-w-full space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="text-xl font-semibold">{tr("reports.title")}</div>
            <div className="text-sm text-[var(--muted)] mt-1">
              {tr("reports.subtitle")}
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap lg:w-auto lg:shrink-0">
            <select
              value={period}
              onChange={(e) => {
                const p = e.target.value as Period;
                setPeriod(p);
                load(p);
              }}
              className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-2.5 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition sm:w-auto sm:min-w-[10rem]"
            >
              <option value="day">{tr("reports.period.day")}</option>
              <option value="week">{tr("reports.period.week")}</option>
              <option value="month">{tr("reports.period.month")}</option>
              <option value="year">{tr("reports.period.year")}</option>
            </select>
            <RippleButton onClick={() => download("pdf")} variant="outline" className="w-full px-4 py-2.5 sm:w-auto" disabled={loading}>
              {tr("reports.exportPdf")}
            </RippleButton>
            <RippleButton
              onClick={() => download("excel")}
              variant="outline"
              className="w-full px-4 py-2.5 sm:w-auto"
              disabled={loading}
            >
              {tr("reports.exportExcel")}
            </RippleButton>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {kpiCard(tr("reports.kpi.harvested"), report ? String(report.kpi.harvested) : loading ? "…" : "—")}
        {kpiCard(tr("reports.kpi.water"), report ? String(report.kpi.waterLiters) : loading ? "…" : "—")}
        {kpiCard(
          tr("reports.kpi.tasksCompletion"),
          report ? `${report.kpi.tasksDone}/${report.kpi.tasksTotal} (${report.kpi.tasksCompletionPct}%)` : loading ? "…" : "—",
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-5">
          <div className="font-semibold">{tr("reports.chart.title")}</div>
          <div className="text-sm text-[var(--muted)] mt-1">
            {tr("reports.chart.subtitle")}
          </div>
          <div className="mt-4">{barData ? <Bar options={barOptions} data={barData} /> : null}</div>
        </section>

        <section className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]">
          <div className="p-5 border-b border-[var(--border)]">
            <div className="font-semibold">{tr("reports.table.title")}</div>
            <div className="text-sm text-[var(--muted)] mt-1">{tr("reports.table.subtitle")}</div>
          </div>
          <TableScroll>
            <table className="w-full min-w-[22rem] text-sm fg-table-stagger">
              <thead className="text-left text-[var(--muted)]">
                <tr className="border-b border-[var(--border)]">
                  <th className="p-4">{tr("reports.table.greenhouse")}</th>
                  <th className="p-4">{tr("reports.table.harvested")}</th>
                </tr>
              </thead>
              <tbody>
                {(report?.table ?? []).map((r) => (
                  <tr key={r.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-white/5 transition">
                    <td className="p-4 font-medium">{r.name}</td>
                    <td className="p-4 text-[var(--muted)]">{r.harvested}</td>
                  </tr>
                ))}
                {!report && loading ? (
                  <tr>
                    <td className="p-6 text-[var(--muted)]" colSpan={2}>
                      {tr("common.loading")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </TableScroll>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-5">
          <div className="font-semibold">{tr("reports.kpi.water")}</div>
          <div className="text-sm text-[var(--muted)] mt-1">{tr(REPORT_PERIOD_I18N[period])}</div>
          <div className="mt-4">{waterDailyData ? <Bar options={compactBarOptions} data={waterDailyData} /> : null}</div>
        </section>

        <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-5">
          <div className="font-semibold">{tr("tasks.title")}</div>
          <div className="text-sm text-[var(--muted)] mt-1">{tr(REPORT_PERIOD_I18N[period])}</div>
          <div className="mt-4">{tasksDailyData ? <Bar options={compactBarOptions} data={tasksDailyData} /> : null}</div>
        </section>

        <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-5">
          <div className="font-semibold">{tr("parameters.title")}</div>
          <div className="text-sm text-[var(--muted)] mt-1">{tr(REPORT_PERIOD_I18N[period])}</div>
          <div className="mt-4">{sensorsDailyData ? <Line options={lineOptions} data={sensorsDailyData} /> : null}</div>
        </section>
      </div>
    </main>
  );
}

