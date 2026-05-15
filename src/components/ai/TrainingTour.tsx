"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n/I18nContext";
import type { I18nKey } from "@/lib/i18n";
import AiTabInfo from "@/components/ai/AiTabInfo";

type Step = {
  titleKey: I18nKey;
  textKey: I18nKey;
  questionKey?: I18nKey;
  options?: { key: I18nKey; correct: boolean }[];
};

const STEPS: Step[] = [
  { titleKey: "ai.training.s1.title", textKey: "ai.training.s1.text" },
  {
    titleKey: "ai.training.s2.title",
    textKey: "ai.training.s2.text",
    questionKey: "ai.training.s2.q",
    options: [
      { key: "ai.training.s2.a1", correct: false },
      { key: "ai.training.s2.a2", correct: true },
      { key: "ai.training.s2.a3", correct: false },
    ],
  },
  {
    titleKey: "ai.training.s3.title",
    textKey: "ai.training.s3.text",
    questionKey: "ai.training.s3.q",
    options: [
      { key: "ai.training.s3.a1", correct: true },
      { key: "ai.training.s3.a2", correct: false },
    ],
  },
  {
    titleKey: "ai.training.s4.title",
    textKey: "ai.training.s4.text",
    questionKey: "ai.training.s4.q",
    options: [
      { key: "ai.training.s4.a1", correct: false },
      { key: "ai.training.s4.a2", correct: true },
    ],
  },
  { titleKey: "ai.training.s5.title", textKey: "ai.training.s5.text" },
];

export default function TrainingTour() {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"ok" | "bad" | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const current = STEPS[step];
  const hasQuiz = !!current?.options?.length;

  function answer(idx: number) {
    if (!current?.options) return;
    setPicked(idx);
    const ok = current.options[idx]?.correct ?? false;
    setFeedback(ok ? "ok" : "bad");
    if (ok) setScore((s) => s + 1);
  }

  function next() {
    if (step >= STEPS.length - 1) {
      setDone(true);
      return;
    }
    setStep((s) => s + 1);
    setPicked(null);
    setFeedback(null);
  }

  function restart() {
    setStep(0);
    setPicked(null);
    setFeedback(null);
    setScore(0);
    setDone(false);
  }

  if (done) {
    return (
      <section className="space-y-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
          <p className="text-lg font-semibold">{t("ai.training.complete")}</p>
          <p className="text-sm text-[var(--muted)] mt-2">
            {t("ai.training.score")}: {score} / {STEPS.filter((s) => s.options?.length).length}
          </p>
          <button
            type="button"
            onClick={restart}
            className="mt-4 rounded-xl px-5 py-2.5 bg-[color:var(--accent)] text-black font-medium"
          >
            {t("ai.training.restart")}
          </button>
        </div>
        <AiTabInfo titleKey="ai.info.training.title" bodyKey="ai.info.training.body" dataKey="ai.info.training.data" />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <header>
        <h3 className="font-semibold">{t("ai.training.title")}</h3>
        <p className="text-sm text-[var(--muted)] mt-1">{t("ai.training.subtitle")}</p>
        <p className="text-xs text-[var(--muted)] mt-2">
          {t("ai.training.progress")} {step + 1} / {STEPS.length}
        </p>
      </header>

      <article className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6 space-y-4">
        <p className="text-xs uppercase tracking-wide text-cyan-400/80">{t("ai.training.guide")}</p>
        <h4 className="text-lg font-medium">{t(current.titleKey)}</h4>
        <p className="text-sm text-[var(--muted)] leading-relaxed">{t(current.textKey)}</p>

        {hasQuiz && current.questionKey ? (
          <div className="space-y-3 pt-2 border-t border-[var(--border)]">
            <p className="text-sm font-medium">{t(current.questionKey)}</p>
            <div className="space-y-2">
              {current.options!.map((opt, idx) => (
                <button
                  key={opt.key}
                  type="button"
                  disabled={picked !== null}
                  onClick={() => answer(idx)}
                  className={[
                    "w-full text-left rounded-xl border px-4 py-3 text-sm transition",
                    picked === idx
                      ? opt.correct
                        ? "border-emerald-500/50 bg-emerald-500/15"
                        : "border-red-500/50 bg-red-500/15"
                      : "border-[var(--border)] bg-black/10 hover:bg-white/5",
                  ].join(" ")}
                >
                  {t(opt.key)}
                </button>
              ))}
            </div>
            {feedback === "ok" ? (
              <p className="text-sm text-emerald-300">{t("ai.training.correct")}</p>
            ) : null}
            {feedback === "bad" ? (
              <p className="text-sm text-red-300">{t("ai.training.wrong")}</p>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          onClick={next}
          disabled={hasQuiz && picked === null}
          className="rounded-xl px-5 py-2.5 font-medium bg-[color:var(--accent)] text-black disabled:opacity-50"
        >
          {step >= STEPS.length - 1 ? t("ai.training.finish") : t("ai.training.next")}
        </button>
      </article>

      <AiTabInfo titleKey="ai.info.training.title" bodyKey="ai.info.training.body" dataKey="ai.info.training.data" />
    </section>
  );
}
