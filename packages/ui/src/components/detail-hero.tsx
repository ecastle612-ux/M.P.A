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
        "rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-6 shadow-[var(--mpa-shadow-sm)] md:p-8",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)] md:text-3xl">
            {title}
          </h1>
          {subtitle ? <p className="text-sm text-[var(--mpa-color-text-secondary)]">{subtitle}</p> : null}
          {badges ? <div className="flex flex-wrap gap-2 pt-1">{badges}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {metrics ? <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{metrics}</div> : null}
    </section>
  );
}

export function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--mpa-radius-lg)] bg-[var(--mpa-color-bg-surface-muted)] px-4 py-3">
      <p className="mpa-section-label">{label}</p>
      <p className="mt-1 font-mono text-lg font-medium tabular-nums text-[var(--mpa-color-text-primary)]">{value}</p>
    </div>
  );
}

export { Badge, Button };
