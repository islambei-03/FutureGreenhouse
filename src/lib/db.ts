import Database from "better-sqlite3";
import { ENV } from "@/lib/env";
import { ensureParentDir } from "@/lib/fs";
import { initSchema } from "@/lib/db/schema";
import { seedAll } from "@/lib/db/seed";
import { runMigrations } from "@/lib/db/migrations";

declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

export function db(): Database.Database {
  if (global.__db) return global.__db;

  const dbPath = ENV.DATABASE_PATH();
  ensureParentDir(dbPath);
  const instance = new Database(dbPath);
  instance.pragma("journal_mode = WAL");
  instance.pragma("foreign_keys = ON");

  initSchema(instance);
  runMigrations(instance);
  seedAll(instance);

  global.__db = instance;
  return instance;
}

