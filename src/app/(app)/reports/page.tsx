"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import type { ChartData, ChartOptions } from "chart.js";
import { Bar, Line, Doughnut, Pie } from "react-chartjs-2";
import RippleButton from "@/components/ui/RippleButton";
import TableScroll from "@/components/ui/TableScroll";
import { useI18n } from "@/components/i18n/I18nContext";
import type { I18nKey } from "@/lib/i18n";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

type Period = "day" | "week" | "month" | "year";

const REPORT_PERIOD_I18N = {
  day: "reports.period.day",
  week: "reports.period.week",
  month: "reports.period.month",
  year: "reports.period.year",
} as const satisfies Record<Period, I18nKey>;

type ReportAnalytics = {
  taskPriorities: Array<{ priority: string; count: number }>;
  wateringStatus: { done: number; pending: number };
  cultureStages: Array<{ stage: string; count: number }>;
  greenhouseAvgTemp: Array<{ name: string; avg_temp: number }>;
  co2Daily: Array<{ day: string; avgCo2: number }>;
  notificationsByType: Array<{ type: string; count: number }>;
};

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
  analytics: ReportAnalytics;
};

type ReportTab = "overview" | "charts" | "data";

function priorityTr(p: string, tr: (k: I18nKey) => string) {
  if (p === "срочный") return tr("tasks.priority.urgent");
  if (p === "высокий") return tr("tasks.priority.high");
  return tr("tasks.priority.normal");
}

function notifTypeTr(type: string, tr: (k: I18nKey) => string) {
  if (type === "тревога") return tr("enum.notificationType.alarm");
  if (type === "предупреждение") return tr("enum.notificationType.warning");
  if (type === "успех") return tr("enum.notificationType.success");
  return tr("enum.notificationType.info");
}

function kpiCard(label: string, value: string) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-5 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(0,0,0,0.38)] transition">
      <div className="text-xs text-[var(--muted)]">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function chartCard(title: string, subtitle: string | undefined, children: React.ReactNode) {
  return (
    <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-5">
      <div className="font-semibold">{title}</div>
      {subtitle ? <div className="text-sm text-[var(--muted)] mt-1">{subtitle}</div> : null}
      <div className="mt-4 max-h-[22rem]">{children}</div>
    </section>
  );
}

