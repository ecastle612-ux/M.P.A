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
        "flex flex-col items-start gap-3 rounded-lg border border-dashed border-[var(--mpa-color-border-default)] bg-white px-5 py-8",
        className
      )}
    >
      <span
        aria-hidden
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)]"
      >
        <span className="h-2 w-2 rounded-full bg-[var(--mpa-color-brand-primary)]" />
      </span>
      <div>
        <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{title}</h3>
        <p className="mt-1 max-w-prose text-sm text-[var(--mpa-color-text-secondary)]">{description}</p>
      </div>
      {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}
