import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRoles } from "@/lib/api/rbac";
import { apiT } from "@/lib/api/i18n";
import { auditLog } from "@/lib/audit";

const FilterSchema = z.object({
  col: z.string().min(1),
  op: z.enum(["eq", "contains", "gt", "gte", "lt", "lte", "isnull", "notnull"]),
  val: z.unknown().optional(),
});

const QuerySchema = z.object({
  table: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  q: z.string().max(200).optional(),
  sort: z.string().max(200).optional(),
  dir: z.enum(["asc", "desc"]).optional(),
  filters: z
    .string()
    .max(5000)
    .optional()
    .transform((s) => {
      if (!s) return [];
      try {
        const v = JSON.parse(s);
        return Array.isArray(v) ? v : [];
      } catch {
        return [];
      }
    })
    .pipe(z.array(FilterSchema).max(20)),
});

function quoteIdent(raw: string) {
  return `"${raw.replaceAll('"', '""')}"`;
}

async function listTables(): Promise<string[]> {
  const rows = (await db()
    .prepare(
      `
      SELECT table_name AS name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC
    `,
    )
    .all()) as Array<{ name: string }>;
  return rows.map((r) => r.name);
}

const SAFE_EDIT_TABLES = new Set([
  "greenhouses",
  "cultures",
  "sensor_data",
  "watering_schedule",
  "tasks",
  "employees",
  "notifications",
]);

type ColInfo = {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: unknown;
  pk: number;
};

async function getColumns(table: string): Promise<ColInfo[]> {
  const rows = (await db()
    .prepare(
      `
      SELECT
        c.ordinal_position - 1 AS cid,
        c.column_name AS name,
        c.data_type AS type,
        CASE WHEN c.is_nullable = 'NO' THEN 1 ELSE 0 END AS notnull,
        c.column_default AS dflt_value,
        CASE WHEN pk.column_name IS NOT NULL THEN 1 ELSE 0 END AS pk
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT kcu.column_name, kcu.table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = 'public' AND tc.constraint_type = 'PRIMARY KEY'
      ) pk ON pk.table_name = c.table_name AND pk.column_name = c.column_name
      WHERE c.table_schema = 'public' AND c.table_name = ?
      ORDER BY c.ordinal_position
    `,
    )
    .all(table)) as ColInfo[];
  return rows;
}

function getPrimaryKey(columns: Array<{ name: string; pk: number }>) {
  const pk = columns.find((c) => c.pk === 1)?.name;
  if (pk) return pk;
  if (columns.some((c) => c.name === "id")) return "id";
  return null;
}

async function getForeignKeys(table: string) {
  return (await db()
    .prepare(
      `
      SELECT
        kcu.column_name AS "from",
        ccu.table_name AS "table",
        ccu.column_name AS "to"
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = ?
    `,
    )
    .all(table)) as Array<{ from: string; table: string; to: string }>;
}

function safeOrderBy(columns: Array<{ name: string }>, sort?: string, dir?: "asc" | "desc") {
  const direction = dir === "asc" ? "ASC" : "DESC";
  if (sort && columns.some((c) => c.name === sort)) {
    return `ORDER BY ${quoteIdent(sort)} ${direction}`;
  }
  if (columns.some((c) => c.name === "id")) return `ORDER BY ${quoteIdent("id")} DESC`;
  if (columns.some((c) => c.name === "created_at")) return `ORDER BY ${quoteIdent("created_at")} DESC`;
  if (columns.some((c) => c.name === "recorded_at")) return `ORDER BY ${quoteIdent("recorded_at")} DESC`;
  return `ORDER BY 1 DESC`;
}