export default function ReportsPage() {
  const { t: tr } = useI18n();
  const [period, setPeriod] = useState<Period>("month");
  const [tab, setTab] = useState<ReportTab>("overview");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(p: Period) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports?period=${p}`, { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as null | { ok: boolean; report: Report; error?: string };
      if (data?.ok && data.report?.analytics) setReport(data.report);
      else if (data?.ok && data.report && !(data.report as Report).analytics) {
        setError("Отчёт устарел: обновите страницу (нет блока analytics).");
        setReport(null);
      } else setError(data?.error || "Не удалось загрузить отчёт");
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
      maintainAspectRatio: false,
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
          label: tr("reports.legend.done"),
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

  const tasksShareData = useMemo<ChartData<"doughnut"> | null>(() => {
    if (!report) return null;
    const done = report.kpi.tasksDone;
    const pending = Math.max(0, report.kpi.tasksTotal - report.kpi.tasksDone);
    return {
      labels: [tr("reports.legend.done"), tr("reports.legend.pending")],
      datasets: [{ data: [done, pending], backgroundColor: ["#22c55e", "#334155"], borderWidth: 0 }],
    };
  }, [report, tr]);

  const wateringShareData = useMemo<ChartData<"doughnut"> | null>(() => {
    if (!report) return null;
    const { done, pending } = report.analytics.wateringStatus;
    return {
      labels: [tr("reports.legend.done"), tr("reports.legend.pending")],
      datasets: [{ data: [done, pending], backgroundColor: ["#22c55e", "#f59e0b"], borderWidth: 0 }],
    };
  }, [report, tr]);

  const taskPriorityData = useMemo<ChartData<"bar"> | null>(() => {
    if (!report || !report.analytics.taskPriorities.length) return null;
    return {
      labels: report.analytics.taskPriorities.map((x) => priorityTr(x.priority, tr)),
      datasets: [
        {
          label: tr("tasks.title"),
          data: report.analytics.taskPriorities.map((x) => x.count),
          backgroundColor: "rgba(99, 102, 241, 0.55)",
          borderColor: "rgba(99, 102, 241, 0.95)",
          borderWidth: 1,
        },
      ],
    };
  }, [report, tr]);

  const culturePieData = useMemo<ChartData<"pie"> | null>(() => {
    if (!report || !report.analytics.cultureStages.length) return null;
    return {
      labels: report.analytics.cultureStages.map((x) => x.stage),
      datasets: [
        {
          data: report.analytics.cultureStages.map((x) => x.count),
          backgroundColor: ["#22c55e", "#3b82f6", "#eab308", "#a855f7", "#f97316"],
          borderWidth: 1,
          borderColor: "rgba(15,23,42,0.4)",
        },
      ],
    };
  }, [report]);

  const ghTempData = useMemo<ChartData<"bar"> | null>(() => {
    if (!report || !report.analytics.greenhouseAvgTemp.length) return null;
    return {
      labels: report.analytics.greenhouseAvgTemp.map((x) => (x.name.length > 14 ? `${x.name.slice(0, 13)}…` : x.name)),
      datasets: [
        {
          label: `${tr("dashboard.kpi.avgTemp")}, °C`,
          data: report.analytics.greenhouseAvgTemp.map((x) => Number(x.avg_temp.toFixed(1))),
          backgroundColor: "rgba(21, 128, 61, 0.65)",
          borderColor: "rgba(21, 128, 61, 0.95)",
          borderWidth: 1,
        },
      ],
    };
  }, [report, tr]);

  const co2LineData = useMemo<ChartData<"line"> | null>(() => {
    if (!report || !report.analytics.co2Daily.length) return null;
    const rows = report.analytics.co2Daily.slice(-42);
    return {
      labels: rows.map((r) => r.day.slice(5)),
      datasets: [
        {
          label: "CO₂ (ppm)",
          data: rows.map((r) => Math.round(r.avgCo2)),
          borderColor: "rgba(168, 85, 247, 0.95)",
          backgroundColor: "rgba(168, 85, 247, 0.12)",
          fill: true,
          tension: 0.28,
          pointRadius: 2,
        },
      ],
    };
  }, [report]);

  const notificationsBarData = useMemo<ChartData<"bar"> | null>(() => {
    if (!report || !report.analytics.notificationsByType.length) return null;
    return {
      labels: report.analytics.notificationsByType.map((x) => notifTypeTr(x.type, tr)),
      datasets: [
        {
          label: tr("notifications.title"),
          data: report.analytics.notificationsByType.map((x) => x.count),
          backgroundColor: "rgba(14, 165, 233, 0.45)",
          borderColor: "rgba(14, 165, 233, 0.95)",
          borderWidth: 1,
        },
      ],
    };
  }, [report, tr]);

  const compactBarOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true, labels: { color: "rgba(232,245,238,0.8)" } }, tooltip: { enabled: true } },
      scales: {
        x: { ticks: { color: "rgba(232,245,238,0.6)" }, grid: { color: "rgba(232,245,238,0.08)" } },
        y: { ticks: { color: "rgba(232,245,238,0.6)" }, grid: { color: "rgba(232,245,238,0.08)" } },
      },
    }),
    [],
  );

  const hBarOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      indexAxis: "y" as const,
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
      scales: {
        x: { ticks: { color: "rgba(232,245,238,0.6)" }, grid: { color: "rgba(232,245,238,0.08)" }, beginAtZero: true },
        y: { ticks: { color: "rgba(232,245,238,0.6)" }, grid: { color: "rgba(232,245,238,0.08)" } },
      },
    }),
    [],
  );

  const lineOptions = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true, labels: { color: "rgba(232,245,238,0.8)" } }, tooltip: { enabled: true } },
      scales: {
        x: { ticks: { color: "rgba(232,245,238,0.6)" }, grid: { color: "rgba(232,245,238,0.08)" } },
        y: { ticks: { color: "rgba(232,245,238,0.6)" }, grid: { color: "rgba(232,245,238,0.08)" } },
      },
    }),
    [],
  );

  const doughnutOptions = useMemo<ChartOptions<"doughnut">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { color: "rgba(232,245,238,0.85)", boxWidth: 12 } },
        tooltip: { enabled: true },
      },
    }),
    [],
  );

  const pieOptions = useMemo<ChartOptions<"pie">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "right", labels: { color: "rgba(232,245,238,0.85)", boxWidth: 10, font: { size: 10 } } },
        tooltip: { enabled: true },
      },
    }),
    [],
  );

  function download(format: "pdf" | "excel") {
    const url = `/api/reports?period=${period}&format=${format === "excel" ? "excel" : "pdf"}`;
    window.open(url, "_blank");
  }

  const tabBtn = (id: ReportTab, labelKey: I18nKey) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={[
        "rounded-xl px-4 py-2 text-sm font-medium transition border",
        tab === id
          ? "border-[color:var(--accent)] bg-[color:var(--accent)]/15 text-[color:var(--accent)]"
          : "border-[var(--border)] bg-black/20 text-[var(--muted)] hover:bg-white/5",
      ].join(" ")}
    >
      {tr(labelKey)}
    </button>
  );

  return (
    <main className="min-w-0 max-w-full space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="text-xl font-semibold">{tr("reports.title")}</div>
            <div className="text-sm text-[var(--muted)] mt-1">{tr("reports.subtitle")}</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {tabBtn("overview", "reports.tab.overview")}
              {tabBtn("charts", "reports.tab.charts")}
              {tabBtn("data", "reports.tab.data")}
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
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      {tab === "overview" ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {kpiCard(tr("reports.kpi.harvested"), report ? String(report.kpi.harvested) : loading ? "…" : "—")}
            {kpiCard(tr("reports.kpi.water"), report ? String(report.kpi.waterLiters) : loading ? "…" : "—")}
            {kpiCard(
              tr("reports.kpi.tasksCompletion"),
              report ? `${report.kpi.tasksDone}/${report.kpi.tasksTotal} (${report.kpi.tasksCompletionPct}%)` : loading ? "…" : "—",
            )}
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 p-4 text-sm text-[var(--muted)]">
            {tr("reports.overview.hint")}
          </div>
        </>
      ) : null}

      {tab === "charts" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {chartCard(tr("reports.chart.title"), tr("reports.chart.subtitle"), barData ? <Bar options={barOptions} data={barData} /> : null)}
            {chartCard(tr("reports.kpi.water"), tr(REPORT_PERIOD_I18N[period]), waterDailyData ? <Bar options={compactBarOptions} data={waterDailyData} /> : null)}
            {chartCard(tr("tasks.title"), tr(REPORT_PERIOD_I18N[period]), tasksDailyData ? <Bar options={compactBarOptions} data={tasksDailyData} /> : null)}
            {chartCard(tr("parameters.title"), tr(REPORT_PERIOD_I18N[period]), sensorsDailyData ? <Line options={lineOptions} data={sensorsDailyData} /> : null)}
          </div>
          <div className="text-sm font-semibold text-[var(--muted)]">{tr("reports.charts.analyticsBlock")}</div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {chartCard(tr("reports.chart.tasksShare"), undefined, tasksShareData ? <Doughnut options={doughnutOptions} data={tasksShareData} /> : null)}
            {chartCard(tr("reports.chart.wateringShare"), undefined, wateringShareData ? <Doughnut options={doughnutOptions} data={wateringShareData} /> : null)}
            {chartCard(
              tr("reports.chart.taskPriorities"),
              undefined,
              taskPriorityData ? <Bar options={hBarOptions} data={taskPriorityData} /> : <div className="text-sm text-[var(--muted)]">—</div>,
            )}
            {chartCard(
              tr("reports.chart.cultureStages"),
              undefined,
              culturePieData ? <Pie options={pieOptions} data={culturePieData} /> : <div className="text-sm text-[var(--muted)]">—</div>,
            )}
            {chartCard(
              tr("reports.chart.avgTempGh"),
              undefined,
              ghTempData ? <Bar options={compactBarOptions} data={ghTempData} /> : <div className="text-sm text-[var(--muted)]">—</div>,
            )}
            {chartCard(tr("reports.chart.co2Daily"), undefined, co2LineData ? <Line options={lineOptions} data={co2LineData} /> : null)}
            {chartCard(
              tr("reports.chart.notificationsByType"),
              undefined,
              notificationsBarData ? <Bar options={compactBarOptions} data={notificationsBarData} /> : (
                <div className="text-sm text-[var(--muted)]">—</div>
              ),
            )}
          </div>
        </div>
      ) : null}

      {tab === "data" ? (
        <div className="space-y-4">
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

          {report ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                <div className="font-semibold mb-3">{tr("reports.chart.taskPriorities")}</div>
                <TableScroll>
                  <table className="w-full text-sm">
                    <tbody>
                      {report.analytics.taskPriorities.map((r) => (
                        <tr key={r.priority} className="border-b border-[var(--border)]">
                          <td className="py-2">{priorityTr(r.priority, tr)}</td>
                          <td className="py-2 text-right text-[var(--muted)]">{r.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
              </section>
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                <div className="font-semibold mb-3">{tr("reports.chart.cultureStages")}</div>
                <TableScroll>
                  <table className="w-full text-sm">
                    <tbody>
                      {report.analytics.cultureStages.map((r) => (
                        <tr key={r.stage} className="border-b border-[var(--border)]">
                          <td className="py-2">{r.stage}</td>
                          <td className="py-2 text-right text-[var(--muted)]">{r.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
              </section>
            </div>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
