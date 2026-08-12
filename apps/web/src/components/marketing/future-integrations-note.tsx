/**
 * Marketing-only future-integration messaging.
 * Does not represent an entitled product module or checkout SKU.
 */

export const BACKGROUND_SCREENING_LABEL = "Background Screening";
export const BACKGROUND_SCREENING_STATUS = "Integration planned";

/** Concise ecosystem line for cards and tables (honest; no delivery date). */
export const BACKGROUND_SCREENING_LINE = `${BACKGROUND_SCREENING_LABEL} — ${BACKGROUND_SCREENING_STATUS}`;

export function FutureIntegrationsNote({ className }: { className?: string }) {
  return (
    <aside
      className={
        className ??
        "rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)] px-4 py-3"
      }
      aria-label="Future integrations"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
        Future integrations
      </p>
      <p className="mt-1 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
        M.P.A. continues expanding its connected property operations ecosystem.
      </p>
      <ul className="mt-2 space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
        <li>• {BACKGROUND_SCREENING_LINE}</li>
        <li>• Additional industry integrations in development</li>
      </ul>
    </aside>
  );
}

/** Planned marker for subscription / feature comparison tables (not “Included”). */
export function PlannedIntegrationCell() {
  return (
    <>
      <span className="text-xs font-medium text-[var(--mpa-color-text-secondary)]" aria-hidden>
        Planned
      </span>
      <span className="sr-only">Integration planned — not available today</span>
    </>
  );
}
