"use client";

import type { ElementType, ReactNode } from "react";

export default function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return (
    <Tag
      className={[
        "rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Tag>
  );
}

