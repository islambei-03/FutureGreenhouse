"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useMe } from "@/components/auth/AuthContext";
import type { UserRole } from "@/lib/auth";
import RippleButton from "@/components/ui/RippleButton";
import AppModal from "@/components/ui/AppModal";
import { useI18n } from "@/components/i18n/I18nContext";

type GreenhouseCard = {
  id: number;
  name: string;
  type: "стеклянная" | "поликарбонатная" | "плёночная";
  area: number;
  temp_min: number;
  temp_max: number;
  humidity_min: number;
  humidity_max: number;
  status: "активна" | "обслуживание" | "отключена";
  responsible_employee_id: number | null;
  responsible_name?: string | null;
  notes: string | null;
  temperature: number | null;
  humidity: number | null;
  co2: number | null;
  next_watering_at: string | null;
  cultures: string[];
};

type EmployeeRow = { id: number; full_name: string; position: string };

function canEdit(role: UserRole) {
  return role === "admin" || role === "agronomist";
}
function canDelete(role: UserRole) {
  return role === "admin";
}

function statusDot(status: GreenhouseCard["status"]) {
  if (status === "активна") return "bg-emerald-400";
  if (status === "обслуживание") return "bg-yellow-300";
  return "bg-red-400";
}

function statusKey(status: GreenhouseCard["status"]) {
  if (status === "активна") return "enum.greenhouseStatus.active" as const;
  if (status === "обслуживание") return "enum.greenhouseStatus.maintenance" as const;
  return "enum.greenhouseStatus.off" as const;
}

function metricBadge(value: number | null, min: number, max: number, suffix: string) {
  const base = "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium";
  if (value === null || Number.isNaN(value)) return <span className={`${base} border-zinc-500/30 bg-zinc-500/15 text-zinc-200`}>—</span>;
  const bad = value < min || value > max;
  const cls = bad
    ? "border-red-500/30 bg-red-500/15 text-red-200"
    : "border-emerald-500/30 bg-emerald-500/15 text-emerald-200";
  return (
    <span className={`${base} ${cls}`}>
      {value}
      {suffix}
    </span>
  );
}

