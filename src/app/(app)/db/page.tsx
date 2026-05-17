"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import RippleButton from "@/components/ui/RippleButton";
import AppModal from "@/components/ui/AppModal";
import TableScroll from "@/components/ui/TableScroll";
import LiveSensorPanel from "@/components/hardware/LiveSensorPanel";
import { useI18n } from "@/components/i18n/I18nContext";

type Col = { name: string; type: string; notnull: number; pk: number; dflt_value: unknown };
type ForeignKey = {
  id: number;
  seq: number;
  table: string;
  from: string;
  to: string;
  on_update: string;
  on_delete: string;
  match: string;
};

type DbListRes = { ok: true; tables: string[] } | { ok: false; error: string };
type DbTableRes =
  | {
      ok: true;
      tables: string[];
      table: string;
      columns: Col[];
      foreignKeys: ForeignKey[];
      count: number;
      limit: number;
      offset: number;
      rows: Record<string, unknown>[];
    }
  | { ok: false; error: string };

type FilterOp = "eq" | "contains" | "gt" | "gte" | "lt" | "lte" | "isnull" | "notnull";
type FilterRow = { col: string; op: FilterOp; val?: string };

function formatCell(v: unknown) {
  if (v == null) return { text: "тАФ", isLong: false, full: "" };
  const s = typeof v === "string" ? v : JSON.stringify(v);
  const text = s.length > 160 ? `${s.slice(0, 160)}тАж` : s;
  return { text, isLong: s.length > 160, full: s };
}

function tryPrettyJson(s: string) {
  const t = s.trim();
  if (!(t.startsWith("{") || t.startsWith("["))) return null;
  try {
    return JSON.stringify(JSON.parse(t), null, 2);
  } catch {
    return null;
  }
}

