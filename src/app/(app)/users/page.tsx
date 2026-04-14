"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import RippleButton from "@/components/ui/RippleButton";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useI18n } from "@/components/i18n/I18nContext";

type UserRole = "admin" | "agronomist" | "operator" | "viewer";

type UserRow = {
  id: number;
  full_name: string;
  login: string;
  role: UserRole;
  employee_id: number | null;
  employee_name: string | null;
  is_active: number;
  last_login: string | null;
  created_at: string;
};

type EmployeeOption = { id: number; full_name: string; position: string };

type LogRow = {
  id: number;
  action: string;
  entity: string;
  entity_id: number | null;
  details: string | null;
  created_at: string;
  user_full_name: string;
  user_login: string;
  user_role: UserRole;
};

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "П";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

function toneByRole(role: UserRole) {
  if (role === "admin") return "danger" as const;
  if (role === "agronomist") return "success" as const;
  if (role === "operator") return "info" as const;
  return "neutral" as const;
}

function toneByActive(active: number) {
  return active ? ("success" as const) : ("warning" as const);
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

export default function UsersPage() {
  const { t: tr } = useI18n();
  const CreateSchema = useMemo(
    () =>
      z.object({
        full_name: z.string().min(3, tr("val.enterFullName")),
        login: z.string().min(3, tr("val.enterLogin")),
        password: z.string().min(6, tr("val.passwordMin")),
        role: z.enum(["admin", "agronomist", "operator", "viewer"]),
        employee_id: z.number().int().nullable(),
      }),
    [tr],
  );

  const UpdateSchema = useMemo(
    () =>
      z.object({
        id: z.number().int().positive(),
        full_name: z.string().min(3, tr("val.enterFullName")),
        login: z.string().min(3, tr("val.enterLogin")),
        password: z.string().optional().nullable(),
        role: z.enum(["admin", "agronomist", "operator", "viewer"]),
        employee_id: z.number().int().nullable(),
        is_active: z.number().int().min(0).max(1),
      }),
    [tr],
  );

  const [users, setUsers] = useState<UserRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: "",
    login: "",
    password: "",
    role: "viewer" as UserRole,
    employee_id: "" as "" | number,
    is_active: 1,
  });

  async function loadAll() {
    setLoading(true);
    try {
      const [uRes, eRes, lRes] = await Promise.all([
        fetch("/api/users", { cache: "no-store" }),
        fetch("/api/employees", { cache: "no-store" }),
        fetch("/api/users/logs", { cache: "no-store" }),
      ]);
      const u = (await uRes.json().catch(() => null)) as null | { ok: boolean; users: UserRow[] };
      const e = (await eRes.json().catch(() => null)) as null | { ok: boolean; employees: EmployeeOption[] };
      const l = (await lRes.json().catch(() => null)) as null | { ok: boolean; logs: LogRow[] };
      if (u?.ok) setUsers(u.users);
      if (e?.ok) setEmployees(e.employees);
      if (l?.ok) setLogs(l.logs);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const sorted = useMemo(() => [...users].sort((a, b) => a.id - b.id), [users]);

  function openCreate() {
    setEditing(null);
    setError(null);
    setForm({
      full_name: "",
      login: "",
      password: "",
      role: "viewer",
      employee_id: "",
      is_active: 1,
    });
    setModalOpen(true);
  }

  function openEdit(u: UserRow) {
    setEditing(u);
    setError(null);
    setForm({
      full_name: u.full_name,
      login: u.login,
      password: "",
      role: u.role,
      employee_id: u.employee_id ?? "",
      is_active: u.is_active,
    });
    setModalOpen(true);
  }

  async function save() {
    setError(null);
    if (!editing) {
      const parsed = CreateSchema.safeParse({
        full_name: form.full_name,
        login: form.login,
        password: form.password,
        role: form.role,
        employee_id: form.employee_id === "" ? null : Number(form.employee_id),
      });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? tr("error.checkFields"));
        return;
      }
      setSaving(true);
      try {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (!res.ok || !data.ok) {
          setError(data.error || tr("error.createFailed"));
          return;
        }
        setModalOpen(false);
        await loadAll();
      } catch {
        setError(tr("error.network"));
      } finally {
        setSaving(false);
      }
      return;
    }

    const parsed = UpdateSchema.safeParse({
      id: editing.id,
      full_name: form.full_name,
      login: form.login,
      password: form.password?.trim() ? form.password : null,
      role: form.role,
      employee_id: form.employee_id === "" ? null : Number(form.employee_id),
      is_active: form.is_active,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? tr("error.checkFields"));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || tr("error.saveFailed"));
        return;
      }
      setModalOpen(false);
      await loadAll();
    } catch {
      setError(tr("error.network"));
    } finally {
      setSaving(false);
    }
  }

  async function toggleBlock(u: UserRow) {
    const next = u.is_active ? 0 : 1;
    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: u.id, is_active: next }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      alert(data.error || tr("error.saveFailed"));
      return;
    }
    await loadAll();
  }

  async function remove(u: UserRow) {
    if (!confirm(`${tr("users.confirmDelete")} ${u.login}?`)) return;
    const res = await fetch(`/api/users?id=${u.id}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      alert(data.error || tr("error.deleteFailed"));
      return;
    }
    await loadAll();
  }

  return (
    <main className="space-y-4">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold">{tr("users.title")}</div>
            <div className="text-sm text-[var(--muted)] mt-1">
              {tr("users.subtitle")}
            </div>
          </div>
          <RippleButton onClick={openCreate} className="px-4 py-2.5">
            {tr("users.create")}
          </RippleButton>
        </div>
      </Card>

      <Card as="section" className="overflow-auto">
        <table className="w-full text-sm fg-table-stagger">
          <thead className="text-left text-[var(--muted)]">
            <tr className="border-b border-[var(--border)]">
              <th className="p-4">{tr("users.table.user")}</th>
              <th className="p-4">{tr("users.table.login")}</th>
              <th className="p-4">{tr("users.table.role")}</th>
              <th className="p-4">{tr("users.table.lastLogin")}</th>
              <th className="p-4">{tr("users.table.status")}</th>
              <th className="p-4 text-right">{tr("users.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((u) => (
              <tr key={u.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-white/5 transition">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl grid place-items-center bg-black/20 border border-[var(--border)] text-xs font-semibold">
                      {initials(u.full_name)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{u.full_name}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {u.employee_name ? `${tr("users.employee")}: ${u.employee_name}` : tr("users.employeeNone")}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-[var(--muted)]">{u.login}</td>
                <td className="p-4">
                  <Badge tone={toneByRole(u.role)}>
                    {u.role === "admin"
                      ? tr("users.role.admin")
                      : u.role === "agronomist"
                        ? tr("users.role.agronomist")
                        : u.role === "operator"
                          ? tr("users.role.operator")
                          : tr("users.role.viewer")}
                  </Badge>
                </td>
                <td className="p-4 text-[var(--muted)]">{u.last_login ?? "—"}</td>
                <td className="p-4">
                  <Badge tone={toneByActive(u.is_active)}>
                    {u.is_active ? tr("users.status.active") : tr("users.status.blocked")}
                  </Badge>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                    <RippleButton onClick={() => openEdit(u)} variant="outline" className="px-3 py-2">
                      {tr("common.edit")}
                    </RippleButton>
                    <RippleButton onClick={() => toggleBlock(u)} variant="outline" className="px-3 py-2">
                      {u.is_active ? tr("users.actions.block") : tr("users.actions.unblock")}
                    </RippleButton>
                    <RippleButton onClick={() => remove(u)} variant="danger" className="px-3 py-2">
                      {tr("common.delete")}
                    </RippleButton>
                  </div>
                </td>
              </tr>
            ))}
            {!sorted.length ? (
              <tr>
                <td className="p-6 text-[var(--muted)]" colSpan={6}>
                  {loading ? tr("common.loading") : tr("users.none")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>

      <Card as="section">
        <div className="p-5 border-b border-[var(--border)]">
          <div className="font-semibold">{tr("users.logs.title")}</div>
          <div className="text-sm text-[var(--muted)] mt-1">{tr("users.logs.subtitle")}</div>
        </div>
        <div className="p-5 space-y-3">
          {logs.map((l) => (
            <div key={l.id} className="rounded-2xl border border-[var(--border)] bg-black/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {l.user_full_name} ({l.user_login})
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-1">
                    {l.action} · {l.entity}
                    {l.entity_id != null ? ` #${l.entity_id}` : ""}
                  </div>
                </div>
                <div className="text-xs text-[var(--muted)]">{l.created_at}</div>
              </div>
              {l.details ? <div className="mt-2 text-sm text-[var(--muted)]">{l.details}</div> : null}
            </div>
          ))}
          {!logs.length ? <div className="text-sm text-[var(--muted)]">{tr("users.logs.empty")}</div> : null}
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => {
          if (!saving) setModalOpen(false);
        }}
        title={editing ? tr("users.modal.editTitle") : tr("users.modal.createTitle")}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm text-[var(--muted)]">{tr("users.field.fullName")}</label>
            <input
              value={form.full_name}
              onChange={(e) => setForm((v) => ({ ...v, full_name: e.target.value }))}
              className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[var(--muted)]">{tr("users.field.login")}</label>
            <input
              value={form.login}
              onChange={(e) => setForm((v) => ({ ...v, login: e.target.value }))}
              className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[var(--muted)]">
              {tr("users.field.password")} {editing ? tr("users.field.passwordHintEdit") : ""}
            </label>
            <input
              value={form.password}
              onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))}
              className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
              placeholder={editing ? "" : tr("users.field.passwordHintCreate")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[var(--muted)]">{tr("users.field.role")}</label>
            <select
              value={form.role}
              onChange={(e) => setForm((v) => ({ ...v, role: e.target.value as UserRole }))}
              className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
            >
              <option value="admin">{tr("users.role.admin")}</option>
              <option value="agronomist">{tr("users.role.agronomist")}</option>
              <option value="operator">{tr("users.role.operator")}</option>
              <option value="viewer">{tr("users.role.viewer")}</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[var(--muted)]">{tr("users.field.employeeLink")}</label>
            <select
              value={form.employee_id}
              onChange={(e) => setForm((v) => ({ ...v, employee_id: e.target.value === "" ? "" : Number(e.target.value) }))}
              className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
            >
              <option value="">{tr("users.field.employeeLinkNone")}</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name} · {e.position}
                </option>
              ))}
            </select>
          </div>

          {editing ? (
            <div className="space-y-2">
              <label className="text-sm text-[var(--muted)]">{tr("users.field.status")}</label>
              <select
                value={form.is_active}
                onChange={(e) => setForm((v) => ({ ...v, is_active: Number(e.target.value) }))}
                className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
              >
                <option value={1}>{tr("users.status.active")}</option>
                <option value={0}>{tr("users.status.blocked")}</option>
              </select>
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-3">
          <RippleButton onClick={() => setModalOpen(false)} disabled={saving} variant="outline" className="px-4 py-2.5">
            {tr("common.cancel")}
          </RippleButton>
          <RippleButton onClick={save} disabled={saving} className="px-4 py-2.5">
            {saving ? tr("common.saving") : tr("common.save")}
          </RippleButton>
        </div>
      </Modal>
    </main>
  );
}

