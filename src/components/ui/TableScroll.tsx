import type { ReactNode } from "react";

/** Горизонтальный скролл таблиц на узких экранах; родитель должен иметь `min-w-0` (например `main`). */
export default function TableScroll({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "min-w-0 w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
