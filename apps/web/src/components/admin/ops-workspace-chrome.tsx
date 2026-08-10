import type { ReactNode } from "react";
import { Badge } from "@mpa/ui";

export function OpsWorkspaceChrome({
  eyebrow,
  title,
  description,
  actions,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
              {eyebrow}
            </p>
            <Badge variant="neutral">Owner Operations</Badge>
          </div>
          <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">{title}</h1>
          <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </header>
      {children}
    </main>
  );
}

export function OpsMetricStrip({
  items
}: {
  items: Array<{ label: string; value: string | number; hint?: string }>;
}) {
  return (
    <section aria-label="Summary metrics" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.label}
          className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            {item.label}
          </p>
          <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-[var(--mpa-color-text-primary)]">
            {item.value}
          </p>
          {item.hint ? (
            <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">{item.hint}</p>
          ) : null}
        </article>
      ))}
    </section>
  );
}
