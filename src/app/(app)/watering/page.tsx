"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useMe } from "@/components/auth/AuthContext";
import type { UserRole } from "@/lib/auth";
import RippleButton from "@/components/ui/RippleButton";
import { useI18n } from "@/components/i18n/I18nContext";

type GreenhouseOption = { id: number; name: string };

type WateringItem = {
  id: number;
  greenhouse_id: number;
  greenhouse_name: string;
  watering_type: string;
  scheduled_at: string;
  duration_minutes: number;
  volume_liters: number;
  is_done: number;
  notes: string | null;
};

function canCreate(role: UserRole) {
  return role === "admin" || role === "agronomist";
}
function canEdit(role: UserRole) {
  return role === "admin" || role === "agronomist";
}

function formatTime(dt: string) {
  // expects "YYYY-MM-DD HH:MM:SS"
  return dt.slice(11, 16);
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function dayLabel(d: Date) {
  const w = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"][d.getDay()];
  return `${w} · ${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function statusBadge(isDone: number) {
  if (isDone) return "border-emerald-500/30 bg-emerald-500/15 text-emerald-200";
  return "border-blue-400/30 bg-blue-400/15 text-blue-100";
}

export default function WateringPage() {
  const me = useMe();
  const role: UserRole = me?.role ?? "viewer";
  const { t: tr } = useI18n();

  const FormSchema = useMemo(
    () =>
      z.object({
        greenhouse_id: z.number().int().positive(tr("val.selectGreenhouse")),
        watering_type: z.string().min(2, tr("val.enterWateringType")),
        date: z.string().min(8, tr("val.enterDate")),
        time: z.string().min(3, tr("val.enterTime")),
        duration_minutes: z.number().int().positive(tr("val.durationPositive")),
        volume_liters: z.number().positive(tr("val.volumePositive")),
        notes: z.string().optional().nullable(),
      }),
    [tr],
  );

  const [greenhouses, setGreenhouses] = useState<GreenhouseOption[]>([]);
  const [today, setToday] = useState<WateringItem[]>([]);
  const [week, setWeek] = useState<WateringItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    greenhouse_id: 0,
    watering_type: "капельный",
    date: ymd(new Date()),
    time: "08:00",
    duration_minutes: 25,
    volume_liters: 180,
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    try {
      const [gRes, tRes, wRes] = await Promise.all([
        fetch("/api/greenhouses", { cache: "no-store" }),
        fetch("/api/watering?range=today", { cache: "no-store" }),
        fetch("/api/watering?range=week", { cache: "no-store" }),
      ]);
      const g = (await gRes.json().catch(() => null)) as null | { ok: boolean; greenhouses: any[] };
      const t = (await tRes.json().catch(() => null)) as null | { ok: boolean; items: WateringItem[] };
      const w = (await wRes.json().catch(() => null)) as null | { ok: boolean; items: WateringItem[] };
      if (g?.ok) {
        const opts = (g.greenhouses as any[]).map((x) => ({ id: x.id, name: x.name })) as GreenhouseOption[];
        setGreenhouses(opts);
        setForm((v) => ({ ...v, greenhouse_id: v.greenhouse_id || opts[0]?.id || 0 }));
      }
      if (t?.ok) setToday(t.items);
      if (w?.ok) setWeek(w.items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const timeline = useMemo(() => {
    return [...today].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  }, [today]);

  const weekDays = useMemo(() => {
    const base = startOfDay(new Date());
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, []);

  const weekByDay = useMemo(() => {
    const map = new Map<string, WateringItem[]>();
    for (const d of weekDays) map.set(ymd(d), []);
    for (const it of week) {
      const key = it.scheduled_at.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    for (const [k, arr] of map) arr.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
    return map;
  }, [week, weekDays]);

  async function markDone(id: number, done: boolean) {
    await fetch("/api/watering", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, is_done: done ? 1 : 0 }),
    }).catch(() => null);
    await loadAll();
  }

  async function remove(id: number) {
    if (!confirm(tr("watering.confirmDelete"))) return;
    const res = await fetch(`/api/watering?id=${id}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      alert(data.error || tr("error.deleteFailed"));
      return;
    }
    await loadAll();
  }

  async function add() {
    setError(null);
    const parsed = FormSchema.safeParse({
      ...form,
      duration_minutes: Number(form.duration_minutes),
      volume_liters: Number(form.volume_liters),
      notes: form.notes?.trim() ? form.notes : null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? tr("error.checkFields"));
      return;
    }

    const scheduled_at = `${parsed.data.date} ${parsed.data.time}:00`;
    setSaving(true);
    try {
      const res = await fetch("/api/watering", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          greenhouse_id: parsed.data.greenhouse_id,
          watering_type: parsed.data.watering_type,
          scheduled_at,
          duration_minutes: parsed.data.duration_minutes,
          volume_liters: parsed.data.volume_liters,
          notes: parsed.data.notes ?? null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || tr("error.createFailed"));
        return;
      }
      setForm((v) => ({ ...v, notes: "" }));
      await loadAll();
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
            <div className="text-xl font-semibold">{tr("watering.title")}</div>
            <div className="text-sm text-[var(--muted)] mt-1">
              {tr("watering.subtitle")}
            </div>
          </div>
          <div className="text-xs text-[var(--muted)]">
            {loading ? tr("common.loading") : `${tr("watering.scheduledToday")}: ${timeline.length}`}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="xl:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]">
          <div className="p-5 border-b border-[var(--border)]">
            <div className="font-semibold">{tr("watering.timeline.title")}</div>
            <div className="text-sm text-[var(--muted)] mt-1">{tr("watering.timeline.subtitle")}</div>
          </div>

          <div className="p-5">
            {timeline.length ? (
              <div className="space-y-3">
                {timeline.map((it) => (
                  <div key={it.id} className="flex gap-4">
                    <div className="w-16 text-right">
                      <div className="text-sm font-semibold">{formatTime(it.scheduled_at)}</div>
                      <div className="text-[10px] text-[var(--muted)]">{it.duration_minutes} мин</div>
                    </div>

                    <div className="relative">
                      <div className="absolute left-2 top-0 bottom-0 w-px bg-[var(--border)]" />
                      <div
                        className={[
                          "mt-1 size-4 rounded-full border border-[var(--border)]",
                          it.is_done ? "bg-emerald-400" : "bg-[color:var(--accent)]/30",
                        ].join(" ")}
                      />
                    </div>

                    <div className="flex-1 rounded-2xl border border-[var(--border)] bg-black/10 p-4 hover:bg-white/5 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{it.greenhouse_name}</div>
                          <div className="text-xs text-[var(--muted)] mt-1">
                            {it.watering_type} · {it.volume_liters} л
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={[
                              "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                              statusBadge(it.is_done),
                            ].join(" ")}
                          >
                            {it.is_done ? tr("watering.status.done") : tr("watering.status.planned")}
                          </span>

                          {role === "operator" || role === "admin" ? (
                            <RippleButton
                              onClick={() => markDone(it.id, !it.is_done)}
                              variant="outline"
                              className="px-3 py-2"
                              title={tr("watering.markDone")}
                            >
                              {it.is_done ? "↺" : "✓"}
                            </RippleButton>
                          ) : null}

                          {canEdit(role) ? (
                            <button
                              onClick={() => alert("Редактирование полива добавлю в следующем блоке (UI-форма).")}
                              className="rounded-xl px-3 py-2 border border-[var(--border)] bg-black/20 hover:bg-white/5 transition"
                              title="Редактировать"
                            >
                              ✎
                            </button>
                          ) : null}

                          {canEdit(role) ? (
                            <RippleButton
                              onClick={() => remove(it.id)}
                              variant="danger"
                              className="px-3 py-2"
                              title="Удалить"
                            >
                              🗑
                            </RippleButton>
                          ) : null}
                        </div>
                      </div>

                      {it.notes ? <div className="mt-3 text-sm text-[var(--muted)]">{it.notes}</div> : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-[var(--muted)]">{tr("watering.timeline.none")}</div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]">
          <div className="p-5 border-b border-[var(--border)]">
            <div className="font-semibold">{tr("watering.add.title")}</div>
            <div className="text-sm text-[var(--muted)] mt-1">
              {canCreate(role) ? tr("watering.add.subtitleAllowed") : tr("watering.add.subtitleDenied")}
            </div>
          </div>
          <div className="p-5 space-y-3">
            <div className="space-y-2">
              <label className="text-sm text-[var(--muted)]">{tr("watering.field.greenhouse")}</label>
              <select
                value={form.greenhouse_id}
                onChange={(e) => setForm((v) => ({ ...v, greenhouse_id: Number(e.target.value) }))}
                className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
                disabled={!canCreate(role)}
              >
                {greenhouses.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--muted)]">{tr("watering.field.type")}</label>
              <input
                value={form.watering_type}
                onChange={(e) => setForm((v) => ({ ...v, watering_type: e.target.value }))}
                className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
                disabled={!canCreate(role)}
                placeholder="капельный / дождевание / ручной"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm text-[var(--muted)]">{tr("watering.field.date")}</label>
                <input
                  value={form.date}
                  onChange={(e) => setForm((v) => ({ ...v, date: e.target.value }))}
                  className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
                  disabled={!canCreate(role)}
                  placeholder="YYYY-MM-DD"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[var(--muted)]">{tr("watering.field.time")}</label>
                <input
                  value={form.time}
                  onChange={(e) => setForm((v) => ({ ...v, time: e.target.value }))}
                  className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
                  disabled={!canCreate(role)}
                  placeholder="HH:MM"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm text-[var(--muted)]">{tr("watering.field.duration")}</label>
                <input
                  type="number"
                  value={form.duration_minutes}
                  onChange={(e) => setForm((v) => ({ ...v, duration_minutes: Number(e.target.value) }))}
                  className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
                  disabled={!canCreate(role)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[var(--muted)]">{tr("watering.field.volume")}</label>
                <input
                  type="number"
                  value={form.volume_liters}
                  onChange={(e) => setForm((v) => ({ ...v, volume_liters: Number(e.target.value) }))}
                  className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
                  disabled={!canCreate(role)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--muted)]">{tr("watering.field.notes")}</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((v) => ({ ...v, notes: e.target.value }))}
                className="w-full min-h-24 rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
                disabled={!canCreate(role)}
                placeholder="Опционально"
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <RippleButton
              onClick={add}
              disabled={!canCreate(role) || saving}
              className="w-full"
            >
              {saving ? tr("watering.add.adding") : tr("watering.add.add")}
            </RippleButton>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]">
        <div className="p-5 border-b border-[var(--border)]">
          <div className="font-semibold">{tr("watering.week.title")}</div>
          <div className="text-sm text-[var(--muted)] mt-1">{tr("watering.week.subtitle")}</div>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {weekDays.map((d) => {
            const key = ymd(d);
            const items = weekByDay.get(key) ?? [];
            const done = items.filter((x) => x.is_done).length;
            return (
              <div key={key} className="rounded-2xl border border-[var(--border)] bg-black/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold">{dayLabel(d)}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {done}/{items.length}
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {items.length ? (
                    items.slice(0, 4).map((it) => (
                      <div key={it.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-[var(--muted)]">
                          {formatTime(it.scheduled_at)} · {it.greenhouse_name}
                        </span>
                        <span className={["rounded-full border px-2 py-0.5", statusBadge(it.is_done)].join(" ")}>
                          {it.is_done ? "✓" : "•"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-[var(--muted)]">{tr("watering.week.none")}</div>
                  )}
                  {items.length > 4 ? (
                    <div className="text-xs text-[var(--muted)]">
                      {tr("watering.week.more")} {items.length - 4}…
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

