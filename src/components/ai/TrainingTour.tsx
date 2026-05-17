"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/components/i18n/I18nContext";
import type { I18nKey } from "@/lib/i18n";
import { NAV_ITEMS } from "@/components/layout/nav";
import type { UserRole } from "@/lib/auth";
import AiTabInfo from "@/components/ai/AiTabInfo";

type TrackRole = "agronomist" | "worker";

type GuideStep = {
  labelKey: (typeof NAV_ITEMS)[number]["labelKey"];
  icon: string;
  purposeKey: I18nKey;
  howKey: I18nKey;
  tipKey?: I18nKey;
};

const GUIDES: Record<TrackRole, GuideStep[]> = {
  worker: [
    {
      labelKey: "nav.dashboard",
      icon: "🏠",
      purposeKey: "ai.training.guide.dashboard.purpose",
      howKey: "ai.training.guide.dashboard.how",
    },
    {
      labelKey: "nav.greenhouses",
      icon: "🏡",
      purposeKey: "ai.training.guide.greenhouses.purpose",
      howKey: "ai.training.guide.greenhouses.how",
    },
    {
      labelKey: "nav.parameters",
      icon: "📈",
      purposeKey: "ai.training.guide.parameters.purpose",
      howKey: "ai.training.guide.parameters.how",
    },
    {
      labelKey: "nav.watering",
      icon: "💧",
      purposeKey: "ai.training.guide.watering.purpose",
      howKey: "ai.training.guide.watering.how",
    },
    {
      labelKey: "nav.tasks",
      icon: "✅",
      purposeKey: "ai.training.guide.tasks.purpose",
      howKey: "ai.training.guide.tasks.how",
      tipKey: "ai.training.guide.tasks.tip",
    },
    {
      labelKey: "nav.notifications",
      icon: "🔔",
      purposeKey: "ai.training.guide.notifications.purpose",
      howKey: "ai.training.guide.notifications.how",
    },
    {
      labelKey: "nav.sensorEntry",
      icon: "🧪",
      purposeKey: "ai.training.guide.sensorEntry.purpose",
      howKey: "ai.training.guide.sensorEntry.how",
    },
  ],
  agronomist: [
    {
      labelKey: "nav.dashboard",
      icon: "🏠",
      purposeKey: "ai.training.guide.dashboard.purpose",
      howKey: "ai.training.guide.dashboard.how",
    },
    {
      labelKey: "nav.greenhouses",
      icon: "🏡",
      purposeKey: "ai.training.guide.greenhouses.purpose",
      howKey: "ai.training.guide.greenhouses.how",
    },
    {
      labelKey: "nav.cultures",
      icon: "🌱",
      purposeKey: "ai.training.guide.cultures.purpose",
      howKey: "ai.training.guide.cultures.how",
    },
    {
      labelKey: "nav.parameters",
      icon: "📈",
      purposeKey: "ai.training.guide.parameters.purpose",
      howKey: "ai.training.guide.parameters.how",
    },
    {
      labelKey: "nav.watering",
      icon: "💧",
      purposeKey: "ai.training.guide.watering.purpose",
      howKey: "ai.training.guide.watering.how",
    },
    {
      labelKey: "nav.tasks",
      icon: "✅",
      purposeKey: "ai.training.guide.tasks.purpose",
      howKey: "ai.training.guide.tasks.how",
    },
    {
      labelKey: "nav.employees",
      icon: "👥",
      purposeKey: "ai.training.guide.employees.purpose",
      howKey: "ai.training.guide.employees.how",
    },
    {
      labelKey: "nav.reports",
      icon: "📊",
      purposeKey: "ai.training.guide.reports.purpose",
      howKey: "ai.training.guide.reports.how",
    },
    {
      labelKey: "nav.notifications",
      icon: "🔔",
      purposeKey: "ai.training.guide.notifications.purpose",
      howKey: "ai.training.guide.notifications.how",
    },
    {
      labelKey: "nav.ai",
      icon: "🤖",
      purposeKey: "ai.training.guide.ai.purpose",
      howKey: "ai.training.guide.ai.how",
    },
  ],
};

function roleCanSeeModule(role: TrackRole, allowed: UserRole[] | "any") {
  if (allowed === "any") return true;
  if (role === "agronomist") return allowed.includes("agronomist") || allowed.includes("director") || allowed.includes("admin");
  return allowed.includes("worker");
}

