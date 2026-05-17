import pg from "pg";
import { createDbAdapter, type DbAdapter } from "@/lib/db/adapter";
import { ENV } from "@/lib/env";
import { initSchema } from "@/lib/db/schema";
import { runMigrations } from "@/lib/db/migrations";
import { seedAll } from "@/lib/db/seed";

// bigint COUNT(*) -> number для совместимости с существующим UI
if (!(globalThis as { __pgTypesPatched?: boolean }).__pgTypesPatched) {
  (globalThis as { __pgTypesPatched?: boolean }).__pgTypesPatched = true;
  pg.types.setTypeParser(20, (s) => parseInt(s, 10));
}

declare global {
  var __dbPool: pg.Pool | undefined;
  var __dbInitPromise: Promise<void> | undefined;
}

/** На Vercel можно вставить тот же URI, что в `.env.local`; в production `sslmode=no-verify` в строке заменяется на `require` (для парсера URI), а проверка TLS ослабляется по исходному флагу или env. */
function databaseUrlForPool(rawFromEnv: string): string {
  if (process.env.NODE_ENV !== "production") return rawFromEnv;
  return rawFromEnv.replace(/\bsslmode=no-verify\b/gi, "sslmode=require");
}

/** Supabase (direct или pooler). */
function isSupabaseDatabaseUrl(raw: string): boolean {
  return raw.includes("supabase.co") || raw.includes("pooler.supabase.com");
}

/**
 * На Vercel к внешнему Postgres часто падает verify цепочки (`self-signed certificate in certificate chain`).
 * Ослабляем TLS, если: no-verify в URI, явный env `=0`, production + (Supabase ИЛИ любой хост на Vercel).
 * Строгая проверка: только `DATABASE_SSL_REJECT_UNAUTHORIZED=1`.
 */
function wantsRelaxedSsl(rawDatabaseUrl: string): boolean {
  if (/\bsslmode=no-verify\b/i.test(rawDatabaseUrl)) return true;
  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "0") return true;
  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "1") return false;
  if (process.env.NODE_ENV !== "production") return false;
  if (isSupabaseDatabaseUrl(rawDatabaseUrl)) return true;
  if (process.env.VERCEL === "1") return true;
  return false;
}

/** Иначе `sslmode=require` в URI может конфликтовать с `ssl.rejectUnauthorized` в `pg`. */
function stripSslModeQuery(connectionString: string): string {
  const q = connectionString.indexOf("?");
  if (q === -1) return connectionString;
  const base = connectionString.slice(0, q);
  const rest = connectionString.slice(q + 1);
  const parts = rest.split("&").filter((p) => p.length > 0 && !/^sslmode=/i.test(p));
  if (parts.length === 0) return base;
  return `${base}?${parts.join("&")}`;
}

function getPool() {
  if (globalThis.__dbPool) return globalThis.__dbPool;
  const rawUrl = ENV.DATABASE_URL();
  const relaxed = wantsRelaxedSsl(rawUrl);
  const normalized = databaseUrlForPool(rawUrl);
  const connectionString = relaxed ? stripSslModeQuery(normalized) : normalized;
  const pool = new pg.Pool({
    connectionString,
    ...(relaxed ? { ssl: { rejectUnauthorized: false } } : { ssl: { rejectUnauthorized: true } }),
    max: 5,
    connectionTimeoutMillis: 15_000,
    idleTimeoutMillis: 20_000,
  });
  globalThis.__dbPool = pool;
  return pool;
}

export async function ensureDbReady() {
  if (globalThis.__dbInitPromise) return globalThis.__dbInitPromise;
  const pool = getPool();
  globalThis.__dbInitPromise = (async () => {
    const autoInit = ENV.DB_AUTO_INIT() === "1";
    const autoSeed = ENV.DB_AUTO_SEED() === "1";
    if (autoInit) {
      await initSchema(pool);
      await runMigrations(pool);
    }
    if (autoSeed) {
      await seedAll(pool);
    }
  })();
  return globalThis.__dbInitPromise;
}

export type AppDb = DbAdapter & {
  transaction: <T>(fn: (tx: DbAdapter) => Promise<T>) => Promise<T>;
};

export function getDbPool() {
  return getPool();
}

export function db(): AppDb {
  const pool = getPool();
  const base = createDbAdapter(pool, () => ensureDbReady());

  return {
    ...base,
    async transaction<T>(fn: (tx: DbAdapter) => Promise<T>): Promise<T> {
      await ensureDbReady();
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const tx = createDbAdapter(client);
        const v = await fn(tx);
        await client.query("COMMIT");
        return v;
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
    },
  };
}
