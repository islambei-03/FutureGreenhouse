"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/I18nContext";
import type { PlannerEvent, WeekPlan } from "@/lib/ai/planner";
import AiTabInfo from "@/components/ai/AiTabInfo";

const TYPE_COLORS: Record<PlannerEvent["type"], string> = {
  полив: "border-blue-400/40 bg-blue-500/15",
  задача: "border-[color:var(--accent)]/40 bg-[color:var(--accent)]/10",
  осмотр: "border-cyan-400/40 bg-cyan-500/10",
  обработка: "border-purple-400/40 bg-purple-500/15",
  уборка: "border-amber-400/40 bg-amber-500/15",
};

export default function WeekPlanner() {
  const { t } = useI18n();
  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSaved = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/planner", { cache: "no-store" });
      const data = (await res.json()) as { ok: boolean; plan?: WeekPlan | null };
      if (data.ok && data.plan) setPlan(data.plan);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  async function generate() {
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/ai/planner", { method: "POST" });
      const data = (await res.json()) as { ok: boolean; plan?: WeekPlan; error?: string };
      if (data.ok && data.plan) setPlan(data.plan);
      else setError(data.error || t("ai.planner.failed"));
    } catch {
      setError(t("error.network"));
    } finally {
      setLoading(false);
    }
  }

  async function accept() {
    if (!plan) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/planner", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) setSaved(true);
      else setError(data.error || t("error.saveFailed"));
    } catch {
      setError(t("error.network"));
    } finally {
      setSaving(false);
    }
  }

  function updateEvent(dayIdx: number, evId: string, patch: Partial<PlannerEvent>) {
    setPlan((prev) => {
      if (!prev) return prev;
      const days = prev.days.map((d, i) => {
        if (i !== dayIdx) return d;
        return {
          ...d,
          events: d.events.map((e) => (e.id === evId ? { ...e, ...patch } : e)),
        };
      });
      return { ...prev, days };
    });
    setSaved(false);
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{t("ai.planner.title")}</h3>
          <p className="text-sm text-[var(--muted)] mt-1">{t("ai.planner.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="rounded-xl px-5 py-2.5 text-sm font-medium bg-[color:var(--accent)] text-black disabled:opacity-50"
          >
            {loading ? t("ai.planner.generating") : t("ai.planner.generate")}
          </button>
          {plan ? (
            <button
              type="button"
              onClick={accept}
              disabled={saving}
              className="rounded-xl px-4 py-2.5 text-sm border border-emerald-500/40 bg-emerald-500/15 text-emerald-100 disabled:opacity-50"
            >
              {saving ? t("common.saving") : t("ai.planner.accept")}
            </button>
          ) : null}
        </div>
      </header>

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>
      ) : null}
      {saved ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {t("ai.planner.saved")}
        </p>
      ) : null}

      {plan?.summary ? (
        <p className="text-sm text-[var(--muted)] rounded-xl border border-[var(--border)] bg-black/10 px-4 py-3">
          {plan.summary}
        </p>
      ) : null}

      {!plan ? (
        <p className="text-sm text-[var(--muted)]">{t("ai.planner.empty")}</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-3 overflow-x-auto">
          {plan.days.map((day, dayIdx) => (
            <div
              key={day.date}
              className="min-w-[140px] rounded-2xl border border-[var(--border)] bg-[var(--card)] flex flex-col"
            >
              <div className="px-3 py-2 border-b border-[var(--border)] bg-black/20 rounded-t-2xl">
                <p className="text-xs text-[var(--muted)]">{day.weekday}</p>
                <p className="text-sm font-medium">{day.date}</p>
              </div>
              <ul className="p-2 space-y-2 flex-1 min-h-[120px]">
                {day.events.length === 0 ? (
                  <li className="text-[10px] text-[var(--muted)] text-center py-4">—</li>
                ) : (
                  day.events.map((ev) => (
                    <li
                      key={ev.id}
                      className={["rounded-lg border p-2 text-[11px] space-y-1", TYPE_COLORS[ev.type]].join(" ")}
                    >
                      <input
                        type="time"
                        value={ev.time}
                        onChange={(e) => updateEvent(dayIdx, ev.id, { time: e.target.value })}
                        className="w-full bg-transparent text-[10px] font-mono border-0 p-0"
                      />
                      <input
                        value={ev.title}
                        onChange={(e) => updateEvent(dayIdx, ev.id, { title: e.target.value })}
                        className="w-full bg-transparent font-medium border-0 p-0 text-[11px]"
                      />
                      <p className="text-[10px] opacity-70 truncate">{ev.greenhouse}</p>
                      <span className="inline-block text-[9px] uppercase tracking-wide opacity-60">{ev.type}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
