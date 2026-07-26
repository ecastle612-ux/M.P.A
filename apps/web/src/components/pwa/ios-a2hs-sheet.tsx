"use client";

import { Button, useFocusTrap } from "@mpa/ui";

/**
 * PMX-004 Phase 2 — iOS Add to Home Screen guidance (non-blocking sheet).
 * Phase 5: focus trap + Escape + scroll-lock via useFocusTrap.
 */
export function IosA2hsSheet({
  onDismiss,
  onConfirmAdded,
  open
}: {
  open: boolean;
  onDismiss: () => void;
  onConfirmAdded: () => void;
}) {
  const panelRef = useFocusTrap<HTMLDivElement>(open, onDismiss);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[var(--mpa-z-modal)] flex items-end justify-center bg-[var(--mpa-color-bg-overlay)] p-[var(--mpa-space-4)] sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onDismiss();
      }}
    >
      <div
        ref={panelRef}
        className="w-full max-w-md rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-[var(--mpa-space-5)] shadow-[var(--mpa-shadow-lg)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ios-a2hs-title"
      >
        <h2
          id="ios-a2hs-title"
          className="font-display text-[var(--mpa-font-size-subheading)] font-[var(--mpa-font-weight-semibold)] text-[var(--mpa-color-text-primary)]"
        >
          Add M.P.A. to your Home Screen
        </h2>
        <p className="mt-[var(--mpa-space-2)] mpa-text-body text-[var(--mpa-color-text-secondary)]">
          On iPhone, install from Safari so notifications and offline work like a native app.
        </p>
        <ol className="mt-[var(--mpa-space-4)] list-decimal space-y-[var(--mpa-space-2)] pl-[var(--mpa-space-5)] mpa-text-body text-[var(--mpa-color-text-primary)]">
          <li>Tap the Share button in Safari.</li>
          <li>Scroll and tap Add to Home Screen.</li>
          <li>Tap Add, then open M.P.A. from your Home Screen.</li>
        </ol>
        <div className="mt-[var(--mpa-space-5)] flex flex-wrap gap-[var(--mpa-space-2)]">
          <Button type="button" onClick={onConfirmAdded}>
            I added it
          </Button>
          <Button type="button" variant="secondary" onClick={onDismiss}>
            Remind me later
          </Button>
        </div>
      </div>
    </div>
  );
}
