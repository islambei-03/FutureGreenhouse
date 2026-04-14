"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n/I18nContext";

type GreenhouseRow = {
  id: number;
  name: string;
  status: "активна" | "обслуживание" | "отключена";
  temp_min: number;
  temp_max: number;
  humidity_min: number;
  humidity_max: number;
  temperature: number | null;
  humidity: number | null;
  co2: number | null;
};

type TaskRow = {
  id: number;
  title: string;
  is_completed: number;
  priority: "обычный" | "высокий" | "срочный";
  deadline: string | null;
  assigned_name: string | null;
  greenhouse_name: string | null;
};

function clampBadge(value: number | null, min: number, max: number) {
  if (value === null || Number.isNaN(value)) return "bg-zinc-500/20 text-zinc-200 border-zinc-500/30";
  if (value < min || value > max) return "bg-red-500/15 text-red-200 border-red-500/30";
  return "bg-emerald-500/15 text-emerald-200 border-emerald-500/30";
}

function statusDot(status: GreenhouseRow["status"]) {
  if (status === "активна") return "bg-emerald-400";
  if (status === "обслуживание") return "bg-yellow-300";
  return "bg-red-400";
}

function statusKey(status: GreenhouseRow["status"]) {
  if (status === "активна") return "enum.greenhouseStatus.active" as const;
  if (status === "обслуживание") return "enum.greenhouseStatus.maintenance" as const;
  return "enum.greenhouseStatus.off" as const;
}

function priorityBadge(p: TaskRow["priority"]) {
  if (p === "срочный") return "bg-red-500/15 text-red-200 border-red-500/30";
  if (p === "высокий") return "bg-yellow-400/15 text-yellow-100 border-yellow-400/30";
  return "bg-blue-400/15 text-blue-100 border-blue-400/30";
}

function useCountUp(target: number, opts?: { durationMs?: number; decimals?: number }) {
  const durationMs = opts?.durationMs ?? 900;
  const decimals = opts?.decimals ?? 0;
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const to = Number.isFinite(target) ? target : 0;

    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (to - from) * eased;
      setValue(Number(next.toFixed(decimals)));
      if (t < 1) raf = requestAnimationFrame(tick);
    }

    setValue(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, decimals]);

  return value;
}

