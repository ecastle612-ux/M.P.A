import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export function PageHeader({
  overline,
  title,
  description,
  meta,
  actions,
  className
}: {
  overline?: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mpa-page-header", className)}>
      <div className="min-w-0 flex-1 space-y-[var(--mpa-space-2)]">
        {overline ? <p className="mpa-section-label text-[var(--mpa-color-brand-primary)]">{overline}</p> : null}
        <h1 className="mpa-text-title text-[var(--mpa-color-text-primary)]">{title}</h1>
        {description ? (
          <p className="mpa-text-body max-w-3xl text-[var(--mpa-color-text-secondary)]">{description}</p>
        ) : null}
        {meta ? <div className="pt-[var(--mpa-space-1)]">{meta}</div> : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-[var(--mpa-space-2)]">{actions}</div>
      ) : null}
    </header>
  );
}
