import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { Badge } from "../primitives/badge";
import { Button } from "../primitives/button";

export function DetailHero({
  title,
  subtitle,
  badges,
  metrics,
  actions,
  className
}: {
  title: string;
  subtitle?: string;
  badges?: ReactNode;
  metrics?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-4 shadow-[var(--mpa-shadow-sm)] md:p-5 lg:p-6",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)] md:text-[1.75rem]">
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {subtitle ? (
              <p className="text-sm leading-snug text-[var(--mpa-color-text-secondary)]">{subtitle}</p>
            ) : null}
            {badges ? <div className="flex flex-wrap gap-1.5">{badges}</div> : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      {metrics ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">{metrics}</div>
      ) : null}
    </section>
  );
}

export function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-bg-surface-muted)] px-3 py-2">
      <p className="mpa-section-label">{label}</p>
      <p className="mt-0.5 font-mono text-base font-medium tabular-nums text-[var(--mpa-color-text-primary)] md:text-lg">
        {value}
      </p>
    </div>
  );
}

export { Badge, Button };