function IconButton({ title, onClick, disabled, children }: { title: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      title={title}
      className="size-10 grid place-items-center rounded-xl border border-[var(--border)] bg-black/20 hover:bg-white/5 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

export default function GreenhousesPage() {
  const me = useMe();
  const role: UserRole = me?.role ?? "director";
  const { t } = useI18n();

  const FormSchema = useMemo(
    () =>
      z
        .object({
          name: z.string().min(2, t("val.enterName")),
          type: z.enum(["стеклянная", "поликарбонатная", "плёночная"]),
          area: z.number().positive(t("val.areaPositive")),
          temp_min: z.number(),
          temp_max: z.number(),
          humidity_min: z.number().min(0, t("val.humidityRange")).max(100, t("val.humidityRange")),
          humidity_max: z.number().min(0, t("val.humidityRange")).max(100, t("val.humidityRange")),
          responsible_employee_id: z.number().int().nullable(),
          notes: z.string().optional().nullable(),
          status: z.enum(["активна", "обслуживание", "отключена"]),
        })
        .refine((v) => v.temp_min < v.temp_max, { message: t("val.tempMinLessMax"), path: ["temp_max"] })
        .refine((v) => v.humidity_min < v.humidity_max, {
          message: t("val.humidityMinLessMax"),
          path: ["humidity_max"],
        }),
    [t],
  );

  const [items, setItems] = useState<GreenhouseCard[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GreenhouseCard | null>(null);

  const [form, setForm] = useState({
    name: "",
    type: "стеклянная" as GreenhouseCard["type"],
    area: 200,
    temp_min: 18,
    temp_max: 26,
    humidity_min: 50,
    humidity_max: 75,
    responsible_employee_id: null as number | null,
    notes: "",
    status: "активна" as GreenhouseCard["status"],
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [gRes, eRes] = await Promise.all([
        fetch("/api/greenhouses", { cache: "no-store" }),
        fetch("/api/employees", { cache: "no-store" }),
      ]);
      const g = (await gRes.json().catch(() => null)) as null | { ok: boolean; greenhouses: GreenhouseCard[] };
      const e = (await eRes.json().catch(() => null)) as null | { ok: boolean; employees: EmployeeRow[] };
      if (g?.ok) setItems(g.greenhouses);
      if (e?.ok) setEmployees(e.employees);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo(() => (items.length ? items : []), [items]);

  function openCreate() {
    setEditing(null);
    setError(null);
    setForm({
      name: "",
      type: "стеклянная",
      area: 200,
      temp_min: 18,
      temp_max: 26,
      humidity_min: 50,
      humidity_max: 75,
      responsible_employee_id: null,
      notes: "",
      status: "активна",
    });
    setModalOpen(true);
  }

  function openEdit(g: GreenhouseCard) {
    setEditing(g);
    setError(null);
    setForm({
      name: g.name,
      type: g.type,
      area: g.area,
      temp_min: g.temp_min,
      temp_max: g.temp_max,
      humidity_min: g.humidity_min,
      humidity_max: g.humidity_max,
      responsible_employee_id: g.responsible_employee_id ?? null,
      notes: g.notes ?? "",
      status: g.status,
    });
    setModalOpen(true);
  }

  async function save() {
    setError(null);
    const parsed = FormSchema.safeParse({
      ...form,
      notes: form.notes?.trim() ? form.notes : null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t("error.checkFields"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/greenhouses", {
        method: editing ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(editing ? { id: editing.id, ...parsed.data } : parsed.data),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || t("error.saveFailed"));
        return;
      }
      setModalOpen(false);
      await load();
    } catch {
      setError(t("error.network"));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm(t("greenhouses.confirmDelete"))) return;
    const res = await fetch(`/api/greenhouses?id=${id}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      alert(data.error || t("error.deleteFailed"));
      return;
    }
    await load();
  }

  return (
    <main className="min-w-0 max-w-full space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-xl font-semibold">{t("greenhouses.title")}</div>
            <div className="text-sm text-[var(--muted)] mt-1">
              {t("greenhouses.subtitle")}
            </div>
          </div>
          {canEdit(role) ? (
            <RippleButton onClick={openCreate} className="w-full shrink-0 px-4 py-2.5 sm:w-auto">
              {t("greenhouses.add")}
            </RippleButton>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-5">
              <div className="h-4 w-40 rounded-lg fg-skeleton" />
              <div className="mt-3 h-3 w-56 rounded-lg fg-skeleton" />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="h-20 rounded-xl fg-skeleton" />
                <div className="h-20 rounded-xl fg-skeleton" />
              </div>
              <div className="mt-3 h-16 rounded-xl fg-skeleton" />
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {columns.map((g) => (
          <div
            key={g.id}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-5 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(0,0,0,0.38)] transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`inline-block size-2.5 rounded-full ${statusDot(g.status)}`} />
                  <div className="font-semibold truncate">
                    #{g.id} · {g.name}
                  </div>
                </div>
                <div className="text-xs text-[var(--muted)] mt-1">
                  {t("greenhouses.type")}: <span className="text-[var(--text)]">{g.type}</span> · {t("greenhouses.area")}:{" "}
                  <span className="text-[var(--text)]">{g.area} м²</span>
                </div>
                <div className="text-xs text-[var(--muted)] mt-1">
                  {t("greenhouses.field.status")}:{" "}
                  <span className="text-[var(--text)]">{t(statusKey(g.status))}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canEdit(role) ? (
                  <IconButton title={t("common.edit")} onClick={() => openEdit(g)}>
                    ✎
                  </IconButton>
                ) : null}
                <IconButton title={t("nav.parameters")} onClick={() => (location.href = `/parameters?g=${g.id}`)}>
                  📈
                </IconButton>
                {canDelete(role) ? (
                  <IconButton title={t("common.delete")} onClick={() => remove(g.id)}>
                    🗑
                  </IconButton>
                ) : null}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[var(--border)] bg-black/10 p-3">
                <div className="text-xs text-[var(--muted)]">{t("greenhouses.temperature")}</div>
                <div className="mt-2">{metricBadge(g.temperature, g.temp_min, g.temp_max, "°C")}</div>
                <div className="mt-2 text-[10px] text-[var(--muted)]">
                  Норма: {g.temp_min}–{g.temp_max}°C
                </div>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-black/10 p-3">
                <div className="text-xs text-[var(--muted)]">{t("greenhouses.humidity")}</div>
                <div className="mt-2">{metricBadge(g.humidity, g.humidity_min, g.humidity_max, "%")}</div>
                <div className="mt-2 text-[10px] text-[var(--muted)]">
                  Норма: {g.humidity_min}–{g.humidity_max}%
                </div>
              </div>
            </div>

            <div className="mt-3 text-sm">
              <div className="flex items-center justify-between gap-3 text-[var(--muted)]">
                <span>{t("greenhouses.co2")}</span>
                <span className="text-[var(--text)] font-medium">{g.co2 ?? "—"}{typeof g.co2 === "number" ? " ppm" : ""}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-[var(--muted)]">
                <span>{t("greenhouses.nextWatering")}</span>
                <span className="text-[var(--text)] font-medium">{g.next_watering_at ?? "—"}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-[var(--muted)]">
                <span>{t("greenhouses.responsible")}</span>
                <span className="text-[var(--text)] font-medium">{g.responsible_name ?? "—"}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {g.cultures?.length ? (
                g.cultures.slice(0, 6).map((c, idx) => (
                  <span
                    key={`${g.id}-${idx}`}
                    className="text-xs rounded-full border border-[var(--border)] bg-black/10 px-2.5 py-1 text-[var(--muted)]"
                  >
                    {c}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[var(--muted)]">{t("greenhouses.culturesNone")}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <AppModal
        open={modalOpen}
        onClose={() => {
          if (!saving) setModalOpen(false);
        }}
        title={editing ? t("greenhouses.modal.editTitle") : t("greenhouses.modal.addTitle")}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm text-[var(--muted)]">{t("greenhouses.field.name")}</label>
            <input
              value={form.name}
              onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
              className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
              placeholder="Например: Теплица №7 — Розы"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[var(--muted)]">{t("greenhouses.field.type")}</label>
            <select
              value={form.type}
              onChange={(e) => setForm((v) => ({ ...v, type: e.target.value as GreenhouseCard["type"] }))}
              className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
            >
              <option value="стеклянная">{t("greenhouses.type.glass")}</option>
              <option value="поликарбонатная">{t("greenhouses.type.poly")}</option>
              <option value="плёночная">{t("greenhouses.type.film")}</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[var(--muted)]">{t("greenhouses.field.area")}</label>
            <input
              type="number"
              value={form.area}
              onChange={(e) => setForm((v) => ({ ...v, area: Number(e.target.value) }))}
              className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[var(--muted)]">{t("greenhouses.field.tempNorm")}</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={form.temp_min}
                onChange={(e) => setForm((v) => ({ ...v, temp_min: Number(e.target.value) }))}
                className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
              />
              <input
                type="number"
                value={form.temp_max}
                onChange={(e) => setForm((v) => ({ ...v, temp_max: Number(e.target.value) }))}
                className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[var(--muted)]">{t("greenhouses.field.humidityNorm")}</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={form.humidity_min}
                onChange={(e) => setForm((v) => ({ ...v, humidity_min: Number(e.target.value) }))}
                className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
              />
              <input
                type="number"
                value={form.humidity_max}
                onChange={(e) => setForm((v) => ({ ...v, humidity_max: Number(e.target.value) }))}
                className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[var(--muted)]">{t("greenhouses.field.responsible")}</label>
            <select
              value={form.responsible_employee_id ?? ""}
              onChange={(e) =>
                setForm((v) => ({ ...v, responsible_employee_id: e.target.value ? Number(e.target.value) : null }))
              }
              className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
            >
              <option value="">— не назначен —</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name} · {e.position}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[var(--muted)]">{t("greenhouses.field.status")}</label>
            <select
              value={form.status}
              onChange={(e) => setForm((v) => ({ ...v, status: e.target.value as GreenhouseCard["status"] }))}
              className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
            >
              <option value="активна">{t("greenhouses.status.active")}</option>
              <option value="обслуживание">{t("greenhouses.status.maintenance")}</option>
              <option value="отключена">{t("greenhouses.status.off")}</option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm text-[var(--muted)]">{t("greenhouses.field.notes")}</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((v) => ({ ...v, notes: e.target.value }))}
              className="w-full min-h-24 rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
              placeholder="Любые заметки по теплице"
            />
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-3">
          <RippleButton
            onClick={() => setModalOpen(false)}
            disabled={saving}
            variant="outline"
            className="px-4 py-2.5"
          >
            {t("common.cancel")}
          </RippleButton>
          <RippleButton
            onClick={save}
            disabled={saving}
            className="px-4 py-2.5"
          >
            {saving ? t("common.saving") : t("common.save")}
          </RippleButton>
        </div>
      </AppModal>
    </main>
  );
}