export default function TrainingTour() {
  const { t } = useI18n();
  const [track, setTrack] = useState<TrackRole | null>(null);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const steps = useMemo(() => {
    if (!track) return [];
    const base = GUIDES[track];
    return base.filter((s) => {
      const nav = NAV_ITEMS.find((n) => n.labelKey === s.labelKey);
      return nav ? roleCanSeeModule(track, nav.allowed) : true;
    });
  }, [track]);

  const current = steps[step];

  function pickRole(r: TrackRole) {
    setTrack(r);
    setStep(0);
    setDone(false);
  }

  function restart() {
    setTrack(null);
    setStep(0);
    setDone(false);
  }

  if (done && track) {
    return (
      <section className="space-y-4">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
          <p className="text-lg font-semibold">{t("ai.training.complete")}</p>
          <p className="text-sm text-[var(--muted)] mt-2">{t("ai.training.completeHint")}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setDone(false);
                setStep(0);
              }}
              className="rounded-xl px-5 py-2.5 bg-[color:var(--accent)] text-black font-medium"
            >
              {t("ai.training.restart")}
            </button>
            <button
              type="button"
              onClick={restart}
              className="rounded-xl px-5 py-2.5 border border-[var(--border)] font-medium hover:bg-white/5"
            >
              {t("ai.training.pickRoleAgain")}
            </button>
          </div>
        </div>
        <AiTabInfo titleKey="ai.info.training.title" bodyKey="ai.info.training.body" dataKey="ai.info.training.data" />
      </section>
    );
  }

  if (!track) {
    return (
      <section className="space-y-4">
        <header>
          <h3 className="font-semibold">{t("ai.training.title")}</h3>
          <p className="text-sm text-[var(--muted)] mt-1">{t("ai.training.subtitle")}</p>
        </header>

        <p className="text-sm text-[var(--muted)]">{t("ai.training.pickRole")}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => pickRole("worker")}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-left hover:border-cyan-500/40 hover:bg-cyan-500/5 transition"
          >
            <span className="text-3xl">👷</span>
            <p className="mt-3 font-semibold">{t("ai.training.roleWorker")}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">{t("ai.training.roleWorkerDesc")}</p>
          </button>
          <button
            type="button"
            onClick={() => pickRole("agronomist")}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-left hover:border-emerald-500/40 hover:bg-emerald-500/5 transition"
          >
            <span className="text-3xl">🌿</span>
            <p className="mt-3 font-semibold">{t("ai.training.roleAgronomist")}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">{t("ai.training.roleAgronomistDesc")}</p>
          </button>
        </div>

        <AiTabInfo titleKey="ai.info.training.title" bodyKey="ai.info.training.body" dataKey="ai.info.training.data" />
      </section>
    );
  }

  if (!current) return null;

  const progress = Math.round(((step + 1) / steps.length) * 100);

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-semibold">{t("ai.training.title")}</h3>
          <p className="text-sm text-[var(--muted)] mt-1">
            {track === "worker" ? t("ai.training.roleWorker") : t("ai.training.roleAgronomist")} · {t("ai.training.progress")}{" "}
            {step + 1} / {steps.length}
          </p>
        </div>
        <button type="button" onClick={restart} className="text-xs text-[var(--muted)] hover:text-[var(--text)] underline">
          {t("ai.training.pickRoleAgain")}
        </button>
      </header>

      <div className="h-2 rounded-full bg-black/30 overflow-hidden">
        <div
          className="h-full bg-[color:var(--accent)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <article className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden>
            {current.icon}
          </span>
          <div>
            <p className="text-xs uppercase tracking-wide text-cyan-400/80">{t("ai.training.module")}</p>
            <h4 className="text-lg font-medium">{t(current.labelKey)}</h4>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">{t("ai.training.forWhat")}</p>
            <p className="text-sm mt-1 leading-relaxed">{t(current.purposeKey)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wide">{t("ai.training.howTo")}</p>
            <p className="text-sm mt-1 leading-relaxed text-[var(--muted)]">{t(current.howKey)}</p>
          </div>
          {current.tipKey ? (
            <p className="text-sm rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-100/90">{t(current.tipKey)}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3 pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="rounded-xl px-4 py-2.5 border border-[var(--border)] font-medium disabled:opacity-40 hover:bg-white/5"
          >
            {t("ai.training.back")}
          </button>
          <button
            type="button"
            onClick={() => {
              if (step >= steps.length - 1) setDone(true);
              else setStep((s) => s + 1);
            }}
            className="rounded-xl px-5 py-2.5 font-medium bg-[color:var(--accent)] text-black"
          >
            {step >= steps.length - 1 ? t("ai.training.finish") : t("ai.training.next")}
          </button>
        </div>
      </article>

      <AiTabInfo titleKey="ai.info.training.title" bodyKey="ai.info.training.body" dataKey="ai.info.training.data" />
    </section>
  );
}
