"use client";

import { useRef, useState } from "react";
import { useI18n } from "@/components/i18n/I18nContext";
import type { PlantVisionResult } from "@/lib/ai/vision";
import AiTabInfo from "@/components/ai/AiTabInfo";

export default function PlantVisionPanel() {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlantVisionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onPick(f: File | null) {
    setResult(null);
    setError(null);
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function analyze() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/ai/vision", { method: "POST", body: fd });
      const data = (await res.json()) as { ok: boolean; result?: PlantVisionResult; error?: string };
      if (data.ok && data.result) setResult(data.result);
      else setError(data.error || t("ai.vision.failed"));
    } catch {
      setError(t("error.network"));
    } finally {
      setLoading(false);
    }
  }

  const confClass =
    result?.confidence === "высокая"
      ? "text-emerald-300"
      : result?.confidence === "низкая"
        ? "text-amber-300"
        : "text-cyan-300";

  return (
    <section className="space-y-4">
      <header>
        <h3 className="font-semibold">{t("ai.vision.title")}</h3>
        <p className="text-sm text-[var(--muted)] mt-1">{t("ai.vision.subtitle")}</p>
        <p className="text-xs text-[var(--muted)] mt-2">{t("ai.vision.hint")}</p>
      </header>

      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-black/10 p-6 text-center">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="mx-auto max-h-56 rounded-xl object-contain border border-[var(--border)]" />
        ) : (
          <p className="text-sm text-[var(--muted)] py-8">{t("ai.vision.dropHint")}</p>
        )}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-xl px-4 py-2 text-sm border border-[var(--border)] bg-black/20 hover:bg-white/5"
          >
            {t("ai.vision.pick")}
          </button>
          <button
            type="button"
            onClick={analyze}
            disabled={!file || loading}
            className="rounded-xl px-5 py-2 text-sm font-medium bg-[color:var(--accent)] text-black disabled:opacity-50"
          >
            {loading ? t("ai.vision.analyzing") : t("ai.vision.analyze")}
          </button>
        </div>
        <p className="text-xs text-[var(--muted)] mt-3">{t("ai.vision.limit")}</p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>
      ) : null}

      {result ? (
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
          <div>
            <p className="text-xs text-[var(--muted)]">{t("ai.vision.diagnosis")}</p>
            <p className="font-medium mt-1">{result.diagnosis}</p>
            <p className={["text-xs mt-2", confClass].join(" ")}>
              {t("ai.vision.confidence")}: {result.confidence}
            </p>
          </div>
          {result.issues.length ? (
            <div>
              <p className="text-sm font-medium mb-2">{t("ai.vision.issues")}</p>
              <ul className="text-sm text-[var(--muted)] space-y-1">
                {result.issues.map((x) => (
                  <li key={x}>• {x}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {result.actions.length ? (
            <div>
              <p className="text-sm font-medium mb-2">{t("ai.vision.actions")}</p>
              <ul className="text-sm space-y-1">
                {result.actions.map((x) => (
                  <li key={x} className="rounded-lg bg-[color:var(--accent)]/10 border border-[color:var(--accent)]/20 px-3 py-2">
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {result.prevention ? (
            <p className="text-sm text-[var(--muted)] border-t border-[var(--border)] pt-3">
              <span className="font-medium text-[var(--foreground)]">{t("ai.vision.prevention")}: </span>
              {result.prevention}
            </p>
          ) : null}
        </article>
      ) : null}
      <AiTabInfo titleKey="ai.info.vision.title" bodyKey="ai.info.vision.body" dataKey="ai.info.vision.data" />
    </section>
  );
}
