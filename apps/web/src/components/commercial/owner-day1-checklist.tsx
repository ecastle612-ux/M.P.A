"use client";

import Link from "next/link";
import type { OwnerDay1Checklist } from "@mpa/shared";

type OwnerDay1ChecklistProps = {
  checklist: OwnerDay1Checklist;
  /** When true, show Organization Admin identity blurb above the list. */
  showOwnerClarity?: boolean;
};

/**
 * Inline Day-1 activation checklist — extends existing home surfaces.
 * Not a tour engine or modal.
 */
export function OwnerDay1ChecklistCard({
  checklist,
  showOwnerClarity = false
}: OwnerDay1ChecklistProps) {
  return (
    <section
      aria-label={checklist.title}
      className="max-w-4xl space-y-3 rounded-md border border-[var(--mpa-color-brand-primary)]/30 bg-white p-4 md:p-5"
      data-testid={`owner-day1-${checklist.productSku}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
        Owner Day 1
      </p>
      <h2 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
        {checklist.title}
      </h2>
      <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">{checklist.intro}</p>

      {showOwnerClarity ? (
        <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-app)] p-3">
          <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
            You are the Organization Admin
          </p>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            You manage properties/sites, team access, and operational setup. You are not a resident,
            vendor technician, or limited employee-only user.
          </p>
        </div>
      ) : null}

      <ol className="space-y-2">
        {checklist.items.map((item, index) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex gap-3 rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2 transition hover:border-[var(--mpa-color-brand-primary)]/40 hover:bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)]"
            >
              <span
                aria-hidden
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--mpa-color-border-default)] text-xs font-semibold text-[var(--mpa-color-text-secondary)]"
              >
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[var(--mpa-color-text-primary)]">
                  {item.label}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--mpa-color-text-secondary)]">
                  {item.detail}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <p className="text-sm font-medium text-[var(--mpa-color-status-success,#0F6B56)]">
        {checklist.successLooksLike}
      </p>
    </section>
  );
}
