"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RippleButton from "@/components/ui/RippleButton";
import { useI18n } from "@/components/i18n/I18nContext";

export default function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const from = useMemo(() => sp.get("from") || "/", [sp]);
  const { t } = useI18n();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || t("error.loginFailed"));
        return;
      }
      router.replace(from);
      router.refresh();
    } catch {
      setError(t("error.network"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm text-[var(--muted)]">{t("login.login")}</label>
        <input
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
          placeholder="например: admin"
          autoComplete="username"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-[var(--muted)]">{t("login.password")}</label>
        <div className="relative">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={showPassword ? "text" : "password"}
            className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 pr-14 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
            placeholder={t("login.password")}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-2 text-xs text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/5 transition"
            aria-label={showPassword ? t("login.hide") : t("login.show")}
          >
            {showPassword ? t("login.hide") : t("login.show")}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <RippleButton disabled={loading || !login || !password} className="w-full">
        {loading ? t("login.signingIn") : t("login.signIn")}
      </RippleButton>
    </form>
  );
}

