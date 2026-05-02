import type { Pool, PoolClient, QueryResult } from "pg";

export type RunResult = { changes: number; lastInsertRowid: number | bigint };

function isNamedParams(arg: unknown): arg is Record<string, unknown> {
  return arg !== null && typeof arg === "object" && !Array.isArray(arg) && !(arg instanceof Date);
}

function positionalToPg(sql: string, args: unknown[]): { text: string; values: unknown[] } {
  let i = 0;
  const text = sql.replace(/\?/g, () => `$${++i}`);
  return { text, values: args };
}

function namedToPg(sql: string, params: Record<string, unknown>): { text: string; values: unknown[] } {
  const values: unknown[] = [];
  const text = sql.replace(/@([a-zA-Z_][a-zA-Z0-9_]*)/g, (_m, name: string) => {
    if (!(name in params)) {
      throw new Error(`SQL: нет значения для @${name}`);
    }
    values.push(params[name]);
    return `$${values.length}`;
  });
  if (/@[a-zA-Z_]/.test(text)) {
    throw new Error("SQL: остались незаменённые @параметры");
  }
  return { text, values };
}

function isInsert(text: string) {
  return /^\s*insert/i.test(text);
}

/** Для INSERT без своего RETURNING добавляется RETURNING id (SERIAL). Таблицы без колонки id (например app_settings) должны задавать свой RETURNING. */
function withReturningId(text: string) {
  if (/returning/i.test(text)) return text;
  const trimmed = text.trim();
  if (!isInsert(trimmed)) return text;
  return `${trimmed.replace(/;?\s*$/g, "")} RETURNING id`;
}

function num(v: unknown): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "string") return Number(v);
  return 0;
}

function normalizeCountRow(row: Record<string, unknown> | undefined) {
  if (!row || typeof row !== "object") return row;
  if ("c" in row && row.c != null) {
    (row as { c: number }).c = num((row as { c: unknown }).c);
  }
  return row;
}

export function createDbAdapter(executor: Pool | PoolClient, ensureInit?: () => Promise<void>) {
  const runQuery = async (text: string, values: unknown[] | undefined): Promise<QueryResult<Record<string, unknown>>> => {
    if (ensureInit) await ensureInit();
    return executor.query<Record<string, unknown>>(text, values);
  };

  return {
    prepare(sql: string) {
      return {
        async get(...args: unknown[]) {
          let text: string;
          let values: unknown[];
          if (args.length === 1 && isNamedParams(args[0])) {
            ({ text, values } = namedToPg(sql, args[0] as Record<string, unknown>));
          } else {
            ({ text, values } = positionalToPg(sql, args));
          }
          const res = await runQuery(text, values);
          const row = res.rows[0] as Record<string, unknown> | undefined;
          return normalizeCountRow(row) as typeof row;
        },

        async all(...args: unknown[]) {
          let text: string;
          let values: unknown[];
          if (args.length === 1 && isNamedParams(args[0])) {
            ({ text, values } = namedToPg(sql, args[0] as Record<string, unknown>));
          } else {
            ({ text, values } = positionalToPg(sql, args));
          }
          const res = await runQuery(text, values);
          return res.rows;
        },

        async run(...args: unknown[]) {
          let text: string;
          let values: unknown[];
          if (args.length === 1 && isNamedParams(args[0])) {
            ({ text, values } = namedToPg(sql, args[0] as Record<string, unknown>));
          } else {
            ({ text, values } = positionalToPg(sql, args));
          }

          if (isInsert(text)) {
            const ins = withReturningId(text);
            const res = await runQuery(ins, values);
            const id = res.rows[0]?.id;
            return {
              changes: res.rowCount ?? 0,
              lastInsertRowid: id != null ? num(id) : 0,
            } satisfies RunResult;
          }

          const res = await runQuery(text, values);
          return { changes: res.rowCount ?? 0, lastInsertRowid: 0 } satisfies RunResult;
        },
      };
    },

    async exec(text: string) {
      if (ensureInit) await ensureInit();
      const statements = text
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const s of statements) {
        await executor.query(s);
      }
    },
  };
}

export type DbAdapter = ReturnType<typeof createDbAdapter>;
export type PgStmt = ReturnType<DbAdapter["prepare"]>;
