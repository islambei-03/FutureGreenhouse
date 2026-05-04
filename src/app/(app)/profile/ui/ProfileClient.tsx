"use client";

import { useEffect, useMemo, useState } from "react";
import { useMe } from "@/components/auth/AuthContext";
import { RoleLabel } from "@/lib/rbac";
import { useI18n } from "@/components/i18n/I18nContext";
import RippleButton from "@/components/ui/RippleButton";
import TableScroll from "@/components/ui/TableScroll";

export default function ProfileClient() {
  const me = useMe();
  const { t: tr } = useI18n();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{
    full_name: string;
    login: string;
    role: string;
    last_login: string | null;
  } | null>(null);
  const [logins, setLogins] = useState<Array<{ id: number; ip: string | null; user_agent: string | null; created_at: string }>>([]);

  const [fullNameDraft, setFullNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  const roleLabel = useMemo(() => {
    const role = profile?.role ?? me?.role ?? null;
    if (!role) return "—";
    const key = String(role) as keyof typeof RoleLabel;
    return RoleLabel[key] ?? String(role);
  }, [profile?.role, me?.role]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as
        | null
        | { ok: true; me: { full_name: string; login: string; role: string; last_login: string | null }; logins?: unknown[] }
        | { ok: false; error?: string };
      if (!res.ok || !data?.ok) throw new Error((data && !data.ok ? data.error : null) || tr("error.network"));
      setProfile(data.me);
      setLogins(
        Array.isArray(data.logins)
          ? (data.logins as Array<{ id: number; ip: string | null; user_agent: string | null; created_at: string }>)
          : [],
      );
      setFullNameDraft(data.me?.full_name ?? "");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : null;
      setError(msg || tr("error.network"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const avatarLetter = (profile?.full_name || me?.fullName || "P")[0]?.toUpperCase();

  return (
    <main className="min-w-0 max-w-full space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="size-14 rounded-2xl grid place-items-center border border-[var(--border)] bg-black/20 text-lg font-semibold">
            {avatarLetter}
          </div>
          <div className="min-w-0">
            <div className="text-xl font-semibold truncate">{profile?.full_name ?? me?.fullName ?? "—"}</div>
            <div className="text-sm text-[var(--muted)]">
              {tr("profile.role")}: <span className="text-[var(--text)]">{roleLabel}</span>
            </div>
          </div>
          <div className="w-full text-xs text-[var(--muted)] sm:ml-auto sm:w-auto">{loading ? tr("common.loading") : ""}</div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-4 sm:p-6">
          <div className="font-semibold">{tr("profile.data.title")}</div>
          <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
            <div>
              {tr("profile.data.login")}: <span className="text-[var(--text)]">{profile?.login ?? me?.login ?? "—"}</span>
            </div>
            <div>
              {tr("profile.data.lastLogin")}:{" "}
              <span className="text-[var(--text)]">{profile?.last_login ?? "—"}</span>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-sm font-medium">{tr("profile.data.changeName")}</div>
            <div className="mt-2 flex flex-col sm:flex-row gap-2">
              <input
                value={fullNameDraft}
                onChange={(e) => setFullNameDraft(e.target.value)}
                className="flex-1 rounded-xl bg-black/20 border border-[var(--border)] px-4 py-2.5 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
                placeholder={tr("profile.data.fullName")}
              />
              <RippleButton
                className="px-4 py-2.5"
                disabled={savingName || fullNameDraft.trim().length < 3}
                onClick={async () => {
                  setSavingName(true);
                  setError(null);
                  try {
                    const res = await fetch("/api/profile", {
                      method: "PUT",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ full_name: fullNameDraft.trim() }),
                    });
                    const data = await res.json().catch(() => null);
                    if (!res.ok || !data?.ok) throw new Error(data?.error || tr("error.saveFailed"));
                    await load();
                  } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : null;
                    setError(msg || tr("error.network"));
                  } finally {
                    setSavingName(false);
                  }
                }}
              >
                {savingName ? tr("common.saving") : tr("common.save")}
              </RippleButton>
            </div>
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-4 sm:p-6">
          <div className="font-semibold">{tr("profile.security.title")}</div>
          <div className="mt-3 text-sm text-[var(--muted)]">{tr("profile.security.changePassword")}</div>
          <div className="mt-3 grid grid-cols-1 gap-2">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={tr("profile.security.currentPassword")}
              className="rounded-xl bg-black/20 border border-[var(--border)] px-4 py-2.5 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={tr("profile.security.newPassword")}
              className="rounded-xl bg-black/20 border border-[var(--border)] px-4 py-2.5 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
            />
            <div className="flex justify-end">
              <RippleButton
                className="px-4 py-2.5"
                disabled={savingPass || !currentPassword || newPassword.length < 6}
                onClick={async () => {
                  setSavingPass(true);
                  setError(null);
                  try {
                    const res = await fetch("/api/profile/password", {
                      method: "PUT",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ currentPassword, newPassword }),
                    });
                    const data = await res.json().catch(() => null);
                    if (!res.ok || !data?.ok) throw new Error(data?.error || tr("error.saveFailed"));
                    setCurrentPassword("");
                    setNewPassword("");
                  } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : null;
                    setError(msg || tr("error.network"));
                  } finally {
                    setSavingPass(false);
                  }
                }}
              >
                {savingPass ? tr("common.saving") : tr("common.save")}
              </RippleButton>
            </div>
          </div>
        </section>
      </div>

      <section className="min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="font-semibold">{tr("profile.logins.title")}</div>
          <RippleButton variant="outline" className="w-full px-4 py-2.5 sm:w-auto" onClick={load} disabled={loading}>
            {tr("ai.refresh")}
          </RippleButton>
        </div>
        <div className="mt-4">
          <TableScroll>
            <table className="w-full min-w-[32rem] text-sm">
            <thead className="text-left text-[var(--muted)]">
              <tr className="border-b border-[var(--border)]">
                <th className="p-3">{tr("profile.logins.when")}</th>
                <th className="p-3">{tr("profile.logins.ip")}</th>
                <th className="p-3">{tr("profile.logins.ua")}</th>
              </tr>
            </thead>
            <tbody>
              {logins.map((l) => (
                <tr key={l.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-white/5 transition">
                  <td className="p-3 text-[var(--muted)] whitespace-nowrap">{l.created_at}</td>
                  <td className="p-3 text-[var(--muted)] whitespace-nowrap">{l.ip ?? "—"}</td>
                  <td className="p-3 text-[var(--muted)]">{l.user_agent ?? "—"}</td>
                </tr>
              ))}
              {!logins.length ? (
                <tr>
                  <td className="p-6 text-[var(--muted)]" colSpan={3}>
                    {loading ? tr("common.loading") : "—"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          </TableScroll>
        </div>
      </section>
    </main>
  );
}

