import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { ENV } from "@/lib/env";
import { initSchema } from "@/lib/db/schema";
import { runMigrations } from "@/lib/db/migrations";
import { seedAll } from "@/lib/db/seed";

function loadEnvFile(p: string) {
  if (!fs.existsSync(p)) return;
  const txt = fs.readFileSync(p, "utf8");
  for (const line of txt.split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;
    const i = s.indexOf("=");
    if (i < 0) continue;
    const k = s.slice(0, i).trim();
    const v = s.slice(i + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
}

function loadEnv() {
  const cwd = process.cwd();
  loadEnvFile(path.join(cwd, ".env.local"));
  loadEnvFile(path.join(cwd, ".env"));
}

async function main() {
  loadEnv();

  const cmd = process.argv[2];
  if (!cmd || !["migrate", "seed", "setup"].includes(cmd)) {
    console.error("Usage: npm run db:migrate | db:seed | db:setup");
    process.exit(2);
  }

  const connectionString = ENV.DATABASE_URL();
  const isNoVerify = /\bsslmode=no-verify\b/i.test(connectionString);
  const pool = new pg.Pool({
    connectionString,
    ...(isNoVerify ? { ssl: { rejectUnauthorized: false } } : {}),
    max: 2,
  });

  try {
    if (cmd === "migrate" || cmd === "setup") {
      await initSchema(pool);
      await runMigrations(pool);
      console.log("db:migrate OK");
    }
    if (cmd === "seed" || cmd === "setup") {
      await seedAll(pool);
      console.log("db:seed OK");
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

