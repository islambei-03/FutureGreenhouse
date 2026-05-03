import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { attachAuthCookie, signAuthToken } from "@/lib/auth";

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

  try {
    const { login, password } = parsed.data;
    const user = (await db()
      .prepare(
        `SELECT id, full_name, login, password_hash, role, is_active
       FROM users
       WHERE login = ?`,
      )
      .get(login)) as
      | {
          id: number;
          full_name: string;
          login: string;
          password_hash: string;
          role: "admin" | "director" | "agronomist" | "worker";
          is_active: number;
        }
      | undefined;

    if (!user || !user.is_active) {
      return NextResponse.json({ ok: false, error: "Неверный логин или пароль" }, { status: 401 });
    }

    const pwOk = bcrypt.compareSync(password, user.password_hash);
    if (!pwOk) {
      return NextResponse.json({ ok: false, error: "Неверный логин или пароль" }, { status: 401 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;
    const ua = req.headers.get("user-agent") || null;

    await db().prepare(`UPDATE users SET last_login = now() WHERE id = ?`).run(user.id);
    try {
      await db()
        .prepare("INSERT INTO login_history (user_id, ip, user_agent) VALUES (?, ?, ?)")
        .run(user.id, ip, ua);
      await db()
        .prepare(
          `INSERT INTO action_logs (user_id, action, entity, entity_id, details)
       VALUES (?, 'login', 'users', ?, ?)`,
        )
        .run(user.id, user.id, "Вход в систему");
    } catch (auditErr) {
      console.error("[api/auth/login] audit tables failed (миграции не применены или нет таблиц?)", auditErr);
    }

    const token = await signAuthToken({
      sub: String(user.id),
      login: user.login,
      role: user.role,
      fullName: user.full_name,
    });

    const res = NextResponse.json({ ok: true });
    attachAuthCookie(res, token);
    return res;
  } catch (e) {
    console.error("[api/auth/login]", e);
    const debug =
      process.env.LOGIN_DEBUG === "1" && e instanceof Error ? e.message : null;
    return NextResponse.json(
      {
        ok: false,
        error:
          debug ??
          "Ошибка сервера при входе. На Vercel проверьте DATABASE_URL и JWT_SECRET; выполните npm run db:migrate к этой же базе. Для точной причины временно добавьте LOGIN_DEBUG=1 в Env и перезадеплойте.",
      },
      { status: 500 },
    );
  }
}
