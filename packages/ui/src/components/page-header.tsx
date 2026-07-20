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
      <div className="min-w-0 flex-1 space-y-1.5">
        {overline ? <p className="mpa-section-label text-[var(--mpa-color-brand-primary)]">{overline}</p> : null}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)] md:text-[1.75rem]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-sm leading-snug text-[var(--mpa-color-text-secondary)]">{description}</p>
        ) : null}
        {meta ? <div className="pt-0.5">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
