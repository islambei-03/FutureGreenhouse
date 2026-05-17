"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useMe } from "@/components/auth/AuthContext";
import type { UserRole } from "@/lib/auth";
import RippleButton from "@/components/ui/RippleButton";
import AppModal from "@/components/ui/AppModal";
import TableScroll from "@/components/ui/TableScroll";
import { useI18n } from "@/components/i18n/I18nContext";
import { formatDisplayDate } from "@/lib/format";

type GreenhouseOption = { id: number; name: string };

type CultureRow = {
  id: number;
  name: string;
  greenhouse_id: number;
  greenhouse_name: string;
  section: string | null;
  planted_date: string | null;
  harvest_date: string | null;
  temp_norm: number | null;
  humidity_norm: number | null;
  stage: "Посев" | "Рост" | "Цветение" | "Плодоношение" | "Сбор урожая";
  notes: string | null;
};

const StageOrder: CultureRow["stage"][] = ["Посев", "Рост", "Цветение", "Плодоношение", "Сбор урожая"];
function stageProgress(stage: CultureRow["stage"]) {
  const idx = StageOrder.indexOf(stage);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / StageOrder.length) * 100);
}

function stageKey(stage: CultureRow["stage"]) {
  if (stage === "Посев") return "enum.cultureStage.sowing" as const;
  if (stage === "Рост") return "enum.cultureStage.growth" as const;
  if (stage === "Цветение") return "enum.cultureStage.flowering" as const;
  if (stage === "Плодоношение") return "enum.cultureStage.fruiting" as const;
  return "enum.cultureStage.harvest" as const;
}

function canCrud(role: UserRole) {
  return role === "admin" || role === "agronomist";
}

