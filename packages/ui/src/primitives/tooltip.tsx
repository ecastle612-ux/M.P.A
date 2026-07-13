import type { ReactNode } from "react";

export function Tooltip({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 hidden -translate-x-1/2 rounded-md bg-[var(--mpa-color-bg-sidebar)] px-2 py-1 text-xs text-white group-hover:block group-focus-within:block"
      >
        {label}
      </span>
    </span>
  );
}
