export function envString(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Отсутствует переменная окружения: ${name}`);
  return v;
}

export const ENV = {
  JWT_SECRET: () => envString("JWT_SECRET"),
  JWT_EXPIRES_IN: () => process.env.JWT_EXPIRES_IN ?? "7d",
  /** Connection string (Supabase: Settings → Database → URI, режим пула или прямой) */
  DATABASE_URL: () => envString("DATABASE_URL"),
  /** Авто-создание схемы/миграции при первом запросе (рекомендуется: dev=true, prod=false) */
  DB_AUTO_INIT: () => process.env.DB_AUTO_INIT ?? (process.env.NODE_ENV === "production" ? "0" : "1"),
  /** Авто-seed демо-данных при первом запросе (рекомендуется: dev=true, prod=false) */
  DB_AUTO_SEED: () => process.env.DB_AUTO_SEED ?? (process.env.NODE_ENV === "production" ? "0" : "1"),
  /** Опционально: секрет для GET /api/cron/sensor-simulation (serverless / внешний cron) */
  CRON_SECRET: () => process.env.CRON_SECRET ?? "",
  OPENAI_API_KEY: () => envString("OPENAI_API_KEY"),
} as const;

