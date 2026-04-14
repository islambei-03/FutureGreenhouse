export function envString(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Отсутствует переменная окружения: ${name}`);
  return v;
}

export const ENV = {
  JWT_SECRET: () => envString("JWT_SECRET"),
  JWT_EXPIRES_IN: () => process.env.JWT_EXPIRES_IN ?? "7d",
  DATABASE_PATH: () => process.env.DATABASE_PATH ?? "./data/app.db",
  OPENAI_API_KEY: () => envString("OPENAI_API_KEY"),
} as const;

