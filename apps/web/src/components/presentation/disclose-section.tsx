"use client";

import { useId, useState, type ReactNode } from "react";

/**
 * UX-009 progressive disclosure (Amendments A, F).
 * Keeps capability available; hides visual noise until requested.
 */
export function DiscloseSection({
  title,
  description,
  children,
  defaultOpen = false,
  id
}: {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  id?: string;
}) {
  const reactId = useId();
  const panelId = id ?? `disclose-${reactId}`;
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className="rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)]"
      data-mpa-disclose={open ? "open" : "closed"}
    >
      <h2 className="m-0">
        <button
          type="button"
          className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left md:px-5"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-[var(--mpa-color-text-primary)]">{title}</span>
            {description ? (
              <span className="mt-0.5 block text-xs text-[var(--mpa-color-text-secondary)]">{description}</span>
            ) : null}
          </span>
          <span
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]"
          >
            {open ? "Hide" : "Show"}
          </span>
        </button>
      </h2>
      {open ? (
        <div id={panelId} className="space-y-3 border-t border-[var(--mpa-color-border-subtle)] px-4 py-4 md:px-5">
          {children}
        </div>
      ) : null}
    </section>
  );
}