export default function DbPage() {
  const { t: tr } = useI18n();
  const [tables, setTables] = useState<string[]>([]);
  const [table, setTable] = useState<string>("");
  const [columns, setColumns] = useState<Col[]>([]);
  const [foreignKeys, setForeignKeys] = useState<ForeignKey[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [count, setCount] = useState(0);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<FilterRow[]>([]);
  const [cellOpen, setCellOpen] = useState(false);
  const [cellTitle, setCellTitle] = useState("");
  const [cellValue, setCellValue] = useState("");
  const [rowOpen, setRowOpen] = useState(false);
  const [rowMode, setRowMode] = useState<"add" | "edit">("add");
  const [rowDraft, setRowDraft] = useState<Record<string, unknown>>({});
  const [rowSaving, setRowSaving] = useState(false);

  const [simEnabled, setSimEnabled] = useState(false);
  const [simReady, setSimReady] = useState(false);
  const [simBusy, setSimBusy] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  const pkName = useMemo(() => columns.find((c) => c.pk === 1)?.name || (columns.some((c) => c.name === "id") ? "id" : null), [columns]);

  const page = useMemo(() => Math.floor(offset / limit) + 1, [offset, limit]);
  const pages = useMemo(() => Math.max(1, Math.ceil(count / limit)), [count, limit]);

  function coerceValueByType(type: string, raw: unknown) {
    const t = (type || "").toLowerCase();
    if (raw === "") return null;
    if (raw == null) return null;
    if (t.includes("int") || t.includes("real") || t.includes("num")) {
      const n = Number(raw);
      return Number.isFinite(n) ? n : raw;
    }
    return raw;
  }

  function openAdd() {
    const initial: Record<string, unknown> = {};
    for (const c of columns) {
      if (pkName && c.name === pkName) continue;
      initial[c.name] = c.dflt_value ?? "";
    }
    setRowMode("add");
    setRowDraft(initial);
    setRowOpen(true);
  }

  function openEdit(row: Record<string, unknown>) {
    const initial: Record<string, unknown> = {};
    for (const c of columns) {
      initial[c.name] = row[c.name] ?? "";
    }
    setRowMode("edit");
    setRowDraft(initial);
    setRowOpen(true);
  }

  async function saveRow() {
    if (!table) return;
    if (rowMode === "edit" && !pkName) return;
    setRowSaving(true);
    setError(null);
    try {
      if (rowMode === "add") {
        const payload: Record<string, unknown> = {};
        for (const c of columns) {
          if (pkName && c.name === pkName) continue;
          payload[c.name] = coerceValueByType(c.type, rowDraft[c.name]);
        }
        const res = await fetch("/api/db", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ table, data: payload }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) throw new Error(data?.error || tr("error.saveFailed"));
      } else {
        const id = rowDraft[pkName as string];
        const payload: Record<string, unknown> = {};
        for (const c of columns) {
          if (pkName && c.name === pkName) continue;
          payload[c.name] = coerceValueByType(c.type, rowDraft[c.name]);
        }
        const res = await fetch("/api/db", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ table, id, data: payload }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) throw new Error(data?.error || tr("error.saveFailed"));
      }
      setRowOpen(false);
      await loadTable();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : null;
      setError(msg || tr("error.network"));
    } finally {
      setRowSaving(false);
    }
  }

  async function deleteRow(row: Record<string, unknown>) {
    if (!table || !pkName) return;
    const id = row[pkName];
    if (!confirm(`${tr("common.delete")} ${table}.${pkName}=${String(id)}?`)) return;
    setError(null);
    try {
      const res = await fetch("/api/db", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ table, id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || tr("error.deleteFailed"));
      await loadTable();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : null;
      setError(msg || tr("error.network"));
    }
  }

  async function loadList() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/db", { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as null | DbListRes;
      if (data && "ok" in data && data.ok) {
        setTables(data.tables);
        setTable((prev) => prev || data.tables[0] || "");
      } else {
        setError((data && !data.ok ? data.error : null) || tr("error.network"));
      }
    } catch {
      setError(tr("error.network"));
    } finally {
      setLoading(false);
    }
  }

  async function loadTable(next?: {
    table?: string;
    limit?: number;
    offset?: number;
    q?: string;
    sort?: string;
    dir?: "asc" | "desc";
    filters?: FilterRow[];
  }) {
    const t = next?.table ?? table;
    if (!t) return;
    const l = next?.limit ?? limit;
    const o = next?.offset ?? offset;
    const qq = next?.q ?? q;
    const s = next?.sort ?? sort;
    const d = next?.dir ?? dir;
    const f = next?.filters ?? filters;

    setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams();
      sp.set("table", t);
      sp.set("limit", String(l));
      sp.set("offset", String(o));
      if (qq.trim()) sp.set("q", qq.trim());
      if (s) sp.set("sort", s);
      sp.set("dir", d);
      if (f.length) sp.set("filters", JSON.stringify(f.filter((x) => x.col && x.op)));
      const res = await fetch(`/api/db?${sp.toString()}`, { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as null | DbTableRes;
      if (data && "ok" in data && data.ok) {
        setTables(data.tables);
        setColumns(data.columns);
        setForeignKeys(data.foreignKeys || []);
        setRows(data.rows);
        setCount(data.count);
        setLimit(data.limit);
        setOffset(data.offset);
      } else {
        setError((data && !data.ok ? data.error : null) || tr("error.network"));
      }
    } catch {
      setError(tr("error.network"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/sensor-simulation", {
          cache: "no-store",
          credentials: "same-origin",
        });
        const data = (await res.json().catch(() => null)) as
          | { ok?: boolean; enabled?: boolean; error?: string }
          | null;
        if (cancelled) return;
        setSimReady(true);
        if (data?.ok) {
          setSimEnabled(!!data.enabled);
          setSimError(null);
        } else {
          setSimEnabled(false);
          setSimError(data?.error ?? tr("error.network"));
        }
      } catch {
        if (!cancelled) {
          setSimReady(true);
          setSimEnabled(false);
          setSimError(tr("error.network"));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!table) return;
    loadTable({ table, limit, offset: 0, q, sort, dir, filters });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  return (
    <main className="min-w-0 max-w-full space-y-4">
      <LiveSensorPanel />

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold">{tr("db.title")}</div>
            <div className="text-sm text-[var(--muted)] mt-1">{tr("db.subtitle")}</div>
          </div>
          <div className="text-xs text-[var(--muted)]">{loading ? tr("common.loading") : ""}</div>
        </div>
      </Card>

      <Card className="p-5 border-[color:var(--accent)]/30 bg-[color:var(--accent)]/8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="font-semibold">{tr("db.sensorSim.title")}</div>
            {simError ? <div className="text-xs text-red-300/90 mt-1">{simError}</div> : null}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <RippleButton
              className="px-4 py-2.5"
              disabled={simBusy || !simReady || simEnabled}
              onClick={async () => {
                setSimBusy(true);
                setSimError(null);
                try {
                  const res = await fetch("/api/admin/sensor-simulation", {
                    method: "POST",
                    credentials: "same-origin",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ enabled: true, tickNow: true }),
                  });
                  const data = (await res.json().catch(() => null)) as
                    | { ok?: boolean; enabled?: boolean; error?: string }
                    | null;
                  if (data?.ok) setSimEnabled(!!data.enabled);
                  else setSimError(data?.error ?? tr("error.network"));
                } catch {
                  setSimError(tr("error.network"));
                } finally {
                  setSimBusy(false);
                }
              }}
            >
              {simBusy ? tr("common.saving") : tr("db.sensorSim.enable")}
            </RippleButton>
            <RippleButton
              variant="outline"
              className="px-4 py-2.5"
              disabled={simBusy || !simReady || !simEnabled}
              onClick={async () => {
                setSimBusy(true);
                setSimError(null);
                try {
                  const res = await fetch("/api/admin/sensor-simulation", {
                    method: "POST",
                    credentials: "same-origin",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ enabled: false }),
                  });
                  const data = (await res.json().catch(() => null)) as
                    | { ok?: boolean; enabled?: boolean; error?: string }
                    | null;
                  if (data?.ok) setSimEnabled(!!data.enabled);
                  else setSimError(data?.error ?? tr("error.network"));
                } catch {
                  setSimError(tr("error.network"));
                } finally {
                  setSimBusy(false);
                }
              }}
            >
              {simBusy ? tr("common.saving") : tr("db.sensorSim.disable")}
            </RippleButton>
          </div>
        </div>
      </Card>

      {error ? (
        <Card className="p-4 border-red-500/30 bg-red-500/10 text-red-200">
          <div className="text-sm">{error}</div>
        </Card>
      ) : null}

      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="text-sm text-[var(--muted)]">{tr("db.table")}</div>
            <select
              value={table}
              onChange={(e) => {
                setTable(e.target.value);
                setOffset(0);
              }}
              className="sm:w-80 rounded-xl bg-black/20 border border-[var(--border)] px-4 py-2.5 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
            >
              {tables.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tr("common.search")}
              className="sm:w-80 rounded-xl bg-black/20 border border-[var(--border)] px-4 py-2.5 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
            />
            <select
              value={sort}
              onChange={(e) => {
                const s = e.target.value;
                setSort(s);
                setOffset(0);
                loadTable({ sort: s, offset: 0 });
              }}
              className="sm:w-56 rounded-xl bg-black/20 border border-[var(--border)] px-4 py-2.5 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
            >
              <option value="">{tr("db.sortAuto")}</option>
              {columns.map((c) => (
                <option key={c.name} value={c.name}>
                  {tr("db.sortBy")} {c.name}
                </option>
              ))}
            </select>
            <RippleButton
              variant="outline"
              className="px-4 py-2.5"
              onClick={() => {
                const next = dir === "asc" ? "desc" : "asc";
                setDir(next);
                setOffset(0);
                loadTable({ dir: next, offset: 0 });
              }}
            >
              {dir === "asc" ? "ASC" : "DESC"}
            </RippleButton>
            <div className="text-sm text-[var(--muted)]">{tr("db.limit")}</div>
            <select
              value={String(limit)}
              onChange={(e) => {
                const l = Number(e.target.value);
                setLimit(l);
                setOffset(0);
                loadTable({ limit: l, offset: 0 });
              }}
              className="sm:w-36 rounded-xl bg-black/20 border border-[var(--border)] px-4 py-2.5 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
            >
              {[25, 50, 100, 200].map((n) => (
                <option key={n} value={String(n)}>
                  {n}
                </option>
              ))}
            </select>
            <RippleButton
              variant="outline"
              className="px-4 py-2.5"
              onClick={() => {
                setOffset(0);
                loadList();
                if (table) loadTable({ offset: 0 });
              }}
            >
              {tr("ai.refresh")}
            </RippleButton>
            <RippleButton
              variant="outline"
              className="px-4 py-2.5"
              onClick={() => {
                if (!table) return;
                const sp = new URLSearchParams();
                sp.set("table", table);
                if (q.trim()) sp.set("q", q.trim());
                if (sort) sp.set("sort", sort);
                sp.set("dir", dir);
                if (filters.length) sp.set("filters", JSON.stringify(filters.filter((x) => x.col && x.op)));
                window.location.href = `/api/db/export?${sp.toString()}`;
              }}
            >
              {tr("db.exportCsv")}
            </RippleButton>
            <RippleButton className="px-4 py-2.5" onClick={openAdd} disabled={!columns.length}>
              {tr("common.add")}
            </RippleButton>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-3 text-sm text-[var(--muted)]">{tr("db.filters")}</div>
          {(filters.length ? filters : [{ col: "", op: "contains" as const, val: "" }]).map((f, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:col-span-3">
              <select
                value={f.col}
                onChange={(e) => {
                  const next = filters.length ? [...filters] : [{ col: "", op: "contains" as const, val: "" }];
                  next[idx] = { ...next[idx], col: e.target.value };
                  setFilters(next);
                }}
                className="rounded-xl bg-black/20 border border-[var(--border)] px-4 py-2.5 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
              >
                <option value="">{tr("db.selectColumn")}</option>
                {columns.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={f.op}
                onChange={(e) => {
                  const next = filters.length ? [...filters] : [{ col: "", op: "contains" as const, val: "" }];
                  next[idx] = { ...next[idx], op: e.target.value as FilterOp };
                  setFilters(next);
                }}
                className="rounded-xl bg-black/20 border border-[var(--border)] px-4 py-2.5 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
              >
                <option value="contains">{tr("db.op.contains")}</option>
                <option value="eq">{tr("db.op.eq")}</option>
                <option value="gt">{tr("db.op.gt")}</option>
                <option value="gte">{tr("db.op.gte")}</option>
                <option value="lt">{tr("db.op.lt")}</option>
                <option value="lte">{tr("db.op.lte")}</option>
                <option value="isnull">{tr("db.op.isnull")}</option>
                <option value="notnull">{tr("db.op.notnull")}</option>
              </select>
              <input
                value={f.val ?? ""}
                onChange={(e) => {
                  const next = filters.length ? [...filters] : [{ col: "", op: "contains" as const, val: "" }];
                  next[idx] = { ...next[idx], val: e.target.value };
                  setFilters(next);
                }}
                disabled={f.op === "isnull" || f.op === "notnull"}
                placeholder={tr("db.value")}
                className="rounded-xl bg-black/20 border border-[var(--border)] px-4 py-2.5 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition disabled:opacity-60"
              />
            </div>
          ))}
          <div className="lg:col-span-3 flex flex-wrap gap-2">
            <RippleButton
              className="px-4 py-2.5"
              onClick={() => {
                setOffset(0);
                loadTable({ offset: 0 });
              }}
              disabled={loading}
            >
              {tr("common.apply")}
            </RippleButton>
            <RippleButton
              variant="outline"
              className="px-4 py-2.5"
              onClick={() => {
                setQ("");
                setSort("");
                setDir("desc");
                setFilters([]);
                setOffset(0);
                loadTable({ q: "", sort: "", dir: "desc", filters: [], offset: 0 });
              }}
              disabled={loading}
            >
              {tr("common.reset")}
            </RippleButton>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="p-5 xl:col-span-1">
          <div className="font-semibold">{tr("db.columns")}</div>
          <div className="mt-3 space-y-2 text-sm">
            {columns.map((c) => (
              <div key={c.name} className="rounded-xl border border-[var(--border)] bg-black/10 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs text-[var(--muted)]">{c.type || "тАФ"}</span>
                </div>
                <div className="mt-1 text-xs text-[var(--muted)]">
                  {c.pk ? "PK" : ""} {c.notnull ? "NOT NULL" : ""}{" "}
                  {c.dflt_value != null ? `DEFAULT ${String(c.dflt_value)}` : ""}
                </div>
              </div>
            ))}
            {!columns.length ? <div className="text-sm text-[var(--muted)]">{tr("common.loading")}</div> : null}
          </div>

          <div className="mt-6">
            <div className="font-semibold">{tr("db.fk")}</div>
            <div className="mt-3 space-y-2 text-sm">
              {foreignKeys.map((fk, i) => (
                <div key={`${fk.id}-${fk.seq}-${i}`} className="rounded-xl border border-[var(--border)] bg-black/10 px-3 py-2">
                  <div className="font-medium">
                    {fk.from} тЖТ {fk.table}.{fk.to}
                  </div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    ON UPDATE {fk.on_update || "тАФ"} ┬╖ ON DELETE {fk.on_delete || "тАФ"}
                  </div>
                </div>
              ))}
              {!foreignKeys.length ? <div className="text-sm text-[var(--muted)]">{tr("db.noFk")}</div> : null}
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-2">
          <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="min-w-0">
              <div className="font-semibold">{tr("db.rows")}</div>
              <div className="text-sm text-[var(--muted)] mt-1">
                {count} ┬╖ {page}/{pages}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <RippleButton
                variant="outline"
                className="px-4 py-2.5"
                disabled={offset <= 0 || loading}
                onClick={() => {
                  const next = Math.max(0, offset - limit);
                  setOffset(next);
                  loadTable({ offset: next });
                }}
              >
                {tr("db.prev")}
              </RippleButton>
              <RippleButton
                variant="outline"
                className="px-4 py-2.5"
                disabled={offset + limit >= count || loading}
                onClick={() => {
                  const next = offset + limit;
                  setOffset(next);
                  loadTable({ offset: next });
                }}
              >
                {tr("db.next")}
              </RippleButton>
            </div>
          </div>
          <TableScroll>
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="text-left text-[var(--muted)]">
                <tr className="border-b border-[var(--border)]">
                  <th className="p-3 whitespace-nowrap">{tr("common.edit")}</th>
                  {columns.map((c) => (
                    <th key={c.name} className="p-3 whitespace-nowrap">
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx} className="border-b border-[var(--border)] last:border-b-0 hover:bg-white/5 transition">
                    <td className="p-3 align-top">
                      <div className="flex items-center gap-2">
                        <button
                          className="text-xs rounded-lg border border-[var(--border)] bg-black/20 px-2.5 py-1.5 hover:bg-white/5 transition"
                          onClick={() => openEdit(r)}
                        >
                          {tr("common.edit")}
                        </button>
                        <button
                          className="text-xs rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 hover:bg-red-500/15 transition text-red-200"
                          onClick={() => deleteRow(r)}
                          disabled={!pkName}
                          title={!pkName ? "PK not found" : ""}
                        >
                          {tr("common.delete")}
                        </button>
                      </div>
                    </td>
                    {columns.map((c) => {
                      const formatted = formatCell(r[c.name]);
                      const pretty = tryPrettyJson(formatted.full);
                      return (
                        <td key={c.name} className="p-3 align-top text-[var(--muted)]">
                          <div className="max-w-[420px] break-words">
                            {formatted.text}
                            {formatted.isLong ? (
                              <button
                                className="ml-2 text-xs text-[color:var(--accent)] hover:underline"
                                onClick={() => {
                                  setCellTitle(`${table}.${c.name}`);
                                  setCellValue(pretty ?? formatted.full);
                                  setCellOpen(true);
                                }}
                              >
                                {tr("common.open")}
                              </button>
                            ) : null}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {!rows.length ? (
                  <tr>
                    <td className="p-6 text-[var(--muted)]" colSpan={Math.max(2, columns.length + 1)}>
                      {loading ? tr("common.loading") : "тАФ"}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </TableScroll>
        </Card>
      </div>

      <AppModal
        title={cellTitle || tr("common.open")}
        open={cellOpen}
        onClose={() => {
          setCellOpen(false);
          setCellTitle("");
          setCellValue("");
        }}
      >
        <pre className="max-h-[min(60vh,28rem)] overflow-auto text-xs whitespace-pre-wrap break-words rounded-xl border border-[var(--border)] bg-black/20 p-4">
          {cellValue || "тАФ"}
        </pre>
      </AppModal>

      <AppModal
        maxWidth="3xl"
        title={rowMode === "add" ? `${tr("common.add")} ┬╖ ${table}` : `${tr("common.edit")} ┬╖ ${table}`}
        open={rowOpen}
        onClose={() => {
          setRowOpen(false);
          setRowDraft({});
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {columns
            .filter((c) => !(rowMode === "add" && pkName && c.name === pkName))
            .map((c) => {
              const isPk = pkName && c.name === pkName;
              const disabled = rowMode === "edit" && isPk;
              const type = (c.type || "").toLowerCase();
              const inputType = type.includes("int") || type.includes("real") || type.includes("num") ? "number" : "text";
              const cellDraft = rowDraft[c.name];
              const cellStr =
                cellDraft === undefined || cellDraft === null || typeof cellDraft === "object"
                  ? ""
                  : String(cellDraft);
              return (
                <label key={c.name} className="block">
                  <div className="text-xs text-[var(--muted)] mb-1">
                    {c.name} {isPk ? "(PK)" : ""}
                  </div>
                  <input
                    type={inputType}
                    value={cellStr}
                    onChange={(e) => setRowDraft((prev) => ({ ...prev, [c.name]: e.target.value }))}
                    disabled={!!disabled}
                    className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-2.5 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition disabled:opacity-60"
                  />
                </label>
              );
            })}
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <RippleButton variant="outline" className="px-4 py-2.5" onClick={() => setRowOpen(false)} disabled={rowSaving}>
            {tr("common.cancel")}
          </RippleButton>
          <RippleButton className="px-4 py-2.5" onClick={saveRow} disabled={rowSaving}>
            {rowSaving ? tr("common.saving") : tr("common.save")}
          </RippleButton>
        </div>
        <div className="mt-3 text-xs text-[var(--muted)]">
          {tr("db.safeEditHint")}
        </div>
      </AppModal>
    </main>
  );
}

