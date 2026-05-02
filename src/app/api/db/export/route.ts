import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRoles } from "@/lib/api/rbac";
import { apiT } from "@/lib/api/i18n";

const FilterSchema = z.object({
  col: z.string().min(1),
  op: z.enum(["eq", "contains", "gt", "gte", "lt", "lte", "isnull", "notnull"]),
  val: z.unknown().optional(),
});

const QuerySchema = z.object({
  table: z.string().min(1),
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

async function getColumns(table: string) {
  const cols = (await db()
    .prepare(
      `
      SELECT column_name as name, data_type as type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ?
      ORDER BY ordinal_position
    `,
    )
    .all(table)) as Array<{
    name: string;
    type: string;
  }>;
  return cols;
}

function safeOrderBy(columns: Array<{ name: string }>, sort?: string, dir?: "asc" | "desc") {
  const direction = dir === "asc" ? "ASC" : "DESC";
  if (sort && columns.some((c) => c.name === sort)) return `ORDER BY ${quoteIdent(sort)} ${direction}`;
  if (columns.some((c) => c.name === "id")) return `ORDER BY ${quoteIdent("id")} DESC`;
  return `ORDER BY 1 DESC`;
}

function buildWhere(opts: { columns: Array<{ name: string; type: string }>; q?: string; filters: Array<z.infer<typeof FilterSchema>> }) {
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

function csvEscape(v: unknown) {
  if (v == null) return "";
  const s = String(v);
  if (/[",\r\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
  return s;
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
  if (!tables.includes(table)) {
    return NextResponse.json({ ok: false, error: await apiT("api.badParams") }, { status: 400 });
  }

  const columns = await getColumns(table);
  const orderBy = safeOrderBy(columns, parsed.data.sort, parsed.data.dir);
  const { whereSql, params } = buildWhere({ columns, q: parsed.data.q, filters: parsed.data.filters });

  const rows = (await db()
    .prepare(`SELECT * FROM ${quoteIdent(table)} ${whereSql} ${orderBy} LIMIT 5000`)
    .all(...params)) as Record<string, unknown>[];

  const header = columns.map((c) => csvEscape(c.name)).join(",");
  const lines = rows.map((r) => columns.map((c) => csvEscape(r[c.name])).join(","));
  const csv = [header, ...lines].join("\r\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${table}.csv"`,
    },
  });
}
