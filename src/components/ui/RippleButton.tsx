"use client";

import { useRef } from "react";

type Variant = "primary" | "ghost" | "outline" | "danger";

function cls(variant: Variant) {
  const base =
    "relative overflow-hidden rounded-xl px-4 py-3 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";
  if (variant === "primary") return `${base} bg-[color:var(--accent)] text-black hover:brightness-110 active:brightness-95`;
  if (variant === "danger")
    return `${base} border border-[var(--border)] bg-black/20 hover:bg-white/5 text-red-200`;
  if (variant === "outline") return `${base} border border-[var(--border)] bg-black/10 hover:bg-white/5`;
  return `${base} bg-black/20 hover:bg-white/5 border border-[var(--border)]`;
}

export default function RippleButton({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const ref = useRef<HTMLButtonElement | null>(null);

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    props.onPointerDown?.(e);
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.2;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement("span");
    ripple.className = "fg-ripple";
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    el.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 700);
  }

  return (
    <button ref={ref} {...props} onPointerDown={onPointerDown} className={[cls(variant), className].filter(Boolean).join(" ")}>
      {children}
    </button>
  );
}

