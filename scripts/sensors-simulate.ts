import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { ENV } from "@/lib/env";
import { initSchema } from "@/lib/db/schema";
import { runMigrations } from "@/lib/db/migrations";

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

type Args = {
  intervalMs: number;
  jitter: number;
  gh?: number;
  once: boolean;
  quiet: boolean;
};

function parseArgs(argv: string[]): Args {
  const a: Args = { intervalMs: 5_000, jitter: 0.25, once: false, quiet: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    if (k === "--interval-ms" && v) {
      a.intervalMs = Math.max(500, Number(v));
      i++;
      continue;
    }
    if (k === "--jitter" && v) {
      const n = Number(v);
      a.jitter = Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : a.jitter;
      i++;
      continue;
    }
    if (k === "--gh" && v) {
      a.gh = Number(v);
      i++;
      continue;
    }
    if (k === "--once") {
      a.once = true;
      continue;
    }
    if (k === "--quiet") {
      a.quiet = true;
      continue;
    }
    if (k === "--help" || k === "-h") {
      printHelpAndExit(0);
    }
  }
  if (!Number.isFinite(a.intervalMs) || a.intervalMs < 500) a.intervalMs = 5_000;
  return a;
}

function printHelpAndExit(code: number) {
  console.log(
    [
      "Future Greenhouse — live sensor simulator",
      "",
      "Usage:",
      "  npm run sensors:simulate -- [--interval-ms 5000] [--jitter 0.25] [--gh 1] [--once] [--quiet]",
      "",
      "Notes:",
      "  - Writes new rows into sensor_data periodically (imitates connected sensors).",
      "  - Prefer admin UI: /db → «Симуляция датчиков» (удобно на хостинге).",
      "  - Manual input (/sensor-entry) remains as plan B when sensors fail.",
      "",
    ].join("\n"),
  );
  process.exit(code);
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function clamp(x: number, min: number, max: number) {
  return Math.max(min, Math.min(max, x));
}

type GhNorm = {
  id: number;
  name: string;
  temp_min: number;
  temp_max: number;
  humidity_min: number;
  humidity_max: number;
  status: string;
};

async function loadGreenhouses(pool: pg.Pool, gh?: number): Promise<GhNorm[]> {
  if (gh != null) {
    const row = await pool
      .query<GhNorm>(
        `SELECT id, name, temp_min, temp_max, humidity_min, humidity_max, status
         FROM greenhouses
         WHERE id=$1
         LIMIT 1`,
        [gh],
      )
      .then((r) => r.rows[0]);
    return row ? [row] : [];
  }
  const rows = await pool
    .query<GhNorm>(
      `SELECT id, name, temp_min, temp_max, humidity_min, humidity_max, status
       FROM greenhouses
       ORDER BY id ASC`,
    )
    .then((r) => r.rows);
  return rows;
}

async function lastSensor(pool: pg.Pool, greenhouseId: number) {
  const r = await pool.query<{ temperature: number; humidity: number; co2: number }>(
    `SELECT temperature, humidity, co2
     FROM sensor_data
     WHERE greenhouse_id=$1
     ORDER BY recorded_at DESC
     LIMIT 1`,
    [greenhouseId],
  );
  return r.rows[0] ?? null;
}

function nextReading(opts: {
  gh: GhNorm;
  prev: { temperature: number; humidity: number; co2: number } | null;
  jitter: number;
}) {
  const { gh, prev, jitter } = opts;

  const tCenter = (gh.temp_min + gh.temp_max) / 2;
  const hCenter = (gh.humidity_min + gh.humidity_max) / 2;

  // Базовый дрейф вокруг центра нормы + небольшой шум.
  const tBase = prev ? prev.temperature : tCenter;
  const hBase = prev ? prev.humidity : hCenter;
  const cBase = prev ? prev.co2 : 700;

  const tStep = rand(-0.6, 0.6) * (1 + jitter);
  const hStep = rand(-1.8, 1.8) * (1 + jitter);
  const cStep = rand(-25, 25) * (1 + jitter);

  // Небольшая "пружина" к центру нормы, чтобы не улетало.
  const tSpring = (tCenter - tBase) * 0.08;
  const hSpring = (hCenter - hBase) * 0.06;

  const temperature = clamp(tBase + tStep + tSpring, gh.temp_min - 6, gh.temp_max + 6);
  const humidity = clamp(hBase + hStep + hSpring, 0, 100);
  const co2 = clamp(cBase + cStep + rand(-8, 8), 350, 2000);

  return {
    temperature: Number(temperature.toFixed(1)),
    humidity: Number(humidity.toFixed(1)),
    co2: Math.round(co2),
  };
}

async function insertReading(pool: pg.Pool, greenhouseId: number, r: { temperature: number; humidity: number; co2: number }) {
  await pool.query(
    `INSERT INTO sensor_data (greenhouse_id, temperature, humidity, co2, recorded_at, recorded_by_user_id)
     VALUES ($1, $2, $3, $4, now(), NULL)`,
    [greenhouseId, r.temperature, r.humidity, r.co2],
  );
}

async function tick(pool: pg.Pool, args: Args) {
  const greenhouses = await loadGreenhouses(pool, args.gh);
  if (!greenhouses.length) {
    if (!args.quiet) {
      console.log("Нет теплиц для симуляции. Сначала выполните npm run db:setup (seed создаёт теплицы).");
    }
    return;
  }

  for (const gh of greenhouses) {
    if (gh.status === "отключена") continue;
    const prev = await lastSensor(pool, gh.id);
    const r = nextReading({ gh, prev, jitter: args.jitter });
    await insertReading(pool, gh.id, r);
    if (!args.quiet) {
      console.log(`[${new Date().toISOString()}] gh#${gh.id} ${gh.name}: T=${r.temperature} H=${r.humidity} CO2=${r.co2}`);
    }
  }
}

async function main() {
  loadEnv();
  const args = parseArgs(process.argv.slice(2));

  const connectionString = ENV.DATABASE_URL();
  const isNoVerify = /\bsslmode=no-verify\b/i.test(connectionString);
  const pool = new pg.Pool({
    connectionString,
    ...(isNoVerify ? { ssl: { rejectUnauthorized: false } } : {}),
    max: 2,
  });

  try {
    // Симулятор должен уметь поднимать схему в dev (по аналогии с db:setup),
    // иначе он не сможет писать sensor_data в "чистую" БД.
    await initSchema(pool);
    await runMigrations(pool);

    if (!args.quiet) {
      console.log("Симулятор датчиков запущен. Остановить: Ctrl+C");
    }

    await tick(pool, args);
    if (args.once) return;

    const timer = setInterval(() => {
      tick(pool, args).catch((e) => {
        console.error("simulate tick failed:", e);
      });
    }, args.intervalMs);

    process.on("SIGINT", async () => {
      clearInterval(timer);
      await pool.end().catch(() => null);
      process.exit(0);
    });
  } finally {
    if (args.once) await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

