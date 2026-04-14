"use client";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

function toneClass(tone: Tone) {
  if (tone === "success") return "border-emerald-500/30 bg-emerald-500/15 text-emerald-200";
  if (tone === "warning") return "border-yellow-400/30 bg-yellow-400/15 text-yellow-100";
  if (tone === "danger") return "border-red-500/30 bg-red-500/15 text-red-200";
  if (tone === "info") return "border-blue-400/30 bg-blue-400/15 text-blue-100";
  return "border-[var(--border)] bg-black/10 text-[var(--muted)]";
}

export default function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        toneClass(tone),
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}

