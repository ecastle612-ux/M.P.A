import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export function EmptyState({
  title,
  description,
  action,
  className
}: {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-[var(--mpa-radius-lg)] border border-dashed border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-5 py-8",
        className,
      )}
    >
      <div className="space-y-1">
        <h2 className="font-display text-lg font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
          {title}
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">
          {description}
        </p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
