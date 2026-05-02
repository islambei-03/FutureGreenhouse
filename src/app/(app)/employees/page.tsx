"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useMe } from "@/components/auth/AuthContext";
import type { UserRole } from "@/lib/auth";
import RippleButton from "@/components/ui/RippleButton";
import { useI18n } from "@/components/i18n/I18nContext";

type EmployeeStatus = "на смене" | "перерыв" | "больничный" | "выходной";

type EmployeeRow = {
  id: number;
  full_name: string;
  position: string;
  greenhouse_id: number | null;
  greenhouse_name: string | null;
  phone: string | null;
  status: EmployeeStatus;
  notes: string | null;
  task_count: number;
};

type GreenhouseOption = { id: number; name: string };

function canCrud(role: UserRole) {
  return role === "admin";
}

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "П";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

function statusBadge(status: EmployeeStatus) {
  if (status === "на смене") return "border-emerald-500/30 bg-emerald-500/15 text-emerald-200";
  if (status === "перерыв") return "border-yellow-400/30 bg-yellow-400/15 text-yellow-100";
  if (status === "больничный") return "border-red-500/30 bg-red-500/15 text-red-200";
  return "border-zinc-500/30 bg-zinc-500/15 text-zinc-200";
}

function statusKey(status: EmployeeStatus) {
  if (status === "на смене") return "enum.employeeStatus.onShift" as const;
  if (status === "перерыв") return "enum.employeeStatus.break" as const;
  if (status === "больничный") return "enum.employeeStatus.sick" as const;
  return "enum.employeeStatus.dayOff" as const;
}

