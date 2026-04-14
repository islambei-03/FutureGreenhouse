"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useMe } from "@/components/auth/AuthContext";
import type { UserRole } from "@/lib/auth";
import { useI18n } from "@/components/i18n/I18nContext";

type Greenhouse = {
  id: number;
  name: string;
  temp_min: number;
  temp_max: number;
  humidity_min: number;
  humidity_max: number;
};

type RecentRow = {
  id: number;
  greenhouse_id: number;
  greenhouse_name: string;
  temperature: number;
  humidity: number;
  co2: number;
  recorded_at: string;
};

function nowSql() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function badge(ok: boolean) {
  return ok
    ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
    : "border-red-500/30 bg-red-500/15 text-red-200";
}

export default function SensorEntryPage() {
  const me = useMe();
  const role: UserRole = me?.role ?? "viewer";
  const allowed = role === "operator" || role === "admin";
  const { t: tr } = useI18n();

  const FormSchema = useMemo(
    () =>
      z.object({
        greenhouse_id: z.number().int().positive(tr("val.selectGreenhouse")),
        temperature: z.number(),
        humidity: z.number().min(0, tr("val.humidityRange")).max(100, tr("val.humidityRange")),
        co2: z.number().min(0, tr("val.co2Min")),
        recorded_at: z.string().optional().nullable(),
      }),
    [tr],
  );

  const [greenhouses, setGreenhouses] = useState<Greenhouse[]>([]);
  const [recent, setRecent] = useState<RecentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    greenhouse_id: 0,
    temperature: 24,
    humidity: 65,
    co2: 700,
    recorded_at: nowSql(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const selected = useMemo(
    () => greenhouses.find((g) => g.id === form.greenhouse_id) ?? null,
    [greenhouses, form.greenhouse_id],
  );

  const outOfNorm = useMemo(() => {
    if (!selected) return { temp: false, hum: false };
    const temp = form.temperature < selected.temp_min || form.temperature > selected.temp_max;
    const hum = form.humidity < selected.humidity_min || form.humidity > selected.humidity_max;
    return { temp, hum };
  }, [selected, form.temperature, form.humidity]);

  async function load() {
    setLoading(true);
    try {
      const gRes = await fetch("/api/greenhouses", { cache: "no-store" });
      const g = (await gRes.json().catch(() => null)) as null | { ok: boolean; greenhouses: any[] };
      if (g?.ok) {
        const opts = (g.greenhouses as any[]).map((x) => ({
          id: x.id,
          name: x.name,
          temp_min: x.temp_min,
          temp_max: x.temp_max,
          humidity_min: x.humidity_min,
          humidity_max: x.humidity_max,
        })) as Greenhouse[];
        setGreenhouses(opts);
        setForm((v) => ({ ...v, greenhouse_id: v.greenhouse_id || opts[0]?.id || 0 }));
      }

      const rRes = await fetch("/api/sensors?recent=1", { cache: "no-store" });
      const r = (await rRes.json().catch(() => null)) as null | { ok: boolean; recent: RecentRow[] };
      if (r?.ok) setRecent(r.recent);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  async function submit() {
    setError(null);
    const parsed = FormSchema.safeParse({
      greenhouse_id: form.greenhouse_id,
      temperature: Number(form.temperature),
      humidity: Number(form.humidity),
      co2: Number(form.co2),
      recorded_at: form.recorded_at?.trim() ? form.recorded_at : null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? tr("error.checkFields"));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/sensors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || tr("error.recordFailed"));
        return;
      }
      setToast(
        outOfNorm.temp || outOfNorm.hum
          ? tr("sensorEntry.toast.savedWithDeviation")
          : tr("sensorEntry.toast.saved"),
      );
      setForm((v) => ({ ...v, recorded_at: nowSql() }));
      await load();
    } catch {
      setError(tr("error.network"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold">{tr("sensorEntry.title")}</div>
            <div className="text-sm text-[var(--muted)] mt-1">
              {tr("sensorEntry.subtitle")}
            </div>
          </div>
          <div className="text-xs text-[var(--muted)]">{loading ? tr("common.loading") : tr("sensorEntry.ready")}</div>
        </div>
      </div>

      {!allowed ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 text-red-200 p-5">
          {tr("sensorEntry.noRights")} {tr("sensorEntry.noRightsText")}
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="xl:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-5">
          <div className="font-semibold">{tr("sensorEntry.formTitle")}</div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-[var(--muted)]">{tr("watering.field.greenhouse")}</label>
              <select
                value={form.greenhouse_id}
                onChange={(e) => setForm((v) => ({ ...v, greenhouse_id: Number(e.target.value) }))}
                className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
                disabled={!allowed}
              >
                {greenhouses.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              {selected ? (
                <div className="text-xs text-[var(--muted)]">
                  {tr("sensorEntry.normHint")}: {tr("parameters.temperature").toLowerCase()} {selected.temp_min}–{selected.temp_max}°C ·{" "}
                  {tr("parameters.humidity").toLowerCase()} {selected.humidity_min}–{selected.humidity_max}%
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--muted)]">{tr("sensorEntry.temperature")}</label>
              <input
                type="number"
                value={form.temperature}
                onChange={(e) => setForm((v) => ({ ...v, temperature: Number(e.target.value) }))}
                className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
                disabled={!allowed}
              />
              {selected ? (
                <span className={["inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", badge(!outOfNorm.temp)].join(" ")}>
                  {outOfNorm.temp ? tr("sensorEntry.badge.outOfNorm") : tr("sensorEntry.badge.ok")}
                </span>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--muted)]">{tr("sensorEntry.humidity")}</label>
              <input
                type="number"
                value={form.humidity}
                onChange={(e) => setForm((v) => ({ ...v, humidity: Number(e.target.value) }))}
                className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
                disabled={!allowed}
              />
              {selected ? (
                <span className={["inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", badge(!outOfNorm.hum)].join(" ")}>
                  {outOfNorm.hum ? tr("sensorEntry.badge.outOfNorm") : tr("sensorEntry.badge.ok")}
                </span>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--muted)]">{tr("sensorEntry.co2")}</label>
              <input
                type="number"
                value={form.co2}
                onChange={(e) => setForm((v) => ({ ...v, co2: Number(e.target.value) }))}
                className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
                disabled={!allowed}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--muted)]">{tr("sensorEntry.datetime")}</label>
              <input
                value={form.recorded_at}
                onChange={(e) => setForm((v) => ({ ...v, recorded_at: e.target.value }))}
                className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
                disabled={!allowed}
                placeholder="YYYY-MM-DD HH:MM:SS"
              />
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-5">
            <button
              onClick={submit}
              disabled={!allowed || saving}
              className="rounded-xl px-4 py-3 font-medium bg-[color:var(--accent)] text-black hover:brightness-110 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? tr("sensorEntry.submit.saving") : tr("sensorEntry.submit")}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]">
          <div className="p-5 border-b border-[var(--border)]">
            <div className="font-semibold">{tr("sensorEntry.recent.title")}</div>
            <div className="text-sm text-[var(--muted)] mt-1">{tr("sensorEntry.recent.subtitle")}</div>
          </div>
          <div className="p-5 space-y-3">
            {recent.map((r) => (
              <div key={r.id} className="rounded-2xl border border-[var(--border)] bg-black/10 p-4">
                <div className="font-medium">{r.greenhouse_name}</div>
                <div className="mt-2 text-xs text-[var(--muted)]">
                  {r.recorded_at}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-xl border border-[var(--border)] bg-black/20 px-2 py-1.5 text-[var(--muted)]">
                    T: <span className="text-[var(--text)]">{r.temperature}°C</span>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-black/20 px-2 py-1.5 text-[var(--muted)]">
                    H: <span className="text-[var(--text)]">{r.humidity}%</span>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-black/20 px-2 py-1.5 text-[var(--muted)]">
                    CO2: <span className="text-[var(--text)]">{r.co2}</span>
                  </div>
                </div>
              </div>
            ))}
            {!recent.length ? <div className="text-sm text-[var(--muted)]">{tr("sensorEntry.recent.none")}</div> : null}
          </div>
        </section>
      </div>

      {toast ? (
        <div className="fixed right-4 top-20 z-50 animate-slideInRight">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] px-4 py-3 text-sm">
            {toast}
          </div>
        </div>
      ) : null}
    </main>
  );
}

