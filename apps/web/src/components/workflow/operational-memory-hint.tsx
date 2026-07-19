"use client";

import Link from "next/link";
import { Card } from "@mpa/ui";

export type OperationalMemoryItem = {
  id: string;
  label: string;
  href: string;
  meta?: string | null;
};

/**
 * WF-004 — surface already-loaded historical context during create/detail flows.
 * Does not fetch; parent pages pass records from existing server reads.
 */
export function OperationalMemoryHint({
  title = "Operational memory",
  description = "Similar work already on file — reuse context instead of retyping.",
  items
}: {
  title?: string;
  description?: string;
  items: OperationalMemoryItem[];
}) {
  if (items.length === 0) return null;

  return (
    <Card className="space-y-2 border-dashed border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)]/40 p-4">
      <div>
        <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{title}</h2>
        <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)]">{description}</p>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="block rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] px-3 py-2 text-sm transition hover:border-[var(--mpa-color-border-default)] hover:bg-[var(--mpa-color-bg-surface)]"
            >
              <span className="font-medium text-[var(--mpa-color-brand-primary)]">{item.label}</span>
              {item.meta ? (
                <span className="mt-0.5 block text-xs text-[var(--mpa-color-text-secondary)]">{item.meta}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
