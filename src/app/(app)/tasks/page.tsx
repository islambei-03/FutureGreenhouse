"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useMe } from "@/components/auth/AuthContext";
import type { UserRole } from "@/lib/auth";
import RippleButton from "@/components/ui/RippleButton";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useI18n } from "@/components/i18n/I18nContext";

type TaskRow = {
  id: number;
  title: string;
  description: string | null;
  assigned_to: number | null;
  assigned_name: string | null;
  greenhouse_id: number | null;
  greenhouse_name: string | null;
  priority: "обычный" | "высокий" | "срочный";
  deadline: string | null;
  is_completed: number;
  created_at: string;
};

type EmployeeRow = { id: number; full_name: string; position: string; greenhouse_id: number | null };
type GreenhouseOption = { id: number; name: string };

type FilterKey = "all" | "active" | "done" | "urgent";

function canCreate(role: UserRole) {
  return role === "admin" || role === "agronomist";
}

function toneByPriority(p: TaskRow["priority"]) {
  if (p === "срочный") return "danger" as const;
  if (p === "высокий") return "warning" as const;
  return "info" as const;
}

function priorityKey(p: TaskRow["priority"]) {
  if (p === "срочный") return "enum.taskPriority.urgent" as const;
  if (p === "высокий") return "enum.taskPriority.high" as const;
  return "enum.taskPriority.normal" as const;
}

