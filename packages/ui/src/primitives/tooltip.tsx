import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export function Tooltip({
  label,
  children,
  side = "top"
}: {
  label: string;
  children: ReactNode;
  side?: "top" | "right";
}) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-40 hidden whitespace-nowrap rounded-md bg-[var(--mpa-color-bg-sidebar)] px-2 py-1 text-xs text-white group-hover:block group-focus-within:block",
          side === "top" && "bottom-full left-1/2 mb-2 -translate-x-1/2",
          side === "right" && "left-full top-1/2 ml-2 -translate-y-1/2"
        )}
      >
        {label}
      </span>
    </span>
  );
}