function Modal({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center px-4">
        <div className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] animate-modalIn">
          <div className="p-5 border-b border-[var(--border)] flex items-center justify-between gap-3">
            <div className="font-semibold">{title}</div>
            <button
              onClick={onClose}
              className="size-10 grid place-items-center rounded-xl border border-[var(--border)] bg-black/20 hover:bg-white/5 transition"
            >
              ✕
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  const me = useMe();
  const role: UserRole = me?.role ?? "director";
  const { t: tr } = useI18n();

  const FormSchema = useMemo(
    () =>
      z.object({
        full_name: z.string().min(3, tr("val.enterFullName")),
        position: z.string().min(2, tr("val.enterPosition")),
        greenhouse_id: z.number().int().nullable(),
        phone: z.string().optional().nullable(),
        status: z.enum(["на смене", "перерыв", "больничный", "выходной"]),
        notes: z.string().optional().nullable(),
      }),
    [tr],
  );

  const [items, setItems] = useState<EmployeeRow[]>([]);
  const [greenhouses, setGreenhouses] = useState<GreenhouseOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<EmployeeStatus | "all">("all");
  const [q, setQ] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeRow | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    position: "",
    greenhouse_id: "" as "" | number,
    phone: "",
    status: "на смене" as EmployeeStatus,
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [eRes, gRes] = await Promise.all([
        fetch("/api/employees", { cache: "no-store" }),
        fetch("/api/greenhouses", { cache: "no-store" }),
      ]);
      const e = (await eRes.json().catch(() => null)) as null | { ok: boolean; employees: EmployeeRow[] };
      const g = (await gRes.json().catch(() => null)) as
        | null
        | { ok: true; greenhouses: Array<{ id: number; name: string }> }
        | { ok: false; error?: string };
      if (e?.ok) setItems(e.employees);
      if (g?.ok) setGreenhouses(g.greenhouses.map((x) => ({ id: x.id, name: x.name })));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return items.filter((e) => {
      if (filter !== "all" && e.status !== filter) return false;
      if (qq) {
        const hay = `${e.full_name} ${e.position} ${e.greenhouse_name ?? ""} ${e.phone ?? ""}`.toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      return true;
    });
  }, [items, filter, q]);

  function openCreate() {
    setEditing(null);
    setError(null);
    setForm({
      full_name: "",
      position: "",
      greenhouse_id: "",
      phone: "",
      status: "на смене",
      notes: "",
    });
    setModalOpen(true);
  }

  function openEdit(e: EmployeeRow) {
    setEditing(e);
    setError(null);
    setForm({
      full_name: e.full_name,
      position: e.position,
      greenhouse_id: e.greenhouse_id ?? "",
      phone: e.phone ?? "",
      status: e.status,
      notes: e.notes ?? "",
    });
    setModalOpen(true);
  }

  async function save() {
    setError(null);
    const parsed = FormSchema.safeParse({
      full_name: form.full_name,
      position: form.position,
      greenhouse_id: form.greenhouse_id === "" ? null : Number(form.greenhouse_id),
      phone: form.phone?.trim() ? form.phone : null,
      status: form.status,
      notes: form.notes?.trim() ? form.notes : null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? tr("error.checkFields"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/employees", {
        method: editing ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(editing ? { id: editing.id, ...parsed.data } : parsed.data),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || tr("error.saveFailed"));
        return;
      }
      setModalOpen(false);
      await load();
    } catch {
      setError(tr("error.network"));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm(tr("employees.confirmDelete"))) return;
    const res = await fetch(`/api/employees?id=${id}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      alert(data.error || tr("error.deleteFailed"));
      return;
    }
    await load();
  }

  return (
    <main className="space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold">{tr("employees.title")}</div>
            <div className="text-sm text-[var(--muted)] mt-1">
              {tr("employees.subtitle")}
            </div>
          </div>
          {canCrud(role) ? (
            <RippleButton onClick={openCreate} className="px-4 py-2.5">
              {tr("employees.add")}
            </RippleButton>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["all", "на смене", "перерыв", "больничный", "выходной"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={[
                  "rounded-xl px-3 py-2 text-sm border transition",
                  filter === s
                    ? "border-[color:var(--accent)]/30 bg-[color:var(--accent)]/10"
                    : "border-[var(--border)] bg-black/10 hover:bg-white/5",
                ].join(" ")}
              >
                {s === "all" ? tr("employees.filters.all") : tr(statusKey(s))}
              </button>
            ))}
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tr("employees.searchPlaceholder")}
            className="md:w-72 rounded-xl bg-black/20 border border-[var(--border)] px-4 py-2.5 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] overflow-auto">
        <table className="w-full text-sm fg-table-stagger">
          <thead className="text-left text-[var(--muted)]">
            <tr className="border-b border-[var(--border)]">
              <th className="p-4">{tr("employees.table.employee")}</th>
              <th className="p-4">{tr("employees.table.position")}</th>
              <th className="p-4">{tr("employees.table.greenhouse")}</th>
              <th className="p-4">{tr("employees.table.phone")}</th>
              <th className="p-4">{tr("employees.table.taskCount")}</th>
              <th className="p-4">{tr("employees.table.status")}</th>
              <th className="p-4 text-right">{tr("employees.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-white/5 transition">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl grid place-items-center bg-black/20 border border-[var(--border)] text-xs font-semibold">
                      {initials(e.full_name)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{e.full_name}</div>
                      <div className="text-xs text-[var(--muted)]">ID: {e.id}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-[var(--muted)]">{e.position}</td>
                <td className="p-4 text-[var(--muted)]">{e.greenhouse_name ?? "—"}</td>
                <td className="p-4 text-[var(--muted)]">{e.phone ?? "—"}</td>
                <td className="p-4">
                  <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-black/10 px-2.5 py-1 text-xs text-[var(--muted)]">
                    {e.task_count}
                  </span>
                </td>
                <td className="p-4">
                  <span className={["inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", statusBadge(e.status)].join(" ")}>
                    {tr(statusKey(e.status))}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    {canCrud(role) ? (
                      <>
                        <button
                          onClick={() => openEdit(e)}
                          className="rounded-xl px-3 py-2 border border-[var(--border)] bg-black/20 hover:bg-white/5 transition"
                        >
                          {tr("common.edit")}
                        </button>
                        <button
                          onClick={() => remove(e.id)}
                          className="rounded-xl px-3 py-2 border border-[var(--border)] bg-black/20 hover:bg-white/5 transition text-red-200"
                        >
                          {tr("common.delete")}
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-[var(--muted)]">{tr("common.viewOnly")}</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length ? (
              <tr>
                <td className="p-6 text-[var(--muted)]" colSpan={7}>
                  {loading ? tr("common.loading") : tr("employees.notFound")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => {
          if (!saving) setModalOpen(false);
        }}
        title={editing ? tr("employees.modal.editTitle") : tr("employees.modal.addTitle")}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm text-[var(--muted)]">{tr("employees.field.fullName")}</label>
            <input
              value={form.full_name}
              onChange={(e) => setForm((v) => ({ ...v, full_name: e.target.value }))}
              className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
              disabled={!canCrud(role)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[var(--muted)]">{tr("employees.field.position")}</label>
            <input
              value={form.position}
              onChange={(e) => setForm((v) => ({ ...v, position: e.target.value }))}
              className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
              disabled={!canCrud(role)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[var(--muted)]">{tr("employees.field.greenhouse")}</label>
            <select
              value={form.greenhouse_id}
              onChange={(e) =>
                setForm((v) => ({ ...v, greenhouse_id: e.target.value === "" ? "" : Number(e.target.value) }))
              }
              className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
              disabled={!canCrud(role)}
            >
              <option value="">— не привязана —</option>
              {greenhouses.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[var(--muted)]">{tr("employees.field.phone")}</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((v) => ({ ...v, phone: e.target.value }))}
              className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
              disabled={!canCrud(role)}
              placeholder="+7 701 000 00 00"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[var(--muted)]">{tr("employees.field.status")}</label>
            <select
              value={form.status}
              onChange={(e) => setForm((v) => ({ ...v, status: e.target.value as EmployeeStatus }))}
              className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
              disabled={!canCrud(role)}
            >
              <option value="на смене">{tr("employees.status.onShift")}</option>
              <option value="перерыв">{tr("employees.status.break")}</option>
              <option value="больничный">{tr("employees.status.sick")}</option>
              <option value="выходной">{tr("employees.status.dayOff")}</option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm text-[var(--muted)]">{tr("employees.field.notes")}</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((v) => ({ ...v, notes: e.target.value }))}
              className="w-full min-h-24 rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
              disabled={!canCrud(role)}
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
            {tr("common.cancel")}
          </RippleButton>
          <RippleButton
            onClick={save}
            disabled={saving || !canCrud(role)}
            className="px-4 py-2.5"
          >
            {saving ? tr("common.saving") : tr("common.save")}
          </RippleButton>
        </div>
      </Modal>
    </main>
  );
}