export default function TasksPage() {
  const me = useMe();
  const role: UserRole = me?.role ?? "viewer";
  const { t: tr } = useI18n();

  const CreateSchema = useMemo(
    () =>
      z.object({
        title: z.string().min(2, tr("val.enterTitle")),
        description: z.string().optional().nullable(),
        assigned_to: z.number().int().nullable(),
        greenhouse_id: z.number().int().nullable(),
        priority: z.enum(["обычный", "высокий", "срочный"]),
        deadline: z.string().optional().nullable(),
      }),
    [tr],
  );

  const [items, setItems] = useState<TaskRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [greenhouses, setGreenhouses] = useState<GreenhouseOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<FilterKey>("all");
  const [q, setQ] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    assigned_to: "" as "" | number,
    greenhouse_id: "" as "" | number,
    priority: "обычный" as TaskRow["priority"],
    deadline: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [tRes, eRes, gRes] = await Promise.all([
        fetch("/api/tasks", { cache: "no-store" }),
        fetch("/api/employees", { cache: "no-store" }),
        fetch("/api/greenhouses", { cache: "no-store" }),
      ]);
      const t = (await tRes.json().catch(() => null)) as null | { ok: boolean; tasks: TaskRow[] };
      const e = (await eRes.json().catch(() => null)) as null | { ok: boolean; employees: EmployeeRow[] };
      const g = (await gRes.json().catch(() => null)) as null | { ok: boolean; greenhouses: any[] };
      if (t?.ok) setItems(t.tasks);
      if (e?.ok) setEmployees(e.employees);
      if (g?.ok) setGreenhouses((g.greenhouses as any[]).map((x) => ({ id: x.id, name: x.name })));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return items.filter((t) => {
      if (filter === "active" && t.is_completed) return false;
      if (filter === "done" && !t.is_completed) return false;
      if (filter === "urgent" && t.priority !== "срочный") return false;
      if (qq) {
        const hay = `${t.title} ${(t.description ?? "")} ${(t.greenhouse_name ?? "")} ${(t.assigned_name ?? "")}`.toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      return true;
    });
  }, [items, filter, q]);

  const counts = useMemo(() => {
    const all = items.length;
    const active = items.filter((i) => !i.is_completed).length;
    const done = items.filter((i) => !!i.is_completed).length;
    const urgent = items.filter((i) => i.priority === "срочный" && !i.is_completed).length;
    return { all, active, done, urgent };
  }, [items]);

  async function toggleDone(id: number, done: boolean) {
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, is_completed: done ? 1 : 0 }),
    }).catch(() => null);
    await load();
  }

  async function create() {
    setError(null);
    const parsed = CreateSchema.safeParse({
      title: form.title,
      description: form.description?.trim() ? form.description : null,
      assigned_to: form.assigned_to === "" ? null : Number(form.assigned_to),
      greenhouse_id: form.greenhouse_id === "" ? null : Number(form.greenhouse_id),
      priority: form.priority,
      deadline: form.deadline?.trim() ? form.deadline : null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? tr("error.checkFields"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || tr("error.createFailed"));
        return;
      }
      setForm({
        title: "",
        description: "",
        assigned_to: "",
        greenhouse_id: "",
        priority: "обычный",
        deadline: "",
      });
      await load();
    } catch {
      setError(tr("error.network"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="space-y-4">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold">{tr("tasks.title")}</div>
            <div className="text-sm text-[var(--muted)] mt-1">
              {tr("tasks.subtitle")}
            </div>
          </div>
          <div className="text-xs text-[var(--muted)]">
            {loading ? tr("common.loading") : `${tr("tasks.total")}: ${items.length}`}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="xl:col-span-2 space-y-4">
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2">
                {([
                  ["all", tr("tasks.filters.all"), counts.all],
                  ["active", tr("tasks.filters.active"), counts.active],
                  ["done", tr("tasks.filters.done"), counts.done],
                  ["urgent", tr("tasks.filters.urgent"), counts.urgent],
                ] as const).map(([k, label, count]) => (
                  <button
                    key={k}
                    onClick={() => setFilter(k)}
                    className={[
                      "rounded-xl px-3 py-2 text-sm border transition",
                      filter === k
                        ? "border-[color:var(--accent)]/30 bg-[color:var(--accent)]/10"
                        : "border-[var(--border)] bg-black/10 hover:bg-white/5",
                    ].join(" ")}
                  >
                    {label}{" "}
                    <span className="ml-2 text-xs text-[var(--muted)]">{count}</span>
                  </button>
                ))}
              </div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={tr("tasks.searchPlaceholder")}
                className="md:w-72 rounded-xl bg-black/20 border border-[var(--border)] px-4 py-2.5 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
              />
            </div>
          </Card>

          <div className="space-y-3">
            {loading && !items.length ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-6">
                <div className="h-4 w-40 rounded-lg fg-skeleton" />
                <div className="mt-4 space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-2xl fg-skeleton" />
                  ))}
                </div>
              </div>
            ) : null}

            {filtered.map((t) => (
              <Card key={t.id} className="p-4 hover:bg-white/5 transition">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={!!t.is_completed}
                    onChange={(e) => toggleDone(t.id, e.target.checked)}
                    className="mt-1 accent-[color:var(--accent)]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className={t.is_completed ? "line-through text-[var(--muted)]" : "font-semibold"}>
                        {t.title}
                      </div>
                      <Badge tone={toneByPriority(t.priority)}>{tr(priorityKey(t.priority))}</Badge>
                    </div>
                    {t.description ? (
                      <div className="mt-2 text-sm text-[var(--muted)]">{t.description}</div>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                      <span className="rounded-full border border-[var(--border)] bg-black/10 px-2.5 py-1">
                        {tr("tasks.assignee")}:{" "}
                        <span className="text-[var(--text)]">{t.assigned_name ?? tr("tasks.assigneeNotAssigned")}</span>
                      </span>
                      <span className="rounded-full border border-[var(--border)] bg-black/10 px-2.5 py-1">
                        {tr("tasks.greenhouse")}:{" "}
                        <span className="text-[var(--text)]">{t.greenhouse_name ?? "—"}</span>
                      </span>
                      <span className="rounded-full border border-[var(--border)] bg-black/10 px-2.5 py-1">
                        {tr("tasks.deadline")}: <span className="text-[var(--text)]">{t.deadline ?? "—"}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {!filtered.length ? (
              <Card className="p-6 text-sm text-[var(--muted)]">
                {loading ? tr("common.loading") : tr("tasks.noneByFilter")}
              </Card>
            ) : null}
          </div>
        </section>

        <Card as="section">
          <div className="p-5 border-b border-[var(--border)]">
            <div className="font-semibold">{tr("tasks.create.title")}</div>
            <div className="text-sm text-[var(--muted)] mt-1">
              {canCreate(role) ? tr("tasks.create.subtitleAllowed") : tr("tasks.create.subtitleDenied")}
            </div>
          </div>
          <div className="p-5 space-y-3">
            <div className="space-y-2">
              <label className="text-sm text-[var(--muted)]">{tr("tasks.field.title")}</label>
              <input
                value={form.title}
                onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))}
                className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
                disabled={!canCreate(role)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--muted)]">{tr("tasks.field.description")}</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))}
                className="w-full min-h-24 rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
                disabled={!canCreate(role)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm text-[var(--muted)]">{tr("tasks.field.assignee")}</label>
                <select
                  value={form.assigned_to}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, assigned_to: e.target.value === "" ? "" : Number(e.target.value) }))
                  }
                  className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
                  disabled={!canCreate(role)}
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
                <label className="text-sm text-[var(--muted)]">{tr("tasks.field.greenhouse")}</label>
                <select
                  value={form.greenhouse_id}
                  onChange={(e) =>
                    setForm((v) => ({ ...v, greenhouse_id: e.target.value === "" ? "" : Number(e.target.value) }))
                  }
                  className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
                  disabled={!canCreate(role)}
                >
                  <option value="">— не выбрана —</option>
                  {greenhouses.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm text-[var(--muted)]">{tr("tasks.field.priority")}</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((v) => ({ ...v, priority: e.target.value as any }))}
                  className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
                  disabled={!canCreate(role)}
                >
                  <option value="обычный">{tr("tasks.priority.normal")}</option>
                  <option value="высокий">{tr("tasks.priority.high")}</option>
                  <option value="срочный">{tr("tasks.priority.urgent")}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-[var(--muted)]">{tr("tasks.field.deadline")}</label>
                <input
                  value={form.deadline}
                  onChange={(e) => setForm((v) => ({ ...v, deadline: e.target.value }))}
                  className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
                  disabled={!canCreate(role)}
                  placeholder="YYYY-MM-DD HH:MM:SS"
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <RippleButton
              onClick={create}
              disabled={!canCreate(role) || saving}
              className="w-full"
            >
              {saving ? tr("tasks.create.creating") : tr("tasks.create.create")}
            </RippleButton>
          </div>
        </Card>
      </div>
    </main>
  );
}

