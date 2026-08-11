/**
 * Landing-only illustrative layout of the shipped Maintenance Command Center.
 * Uses real product labels/structure from Maintenance Command Center — not a live screenshot.
 */

export function LandingMaintenancePreview({
  className = ""
}: {
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-app,#F4F6F8)] text-[var(--mpa-color-text-primary)] shadow-[0_16px_40px_rgba(15,27,45,0.08)] ${className}`}
      role="img"
      aria-label="Illustrative Maintenance Command Center layout showing a prioritized request queue"
    >
      <div className="border-b border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-4 py-3 md:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
              Property Manager · Maintenance
            </p>
            <p className="font-display text-lg font-semibold md:text-xl">
              Maintenance Command Center
            </p>
          </div>
          <span className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)] px-2 py-1 text-[11px] font-semibold text-[var(--mpa-color-text-secondary)]">
            Illustrative layout
          </span>
        </div>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          One work-order workflow: review requests, prioritize, assign, monitor progress, and close.
        </p>
      </div>

      <div className="space-y-3 p-3 md:p-4">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-md bg-[var(--mpa-color-bg-surface)] px-2 py-1 font-medium ring-1 ring-[var(--mpa-color-border-default)]">
            2 open
          </span>
          <span className="rounded-md bg-[#FCE8E6] px-2 py-1 font-medium text-[#C0392B]">
            1 emergency
          </span>
        </div>

        <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-3 md:p-4">
          <p className="text-sm font-semibold">Request queue</p>
          <ul className="mt-3 space-y-2">
            <li className="rounded-md border border-[var(--mpa-color-border-subtle)] border-l-[3px] border-l-[#C0392B] px-3 py-2.5">
              <p className="text-sm font-medium">Leak under sink</p>
              <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)] md:text-sm">
                Resident request · Emergency · Needs triage and assignment
              </p>
            </li>
            <li className="rounded-md border border-[var(--mpa-color-border-subtle)] border-l-[3px] border-l-[var(--mpa-color-border-default)] px-3 py-2.5">
              <p className="text-sm font-medium">HVAC filter</p>
              <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)] md:text-sm">
                Resident request · Normal · In queue for assignment
              </p>
            </li>
            <li className="rounded-md border border-[var(--mpa-color-border-subtle)] border-l-[3px] border-l-[#B45309] px-3 py-2.5">
              <p className="text-sm font-medium">Assigned vendor follow-up</p>
              <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)] md:text-sm">
                Work in progress · Operator monitors progress through resolution
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
