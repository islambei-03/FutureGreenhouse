"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/I18nContext";
import type { I18nKey } from "@/lib/i18n";
import ForecastChart from "@/components/ai/ForecastChart";
import HealthRing from "@/components/ai/HealthRing";
import type { GreenhouseForecast } from "@/lib/ai/forecast";
import type { GreenhouseHealth } from "@/lib/ai/health";
import type { AiRecommendation } from "@/lib/ai/recommendations";

type AiTab = "chat" | "forecast" | "health" | "recommendations";

type ChatRow = {
  id: number;
  role: "system" | "user" | "assistant";
  content: string;
  created_at: string;
};

type Quick = { label: string; prompt: string };

function quick(locale: "ru" | "kk", t: (k: I18nKey) => string): Quick[] {
  if (locale === "kk") {
    return [
      { label: t("ai.quick.careTomatoes"), prompt: "Осы аптаға жылыжайдағы қызанақ күтімі бойынша қысқа жоспар бер." },
      { label: t("ai.quick.optimalWatering"), prompt: "Ағымдағы көрсеткіштерді ескеріп, бір аптаға суаруды қалай оңтайландыруға болады?" },
      { label: t("ai.quick.pestControl"), prompt: "Зиянкестердің алғашқы белгілері қандай және жылыжайда не істеу керек?" },
      { label: t("ai.quick.analyze"), prompt: "Ағымдағы деректер бойынша жылыжайларды талдап, ұсыныстар бер." },
    ];
  }
  return [
    { label: t("ai.quick.careTomatoes"), prompt: "Дай краткий план ухода за томатами в теплице на этой неделе." },
    { label: t("ai.quick.optimalWatering"), prompt: "Как оптимизировать полив на неделю с учетом текущих показаний?" },
    { label: t("ai.quick.pestControl"), prompt: "Какие первые признаки вредителей и что делать в теплице?" },
    { label: t("ai.quick.analyze"), prompt: "Проанализируй теплицы по текущим данным и дай рекомендации." },
  ];
}

