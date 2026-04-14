"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/I18nContext";

type ChatRow = {
  id: number;
  role: "system" | "user" | "assistant";
  content: string;
  created_at: string;
};

type Quick = { label: string; prompt: string };

function quick(locale: "ru" | "kk", t: (k: any) => string): Quick[] {
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
          "max-w-[820px] rounded-2xl border px-4 py-3 text-sm whitespace-pre-wrap",
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

export default function AiPage() {
  const { t: tr, locale } = useI18n();
  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [greenhouses, setGreenhouses] = useState<Array<{ id: number; name: string }>>([]);
  const [greenhouseId, setGreenhouseId] = useState<number | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const visible = useMemo(() => messages.filter((m) => m.role !== "system"), [messages]);

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai", { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as null | { ok: boolean; messages: ChatRow[]; error?: string };
      if (data?.ok) setMessages(data.messages);
      else setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/greenhouses", { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as any;
        if (data?.ok && Array.isArray(data.greenhouses)) {
          setGreenhouses(data.greenhouses.map((g: any) => ({ id: g.id, name: g.name })));
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visible.length, thinking]);

  async function send(text: string) {
    const msg = text.trim();
    if (!msg) return;
    setError(null);
    setThinking(true);
    setInput("");

    // optimistic
    const optimistic: ChatRow = {
      id: Date.now(),
      role: "user",
      content: msg,
      created_at: new Date().toISOString(),
    };
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
      const assistant: ChatRow = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.reply,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistant]);
    } catch {
      setError(tr("error.network"));
    } finally {
      setThinking(false);
    }
  }

  return (
    <main className="space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold">{tr("ai.title")}</div>
            <div className="text-sm text-[var(--muted)] mt-1">
              {tr("ai.subtitle")}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={greenhouseId == null ? "" : String(greenhouseId)}
              onChange={(e) => setGreenhouseId(e.target.value ? Number(e.target.value) : null)}
              className="rounded-xl bg-black/20 border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
              disabled={thinking}
              title={tr("ai.greenhouseSelect")}
            >
              <option value="">{tr("ai.greenhouseAll")}</option>
              {greenhouses.map((g) => (
                <option key={g.id} value={String(g.id)}>
                  {g.name}
                </option>
              ))}
            </select>
            <div className="text-xs text-[var(--muted)]">{loading ? tr("common.loading") : tr("ai.ready")}</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
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

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]">
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between gap-3">
          <div className="font-semibold">{tr("ai.dialog.title")}</div>
          <button
            onClick={loadHistory}
            className="rounded-xl px-3 py-2 text-sm border border-[var(--border)] bg-black/10 hover:bg-white/5 transition"
            disabled={thinking}
          >
            {tr("ai.refresh")}
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[60vh] overflow-auto">
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

          {!visible.length && !loading ? (
            <div className="text-sm text-[var(--muted)]">{tr("ai.empty")}</div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <div className="p-5 border-t border-[var(--border)]">
          {error ? (
            <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex flex-col md:flex-row gap-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={tr("ai.inputPlaceholder")}
              className="flex-1 rounded-xl bg-black/20 border border-[var(--border)] px-4 py-3 outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent)]/20 transition"
              disabled={thinking}
            />
            <button
              className="rounded-xl px-4 py-3 font-medium bg-[color:var(--accent)] text-black hover:brightness-110 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
              disabled={thinking || !input.trim()}
            >
              {tr("ai.send")}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

