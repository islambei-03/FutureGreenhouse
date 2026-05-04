"use client";

import type { ReactNode } from "react";

type MaxWidth = "2xl" | "3xl";

const maxW: Record<MaxWidth, string> = {
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
};

/** Модальное окно: скролл на маленьком экране, отступы от краёв. */
export default function AppModal({
  title,
  open,
  onClose,
  children,
  maxWidth = "2xl",
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: MaxWidth;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
      <button
        type="button"
        className="fixed inset-0 bg-black/60"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div className="relative z-[1] flex min-h-full items-stretch justify-center p-3 pb-10 sm:items-center sm:p-4 sm:pb-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="app-modal-title"
          className={[
            "my-auto w-full max-h-[min(92dvh,48rem)] flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)] animate-modalIn",
            maxW[maxWidth],
          ].join(" ")}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] p-4 sm:p-5">
            <div id="app-modal-title" className="min-w-0 font-semibold">
              {title}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="size-10 shrink-0 grid place-items-center rounded-xl border border-[var(--border)] bg-black/20 hover:bg-white/5 transition"
            >
              ✕
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