function Bubble({ role, children }: { role: ChatRow["role"]; children: React.ReactNode }) {
  const isUser = role === "user";
  return (
    <div className={["flex", isUser ? "justify-end" : "justify-start"].join(" ")}>
      <div
        className={[
          "max-w-[min(100%,42rem)] sm:max-w-[820px] rounded-2xl border px-4 py-3 text-sm whitespace-pre-wrap break-words",
          isUser
            ? "border-[color:var(--accent)]/30 bg-[color:var(--accent)]/10"
            : "border-[var(--border)] bg-black/10",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}

function recTone(level: AiRecommendation["level"]) {
  if (level === "danger") return "border-red-500/30 bg-red-500/10 text-red-100";
  if (level === "warning") return "border-yellow-400/30 bg-yellow-400/10 text-yellow-100";
  if (level === "success") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
  return "border-blue-400/30 bg-blue-400/10 text-blue-100";
}

export default function AiPage() {
  const { t: tr, locale } = useI18n();
  const [tab, setTab] = useState<AiTab>("chat");

  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [greenhouses, setGreenhouses] = useState<Array<{ id: number; name: string }>>([]);
  const [greenhouseId, setGreenhouseId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [forecast, setForecast] = useState<GreenhouseForecast | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastGh, setForecastGh] = useState<number | null>(null);

  const [health, setHealth] = useState<GreenhouseHealth[]>([]);
  const [healthLoading, setHealthLoading] = useState(false);

  const [recommendations, setRecommendations] = useState<AiRecommendation[]>([]);
  const [recLoading, setRecLoading] = useState(false);

  const visible = useMemo(() => messages.filter((m) => m.role !== "system"), [messages]);

  async function loadHistory() {
    setChatLoading(true);
    try {
      const res = await fetch("/api/ai", { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as null | { ok: boolean; messages: ChatRow[] };
      if (data?.ok) setMessages(data.messages);
    } finally {
      setChatLoading(false);
    }
  }

  async function loadGreenhouses() {
    const res = await fetch("/api/greenhouses", { cache: "no-store" });
    const data = (await res.json().catch(() => null)) as null | { ok: true; greenhouses: Array<{ id: number; name: string }> };
    if (data?.ok) {
      setGreenhouses(data.greenhouses.map((g) => ({ id: g.id, name: g.name })));
      if (!forecastGh && data.greenhouses[0]) setForecastGh(data.greenhouses[0].id);
    }
  }

  async function loadHealth() {
    setHealthLoading(true);
    try {
      const res = await fetch("/api/ai/health", { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as null | { ok: boolean; health: GreenhouseHealth[] };
      if (data?.ok) setHealth(data.health);
    } finally {
      setHealthLoading(false);
    }
  }

  async function loadRecommendations() {
    setRecLoading(true);
    try {
      const res = await fetch("/api/ai/recommendations", { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as null | { ok: boolean; recommendations: AiRecommendation[] };
      if (data?.ok) setRecommendations(data.recommendations);
    } finally {
      setRecLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
    loadGreenhouses();
  }, []);

  useEffect(() => {
    if (tab === "health") loadHealth();
    if (tab === "recommendations") loadRecommendations();
  }, [tab]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visible.length, thinking]);

  async function send(text: string) {
    const msg = text.trim();
    if (!msg) return;
    setError(null);
    setThinking(true);
    setInput("");
    const optimistic: ChatRow = { id: Date.now(), role: "user", content: msg, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: msg, greenhouse_id: greenhouseId }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; reply?: string; error?: string };
      if (!res.ok || !data.ok || !data.reply) {
        setError(data.error || tr("ai.error.noReply"));
        return;
      }
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: data.reply!, created_at: new Date().toISOString() },
      ]);
    } catch {
      setError(tr("error.network"));
    } finally {
      setThinking(false);
    }
  }

  async function runForecast() {
    if (!forecastGh) return;
    setForecastLoading(true);
    setForecast(null);
    try {
      const res = await fetch(`/api/ai/forecast?greenhouse_id=${forecastGh}`, { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as null | { ok: boolean; forecast: GreenhouseForecast; error?: string };
      if (data?.ok) setForecast(data.forecast);
      else setError(data?.error || tr("ai.error.noReply"));
    } catch {
      setError(tr("error.network"));
    } finally {
      setForecastLoading(false);
    }
  }

  const tabBtn = (id: AiTab, key: I18nKey) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={[
        "rounded-xl px-4 py-2 text-sm font-medium border transition",
        tab === id
          ? "border-[color:var(--accent)] bg-[color:var(--accent)]/15 text-[color:var(--accent)]"
          : "border-[var(--border)] bg-black/20 text-[var(--muted)] hover:bg-white/5",
      ].join(" ")}
    >
      {tr(key)}
    </button>
  );

  return (
    <main className="min-w-0 max-w-full space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-4 sm:p-6">
        <div className="text-xl font-semibold">{tr("ai.title")}</div>
        <p className="text-sm text-[var(--muted)] mt-1">{tr("ai.subtitle")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {tabBtn("chat", "ai.tab.chat")}
          {tabBtn("forecast", "ai.tab.forecast")}
          {tabBtn("health", "ai.tab.health")}
          {tabBtn("recommendations", "ai.tab.recommendations")}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      {tab === "chat" ? (
        <>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <select
                value={greenhouseId == null ? "" : String(greenhouseId)}
                onChange={(e) => setGreenhouseId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-xl bg-black/20 border border-[var(--border)] px-3 py-2 text-sm sm:max-w-xs"
                disabled={thinking}
              >
                <option value="">{tr("ai.greenhouseAll")}</option>
                {greenhouses.map((g) => (
                  <option key={g.id} value={String(g.id)}>
                    {g.name}
                  </option>
                ))}
              </select>
              <div className="text-xs text-[var(--muted)]">{chatLoading ? tr("common.loading") : tr("ai.ready")}</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {quick(locale, tr).map((q) => (
                <button
                  key={q.label}
                  onClick={() => send(q.prompt)}
                  className="rounded-xl px-3 py-2 text-sm border border-[var(--border)] bg-black/10 hover:bg-white/5 transition"
                  disabled={thinking}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
              <div className="font-semibold">{tr("ai.dialog.title")}</div>
              <button
                type="button"
                onClick={loadHistory}
                className="rounded-xl px-3 py-2 text-sm border border-[var(--border)] bg-black/10 hover:bg-white/5"
                disabled={thinking}
              >
                {tr("ai.refresh")}
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[55vh] overflow-auto">
              {visible.map((m) => (
                <Bubble key={m.id} role={m.role}>
                  {m.content}
                </Bubble>
              ))}
              {thinking ? (
                <Bubble role="assistant">
                  <span className="text-[var(--muted)]">{tr("ai.typing")}</span>
                </Bubble>
              ) : null}
              {!visible.length && !chatLoading ? <div className="text-sm text-[var(--muted)]">{tr("ai.empty")}</div> : null}
              <div ref={bottomRef} />
            </div>
            <form
              className="p-5 border-t border-[var(--border)] flex flex-col md:flex-row gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={tr("ai.inputPlaceholder")}
                className="flex-1 rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)]"
                disabled={thinking}
              />
              <button
                type="submit"
                disabled={thinking || !input.trim()}
                className="rounded-xl px-4 py-3 font-medium bg-[color:var(--accent)] text-black disabled:opacity-50"
              >
                {tr("ai.send")}
              </button>
            </form>
          </section>
        </>
      ) : null}

      {tab === "forecast" ? (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6 space-y-4">
          <div>
            <div className="font-semibold">{tr("ai.forecast.title")}</div>
            <p className="text-sm text-[var(--muted)] mt-1">{tr("ai.forecast.subtitle")}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={forecastGh ?? ""}
              onChange={(e) => setForecastGh(Number(e.target.value))}
              className="flex-1 rounded-xl bg-black/20 border border-[var(--border)] px-4 py-2.5"
            >
              {greenhouses.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={runForecast}
              disabled={forecastLoading || !forecastGh}
              className="rounded-xl px-5 py-2.5 font-medium bg-[color:var(--accent)] text-black disabled:opacity-50"
            >
              {forecastLoading ? tr("common.loading") : tr("ai.forecast.run")}
            </button>
          </div>
          {forecast ? <ForecastChart forecast={forecast} /> : <p className="text-sm text-[var(--muted)]">{tr("ai.forecast.empty")}</p>}
        </section>
      ) : null}

      {tab === "health" ? (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <div className="font-semibold">{tr("ai.health.title")}</div>
          <p className="text-sm text-[var(--muted)] mt-1 mb-4">{tr("ai.health.subtitle")}</p>
          {healthLoading ? (
            <p className="text-sm text-[var(--muted)]">{tr("common.loading")}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {health.map((h) => (
                <div key={h.id} className="rounded-2xl border border-[var(--border)] bg-black/10 p-4 flex gap-4">
                  <HealthRing pct={h.healthPct} size={56} />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{h.name}</div>
                    <div className="text-xs text-[var(--muted)] mt-0.5">
                      {tr("ai.health.score")}: {h.healthPct}%
                    </div>
                    <ul className="mt-2 text-xs text-[var(--muted)] space-y-1">
                      {h.factors.slice(0, 3).map((f) => (
                        <li key={f}>• {f}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {tab === "recommendations" ? (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="font-semibold">{tr("ai.recommendations.title")}</div>
              <p className="text-sm text-[var(--muted)] mt-1">{tr("ai.recommendations.subtitle")}</p>
            </div>
            <button
              type="button"
              onClick={loadRecommendations}
              className="rounded-xl px-3 py-2 text-sm border border-[var(--border)] bg-black/10 hover:bg-white/5 shrink-0"
            >
              {tr("ai.recommendations.refresh")}
            </button>
          </div>
          {recLoading ? (
            <p className="text-sm text-[var(--muted)]">{tr("common.loading")}</p>
          ) : (
            <div className="space-y-3">
              {recommendations.map((r, i) => (
                <div key={i} className={["rounded-2xl border px-4 py-3 text-sm", recTone(r.level)].join(" ")}>
                  <span className="mr-2">{r.icon}</span>
                  {r.text}
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}