export default function DashboardClient() {
  const { t: tr, locale } = useI18n();
  const [greenhouses, setGreenhouses] = useState<GreenhouseRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");
  const [kpiFromDb, setKpiFromDb] = useState<{
    activeGreenhouses: number;
    avgTemp: number | null;
    cultures: number;
    staffToday: number;
    tasksTotal: number;
    tasksDone: number;
  } | null>(null);

  async function load() {
    const [gRes, tRes] = await Promise.all([
      fetch("/api/greenhouses", { cache: "no-store" }),
      fetch("/api/tasks?today=1", { cache: "no-store" }),
    ]);
    const g = (await gRes.json().catch(() => null)) as null | { ok: boolean; greenhouses: any[] };
    const t = (await tRes.json().catch(() => null)) as null | { ok: boolean; tasks: TaskRow[] };
    if (g?.ok) setGreenhouses(g.greenhouses as GreenhouseRow[]);
    if (t?.ok) setTasks(t.tasks);
  }

  async function loadKpi(p: "day" | "week" | "month") {
    const res = await fetch(`/api/kpi?period=${p}`, { cache: "no-store" });
    const data = (await res.json().catch(() => null)) as
      | null
      | { ok: true; kpi: any }
      | { ok: false; error?: string };
    if (data && (data as any).ok) setKpiFromDb((data as any).kpi);
  }

  useEffect(() => {
    load();
    loadKpi("week");
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    loadKpi(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

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
    for (const g of greenhouses) {
      if (g.temperature !== null && (g.temperature < g.temp_min || g.temperature > g.temp_max)) {
        a.push({ level: "danger", text: formatTempAlert(g.name, g.temperature) });
      }
      if (g.humidity !== null && (g.humidity < g.humidity_min || g.humidity > g.humidity_max)) {
        a.push({ level: "warn", text: formatHumAlert(g.name, g.humidity) });
      }
    }
    return a.slice(0, 3);
  }, [greenhouses, locale, tr]);

  const kpi = useMemo(() => {
    if (kpiFromDb) {
      return {
        active: kpiFromDb.activeGreenhouses,
        avgTemp: kpiFromDb.avgTemp,
        cultures: kpiFromDb.cultures,
        todayStaff: kpiFromDb.staffToday,
        tasksText:
          kpiFromDb.tasksTotal > 0
            ? `${kpiFromDb.tasksDone}/${kpiFromDb.tasksTotal} (${Math.round((kpiFromDb.tasksDone / kpiFromDb.tasksTotal) * 100)}%)`
            : "—",
      };
    }
    const active = greenhouses.filter((g) => g.status === "активна").length;
    const temps = greenhouses.map((g) => g.temperature).filter((v): v is number => typeof v === "number");
    const avgTemp = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : null;
    return { active, avgTemp, cultures: 0, todayStaff: 0, tasksText: "—" };
  }, [greenhouses, kpiFromDb]);

  const activeAnim = useCountUp(kpi.active, { durationMs: 800, decimals: 0 });
  const culturesAnim = useCountUp(kpi.cultures, { durationMs: 900, decimals: 0 });
  const staffAnim = useCountUp(kpi.todayStaff, { durationMs: 950, decimals: 0 });
  const avgTempAnim = useCountUp(kpi.avgTemp ?? 0, { durationMs: 900, decimals: 1 });

  async function toggleTask(id: number, done: boolean) {
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, is_completed: done ? 1 : 0 }),
    }).catch(() => null);
    await load();
  }

  return (
    <main className="space-y-4">
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
              <span className={a.level === "danger" ? "mr-2 inline-block size-2 rounded-full bg-red-400 animate-pulse" : "mr-2 inline-block size-2 rounded-full bg-yellow-300"} />
              {a.text}
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: tr("dashboard.kpi.activeGreenhouses"), value: String(activeAnim) },
          { label: tr("dashboard.kpi.avgTemp"), value: kpi.avgTemp ? `${avgTempAnim.toFixed(1)}°C` : "—" },
          { label: tr("dashboard.kpi.cultures"), value: String(culturesAnim) },
          { label: tr("dashboard.kpi.staffToday"), value: String(staffAnim) },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-5 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(0,0,0,0.38)] transition"
          >
            <div className="text-xs text-[var(--muted)]">{c.label}</div>
            <div className="mt-2 text-2xl font-semibold">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="text-sm text-[var(--muted)]">
          {tr("dashboard.kpi.tasksCompletion")}: <span className="text-[var(--text)] font-medium">{kpi.tasksText}</span>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as any)}
          className="sm:w-56 rounded-xl bg-black/20 border border-[var(--border)] px-4 py-2.5 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
        >
          <option value="day">{tr("dashboard.period.day")}</option>
          <option value="week">{tr("dashboard.period.week")}</option>
          <option value="month">{tr("dashboard.period.month")}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="xl:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]">
          <div className="p-5 border-b border-[var(--border)]">
            <div className="font-semibold">{tr("dashboard.monitoring.title")}</div>
            <div className="text-sm text-[var(--muted)] mt-1">{tr("dashboard.monitoring.subtitle")}</div>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm fg-table-stagger">
              <thead className="text-left text-[var(--muted)]">
                <tr className="border-b border-[var(--border)]">
                  <th className="p-4">{tr("dashboard.table.greenhouse")}</th>
                  <th className="p-4">{tr("dashboard.table.temperature")}</th>
                  <th className="p-4">{tr("dashboard.table.humidity")}</th>
                  <th className="p-4">CO2</th>
                  <th className="p-4">{tr("dashboard.table.status")}</th>
                </tr>
              </thead>
              <tbody>
                {greenhouses.map((g) => (
                  <tr key={g.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-white/5 transition">
                    <td className="p-4">
                      <div className="font-medium">{g.name}</div>
                      <div className="text-xs text-[var(--muted)]">ID: {g.id}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center rounded-full border px-2 py-1 ${clampBadge(g.temperature, g.temp_min, g.temp_max)}`}>
                        {g.temperature ?? "—"}{typeof g.temperature === "number" ? "°C" : ""}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center rounded-full border px-2 py-1 ${clampBadge(g.humidity, g.humidity_min, g.humidity_max)}`}>
                        {g.humidity ?? "—"}{typeof g.humidity === "number" ? "%" : ""}
                      </span>
                    </td>
                    <td className="p-4 text-[var(--muted)]">{g.co2 ?? "—"}{typeof g.co2 === "number" ? " ppm" : ""}</td>
                    <td className="p-4">
                      <div className="inline-flex items-center gap-2">
                        <span className={`inline-block size-2 rounded-full ${statusDot(g.status)}`} />
                        <span className="text-[var(--muted)]">{tr(statusKey(g.status))}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {!greenhouses.length ? (
                  <tr>
                    <td className="p-6 text-[var(--muted)]" colSpan={5}>
                      {tr("common.loading")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]">
          <div className="p-5 border-b border-[var(--border)]">
            <div className="font-semibold">{tr("dashboard.todayTasks.title")}</div>
            <div className="text-sm text-[var(--muted)] mt-1">{tr("dashboard.todayTasks.subtitle")}</div>
          </div>
          <div className="p-4 space-y-2">
            {tasks.map((t) => (
              <label
                key={t.id}
                className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-black/10 p-3 hover:bg-white/5 transition"
              >
                <input
                  type="checkbox"
                  checked={!!t.is_completed}
                  onChange={(e) => toggleTask(t.id, e.target.checked)}
                  className="mt-1 accent-[color:var(--accent)]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className={t.is_completed ? "line-through text-[var(--muted)]" : "font-medium"}>
                      {t.title}
                    </div>
                    <span className={`text-xs rounded-full border px-2 py-1 ${priorityBadge(t.priority)}`}>
                      {t.priority}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    {t.greenhouse_name ? `${t.greenhouse_name} · ` : ""}
                    {t.assigned_name ? `${t.assigned_name}` : tr("common.notSpecified")}
                  </div>
                </div>
              </label>
            ))}
            {!tasks.length ? (
              <div className="text-sm text-[var(--muted)] p-2">{tr("dashboard.todayTasks.noTasks")}</div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