function buildWhere(opts: {
  columns: Array<{ name: string; type: string }>;
  q?: string;
  filters: Array<z.infer<typeof FilterSchema>>;
}) {
  const clauses: string[] = [];
  const params: unknown[] = [];

  const q = opts.q?.trim();
  if (q) {
    const likeableCols = opts.columns
      .filter((c) => (c.type || "").toLowerCase().includes("character") || (c.type || "").toLowerCase().includes("text"))
      .map((c) => c.name);
    if (likeableCols.length) {
      const or = likeableCols.map((c) => `CAST(${quoteIdent(c)} AS TEXT) LIKE ?`).join(" OR ");
      clauses.push(`(${or})`);
      params.push(...likeableCols.map(() => `%${q}%`));
    }
  }

  for (const f of opts.filters) {
    if (!opts.columns.some((c) => c.name === f.col)) continue;
    const col = quoteIdent(f.col);
    switch (f.op) {
      case "eq":
        clauses.push(`${col} = ?`);
        params.push(f.val ?? null);
        break;
      case "contains":
        clauses.push(`CAST(${col} AS TEXT) LIKE ?`);
        params.push(`%${String(f.val ?? "")}%`);
        break;
      case "gt":
        clauses.push(`${col} > ?`);
        params.push(f.val ?? null);
        break;
      case "gte":
        clauses.push(`${col} >= ?`);
        params.push(f.val ?? null);
        break;
      case "lt":
        clauses.push(`${col} < ?`);
        params.push(f.val ?? null);
        break;
      case "lte":
        clauses.push(`${col} <= ?`);
        params.push(f.val ?? null);
        break;
      case "isnull":
        clauses.push(`${col} IS NULL`);
        break;
      case "notnull":
        clauses.push(`${col} IS NOT NULL`);
        break;
    }
  }

  if (!clauses.length) return { whereSql: "", params };
  return { whereSql: `WHERE ${clauses.join(" AND ")}`, params };
}

export async function GET(req: Request) {
  const auth = await requireApiRoles(["admin"]);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? (await apiT("api.badParams")) }, { status: 400 });
  }

  const tables = await listTables();
  const table = parsed.data.table;
  if (!table) {
    return NextResponse.json({ ok: true, tables });
  }

  if (!tables.includes(table)) {
    return NextResponse.json({ ok: false, error: await apiT("api.badParams") }, { status: 400 });
  }

  const limit = parsed.data.limit ?? 50;
  const offset = parsed.data.offset ?? 0;

  const columns = await getColumns(table);
  const foreignKeys = await getForeignKeys(table);
  const orderBy = safeOrderBy(columns, parsed.data.sort, parsed.data.dir);
  const { whereSql, params } = buildWhere({ columns, q: parsed.data.q, filters: parsed.data.filters });

  const countRow = (await db()
    .prepare(`SELECT COUNT(*)::int as c FROM ${quoteIdent(table)} ${whereSql}`)
    .get(...params)) as { c: number };
  const rows = (await db()
    .prepare(`SELECT * FROM ${quoteIdent(table)} ${whereSql} ${orderBy} LIMIT ? OFFSET ?`)
    .all(...params, limit, offset)) as unknown[];

  return NextResponse.json({
    ok: true,
    tables,
    table,
    columns,
    foreignKeys,
    count: countRow.c,
    limit,
    offset,
    rows,
  });
}

const WriteSchema = z.object({
  table: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
});

const UpdateSchema = z.object({
  table: z.string().min(1),
  id: z.unknown(),
  data: z.record(z.string(), z.unknown()),
});

const DeleteSchema = z.object({
  table: z.string().min(1),
  id: z.unknown(),
});

