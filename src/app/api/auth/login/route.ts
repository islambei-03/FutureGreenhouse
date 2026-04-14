import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import { db } from "@/lib/db";
import { setAuthCookie, signAuthToken } from "@/lib/auth";

const BodySchema = z.object({
  login: z.string().min(1, "Введите логин"),
  password: z.string().min(1, "Введите пароль"),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Некорректные данные" },
      { status: 400 },
    );
  }

  const { login, password } = parsed.data;
  const user = db()
    .prepare(
      `SELECT id, full_name, login, password_hash, role, is_active
       FROM users
       WHERE login = ?`,
    )
    .get(login) as
    | {
        id: number;
        full_name: string;
        login: string;
        password_hash: string;
        role: "admin" | "agronomist" | "operator" | "viewer";
        is_active: number;
      }
    | undefined;

  if (!user || !user.is_active) {
    return NextResponse.json({ ok: false, error: "Неверный логин или пароль" }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "Неверный логин или пароль" }, { status: 401 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;
  const ua = req.headers.get("user-agent") || null;

  db().prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);
  db().prepare("INSERT INTO login_history (user_id, ip, user_agent) VALUES (?, ?, ?)").run(user.id, ip, ua);
  db()
    .prepare(
      `INSERT INTO action_logs (user_id, action, entity, entity_id, details)
       VALUES (?, 'login', 'users', ?, ?)`,
    )
    .run(user.id, user.id, "Вход в систему");

  const token = await signAuthToken({
    sub: String(user.id),
    login: user.login,
    role: user.role,
    fullName: user.full_name,
  });
  await setAuthCookie(token);

  return NextResponse.json({ ok: true });
}

