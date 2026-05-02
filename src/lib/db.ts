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

function getPool() {
  if (globalThis.__dbPool) return globalThis.__dbPool;
  const connectionString = ENV.DATABASE_URL();
  const isNoVerify = /\bsslmode=no-verify\b/i.test(connectionString);
  if (process.env.NODE_ENV === "production" && isNoVerify) {
    throw new Error("DATABASE_URL: sslmode=no-verify запрещён в production");
  }
  const needsRelaxedSsl = process.env.NODE_ENV !== "production" && isNoVerify;
  const pool = new pg.Pool({
    connectionString,
    ...(needsRelaxedSsl ? { ssl: { rejectUnauthorized: false } } : { ssl: { rejectUnauthorized: true } }),
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