export async function POST(req: Request) {
  const auth = await requireApiRoles(["admin"]);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = WriteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: await apiT("api.badData") }, { status: 400 });
  }

  const tables = await listTables();
  const table = parsed.data.table;
  if (!tables.includes(table) || !SAFE_EDIT_TABLES.has(table)) {
    return NextResponse.json({ ok: false, error: await apiT("api.forbidden") }, { status: 403 });
  }

  const columns = await getColumns(table);
  const pk = getPrimaryKey(columns);
  const colSet = new Set(columns.map((c) => c.name));
  const insertable = columns.filter((c) => c.name !== pk).map((c) => c.name);

  const entries = Object.entries(parsed.data.data).filter(([k, v]) => colSet.has(k) && k !== pk && v !== undefined);
  const cols = entries.map(([k]) => k).filter((k) => insertable.includes(k));
  const vals = entries.map(([, v]) => v);

  if (!cols.length) {
    return NextResponse.json({ ok: false, error: await apiT("api.badData") }, { status: 400 });
  }

  const sql = `INSERT INTO ${quoteIdent(table)} (${cols.map(quoteIdent).join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`;
  const res = await db().prepare(sql).run(...vals);

  await auditLog({
    actorUserId: Number(auth.user.id),
    action: "create",
    entity: "db",
    entityId: typeof res.lastInsertRowid === "bigint" ? Number(res.lastInsertRowid) : (res.lastInsertRowid as number),
    details: `INSERT ${table} (${cols.join(", ")})`,
  });

  return NextResponse.json({ ok: true, id: res.lastInsertRowid });
}

export async function PUT(req: Request) {
  const auth = await requireApiRoles(["admin"]);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: await apiT("api.badData") }, { status: 400 });
  }

  const tables = await listTables();
  const table = parsed.data.table;
  if (!tables.includes(table) || !SAFE_EDIT_TABLES.has(table)) {
    return NextResponse.json({ ok: false, error: await apiT("api.forbidden") }, { status: 403 });
  }

  const columns = await getColumns(table);
  const pk = getPrimaryKey(columns);
  if (!pk) {
    return NextResponse.json({ ok: false, error: await apiT("api.badParams") }, { status: 400 });
  }

  const colSet = new Set(columns.map((c) => c.name));
  const entries = Object.entries(parsed.data.data).filter(([k, v]) => colSet.has(k) && k !== pk && v !== undefined);
  const cols = entries.map(([k]) => k);
  const vals = entries.map(([, v]) => v);

  if (!cols.length) {
    return NextResponse.json({ ok: false, error: await apiT("api.badData") }, { status: 400 });
  }

  const sql = `UPDATE ${quoteIdent(table)} SET ${cols.map((c) => `${quoteIdent(c)} = ?`).join(", ")} WHERE ${quoteIdent(pk)} = ?`;
  const res = await db().prepare(sql).run(...vals, parsed.data.id);

  await auditLog({
    actorUserId: Number(auth.user.id),
    action: "update",
    entity: "db",
    entityId: typeof parsed.data.id === "number" ? parsed.data.id : null,
    details: `UPDATE ${table} SET ${cols.join(", ")} WHERE ${pk} = ${String(parsed.data.id)}`,
  });

  return NextResponse.json({ ok: true, changes: res.changes });
}

export async function DELETE(req: Request) {
  const auth = await requireApiRoles(["admin"]);
  if (!auth.ok) return auth.response;

  const json = await req.json().catch(() => null);
  const parsed = DeleteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: await apiT("api.badData") }, { status: 400 });
  }

  const tables = await listTables();
  const table = parsed.data.table;
  if (!tables.includes(table) || !SAFE_EDIT_TABLES.has(table)) {
    return NextResponse.json({ ok: false, error: await apiT("api.forbidden") }, { status: 403 });
  }

  const columns = await getColumns(table);
  const pk = getPrimaryKey(columns);
  if (!pk) {
    return NextResponse.json({ ok: false, error: await apiT("api.badParams") }, { status: 400 });
  }

  const sql = `DELETE FROM ${quoteIdent(table)} WHERE ${quoteIdent(pk)} = ?`;
  const res = await db().prepare(sql).run(parsed.data.id);

  await auditLog({
    actorUserId: Number(auth.user.id),
    action: "delete",
    entity: "db",
    entityId: typeof parsed.data.id === "number" ? parsed.data.id : null,
    details: `DELETE FROM ${table} WHERE ${pk} = ${String(parsed.data.id)}`,
  });

  return NextResponse.json({ ok: true, changes: res.changes });
}