export default function CulturesPage() {
  const me = useMe();
  const role: UserRole = me?.role ?? "director";
  const { t: tr } = useI18n();

  const FormSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(2, tr("val.enterName")),
        greenhouse_id: z.number().int().positive(tr("val.selectGreenhouse")),
        section: z.string().optional().nullable(),
        planted_date: z.string().optional().nullable(),
        harvest_date: z.string().optional().nullable(),
        temp_norm: z.number().optional().nullable(),
        humidity_norm: z.number().optional().nullable(),
        stage: z.enum(["Посев", "Рост", "Цветение", "Плодоношение", "Сбор урожая"]),
        notes: z.string().optional().nullable(),
      }),
    [tr],
  );

  const [greenhouses, setGreenhouses] = useState<GreenhouseOption[]>([]);
  const [rows, setRows] = useState<CultureRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [filterGh, setFilterGh] = useState<number | "all">("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CultureRow | null>(null);
  const [form, setForm] = useState({
    name: "",
    greenhouse_id: 0,
    section: "",
    planted_date: "",
    harvest_date: "",
    temp_norm: "" as string | number,
    humidity_norm: "" as string | number,
    stage: "Рост" as CultureRow["stage"],
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const gRes = await fetch("/api/greenhouses", { cache: "no-store" });
      const g = (await gRes.json().catch(() => null)) as
        | null
        | { ok: true; greenhouses: Array<{ id: number; name: string }> }
        | { ok: false; error?: string };
      if (g?.ok) setGreenhouses(g.greenhouses.map((x) => ({ id: x.id, name: x.name })));
    } finally {
      setLoading(false);
    }
  }

  async function loadCultures(next?: { q?: string; greenhouse_id?: number | "all" }) {
    const qq = (next?.q ?? q).trim();
    const gh = next?.greenhouse_id ?? filterGh;
    const sp = new URLSearchParams();
    if (qq) sp.set("q", qq);
    if (gh !== "all") sp.set("greenhouse_id", String(gh));

    const res = await fetch(`/api/cultures?${sp.toString()}`, { cache: "no-store" });
    const data = (await res.json().catch(() => null)) as null | { ok: boolean; cultures: CultureRow[]; error?: string };
    if (data?.ok) setRows(data.cultures);
    else setRows([]);
  }

  useEffect(() => {
    load();
    loadCultures({ q: "", greenhouse_id: "all" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      loadCultures();
    }, 200);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filterGh]);

  function openCreate() {
    setEditing(null);
    setError(null);
    setForm({
      name: "",
      greenhouse_id: greenhouses[0]?.id ?? 0,
      section: "",
      planted_date: "",
      harvest_date: "",
      temp_norm: "",
      humidity_norm: "",
      stage: "Рост",
      notes: "",
    });
    setModalOpen(true);
  }

  function openEdit(r: CultureRow) {
    setEditing(r);
    setError(null);
    setForm({
      name: r.name,
      greenhouse_id: r.greenhouse_id,
      section: r.section ?? "",
      planted_date: r.planted_date ?? "",
      harvest_date: r.harvest_date ?? "",
      temp_norm: r.temp_norm ?? "",
      humidity_norm: r.humidity_norm ?? "",
      stage: r.stage,
      notes: r.notes ?? "",
    });
    setModalOpen(true);
  }

  async function save() {
    setError(null);
    const parsed = FormSchema.safeParse({
      name: form.name,
      greenhouse_id: form.greenhouse_id,
      section: form.section?.trim() ? form.section : null,
      planted_date: form.planted_date?.trim() ? form.planted_date : null,
      harvest_date: form.harvest_date?.trim() ? form.harvest_date : null,
      temp_norm: form.temp_norm === "" ? null : Number(form.temp_norm),
      humidity_norm: form.humidity_norm === "" ? null : Number(form.humidity_norm),
      stage: form.stage,
      notes: form.notes?.trim() ? form.notes : null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? tr("error.checkFields"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/cultures", {
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
      await loadCultures();
    } catch {
      setError(tr("error.network"));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm(tr("cultures.confirmDelete"))) return;
    const res = await fetch(`/api/cultures?id=${id}`, { method: "DELETE" });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      alert(data.error || tr("error.deleteFailed"));
      return;
    }
    await loadCultures();
  }

  const stageHint = useMemo(() => `${stageProgress(form.stage)}%`, [form.stage]);

  return (
    <main className="min-w-0 max-w-full space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-xl font-semibold">{tr("cultures.title")}</div>
            <div className="text-sm text-[var(--muted)] mt-1">
              {tr("cultures.subtitle")}
            </div>
            <p className="text-sm text-[var(--muted)] mt-3 leading-relaxed border-t border-[var(--border)] pt-3">
              <span className="font-medium text-[var(--text)]">{tr("cultures.hint.title")}: </span>
              {tr("cultures.hint.body")}
            </p>
          </div>
          {canCrud(role) ? (
            <RippleButton onClick={openCreate} className="w-full shrink-0 px-4 py-2.5 sm:w-auto">
              {tr("cultures.add")}
            </RippleButton>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tr("cultures.searchPlaceholder")}
            className="flex-1 rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
          />
          <select
            value={filterGh}
            onChange={(e) => setFilterGh(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="md:w-80 rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
          >
            <option value="all">{tr("cultures.allGreenhouses")}</option>
            {greenhouses.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]">
        <TableScroll>
          <table className="w-full min-w-[56rem] text-sm fg-table-stagger">
          <thead className="text-left text-[var(--muted)]">
            <tr className="border-b border-[var(--border)]">
              <th className="p-4">{tr("cultures.table.name")}</th>
              <th className="p-4">{tr("cultures.table.greenhouse")}</th>
              <th className="p-4">{tr("cultures.table.section")}</th>
              <th className="p-4">{tr("cultures.table.planted")}</th>
              <th className="p-4">{tr("cultures.table.harvest")}</th>
              <th className="p-4">{tr("cultures.table.norms")}</th>
              <th className="p-4">{tr("cultures.table.stage")}</th>
              <th className="p-4 text-right">{tr("cultures.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const prog = stageProgress(r.stage);
              return (
                <tr key={r.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-white/5 transition">
                  <td className="p-4">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-[var(--muted)]">ID: {r.id}</div>
                  </td>
                  <td className="p-4 text-[var(--muted)]">{r.greenhouse_name}</td>
                  <td className="p-4 text-[var(--muted)]">{r.section ?? "—"}</td>
                  <td className="p-4 text-[var(--muted)]">{formatDisplayDate(r.planted_date)}</td>
                  <td className="p-4 text-[var(--muted)]">{formatDisplayDate(r.harvest_date)}</td>
                  <td className="p-4 text-[var(--muted)]">
                    {r.temp_norm != null ? `${r.temp_norm}°C` : "—"} ·{" "}
                    {r.humidity_norm != null ? `${r.humidity_norm}%` : "—"}
                  </td>
                  <td className="p-4">
                    <div className="min-w-44">
                      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                        <span>{tr(stageKey(r.stage))}</span>
                        <span>{prog}%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-black/30 border border-[var(--border)] overflow-hidden">
                        <div
                          className="h-full bg-[color:var(--accent)]"
                          style={{ width: `${prog}%`, transition: "width 300ms ease" }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {canCrud(role) ? (
                        <>
                          <button
                            onClick={() => openEdit(r)}
                            className="rounded-xl px-3 py-2 border border-[var(--border)] bg-black/20 hover:bg-white/5 transition"
                          >
                            {tr("common.edit")}
                          </button>
                          <button
                            onClick={() => remove(r.id)}
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
              );
            })}
            {!rows.length ? (
              <tr>
                <td className="p-6 text-[var(--muted)]" colSpan={8}>
                  {loading ? tr("common.loading") : tr("cultures.notFound")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        </TableScroll>
      </div>

      <AppModal
        open={modalOpen}
        onClose={() => {
          if (!saving) setModalOpen(false);
        }}
        title={editing ? tr("cultures.modal.editTitle") : tr("cultures.modal.addTitle")}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm text-[var(--muted)]">{tr("cultures.field.name")}</label>
            <input
              value={form.name}
              onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
              className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
              placeholder="Например: Томат Черри"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[var(--muted)]">{tr("cultures.field.greenhouse")}</label>
            <select
              value={form.greenhouse_id}
              onChange={(e) => setForm((v) => ({ ...v, greenhouse_id: Number(e.target.value) }))}
              className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
            >
              {greenhouses.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[var(--muted)]">{tr("cultures.field.section")}</label>
            <input
              value={form.section}
              onChange={(e) => setForm((v) => ({ ...v, section: e.target.value }))}
              className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
              placeholder="например: A1"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[var(--muted)]">{tr("cultures.field.plantedDate")}</label>
            <input
              value={form.planted_date}
              onChange={(e) => setForm((v) => ({ ...v, planted_date: e.target.value }))}
              className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
              placeholder="YYYY-MM-DD"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[var(--muted)]">{tr("cultures.field.harvestDate")}</label>
            <input
              value={form.harvest_date}
              onChange={(e) => setForm((v) => ({ ...v, harvest_date: e.target.value }))}
              className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
              placeholder="YYYY-MM-DD"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[var(--muted)]">{tr("cultures.field.tempNorm")}</label>
            <input
              value={form.temp_norm}
              onChange={(e) => setForm((v) => ({ ...v, temp_norm: e.target.value }))}
              className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
              placeholder="например: 24"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[var(--muted)]">{tr("cultures.field.humidityNorm")}</label>
            <input
              value={form.humidity_norm}
              onChange={(e) => setForm((v) => ({ ...v, humidity_norm: e.target.value }))}
              className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
              placeholder="например: 65"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm text-[var(--muted)]">{tr("cultures.field.stage")}</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              <select
                value={form.stage}
                onChange={(e) => setForm((v) => ({ ...v, stage: e.target.value as CultureRow["stage"] }))}
                className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition md:col-span-1"
              >
                {StageOrder.map((s) => (
                  <option key={s} value={s}>
                    {tr(stageKey(s))}
                  </option>
                ))}
              </select>
              <div className="md:col-span-2">
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>{tr("cultures.field.progress")}</span>
                  <span>{stageHint}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-black/30 border border-[var(--border)] overflow-hidden">
                  <div
                    className="h-full bg-[color:var(--accent)]"
                    style={{ width: stageHint, transition: "width 300ms ease" }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm text-[var(--muted)]">{tr("cultures.field.notes")}</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((v) => ({ ...v, notes: e.target.value }))}
              className="w-full min-h-24 rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
              placeholder="Заметки по культуре"
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
            disabled={saving}
            className="px-4 py-2.5"
          >
            {saving ? tr("common.saving") : tr("common.save")}
          </RippleButton>
        </div>
      </AppModal>
    </main>
  );
}

