import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * STD-001 / Operations Console shell — attention queue + work plane.
 * Not a KPI dashboard. Borders over card-soup.
 */
export function OperationsConsoleShell({
  context,
  queue,
  workPlane,
  className
}: {
  context?: ReactNode;
  queue: ReactNode;
  workPlane: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {context ? (
        <div className="rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)] px-3 py-2">
          {context}
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <section
          aria-label="Attention queue"
          className="min-h-[280px] rounded-md border border-[var(--mpa-color-border-default)] bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]"
        >
          {queue}
        </section>
        <section
          aria-label="Work plane"
          className="min-h-[280px] rounded-md border border-[var(--mpa-color-border-default)] bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)]"
        >
          {workPlane}
        </section>
      </div>
    </div>
  );
}
