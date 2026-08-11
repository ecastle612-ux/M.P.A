/**
 * Landing-only visual proof of Mission Control.
 * Mirrors the shipped attention-home structure (At a glance, Do next, attention bands).
 * Illustrative layout — not a live org screenshot. Caption must stay visible with the preview.
 */

export function LandingMissionControlPreview({
  className = ""
}: {
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-white/15 bg-[var(--mpa-color-bg-app,#F4F6F8)] text-[var(--mpa-color-text-primary)] shadow-[0_24px_60px_rgba(5,20,16,0.35)] ${className}`}
      role="img"
      aria-label="Illustrative Mission Control layout showing attention bands and a clear next action"
    >
      <div className="border-b border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-4 py-3 md:px-5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Property Manager · Attention home
        </p>
        <p className="font-display text-lg font-semibold md:text-xl">Mission Control</p>
        <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)]">
          See what needs attention and keep the operation moving.
        </p>
      </div>

      <div className="space-y-3 p-3 md:p-4">
        <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
            At a glance
          </p>
          <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <li className="rounded-md border border-[#C0392B]/25 bg-[#FCE8E6]/50 px-2.5 py-2">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-[#C0392B]">
                Immediate
              </p>
              <p className="font-display text-xl font-semibold tabular-nums">2</p>
            </li>
            <li className="rounded-md border border-amber-200 bg-amber-50/60 px-2.5 py-2">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-[#B45309]">
                Waiting on me
              </p>
              <p className="font-display text-xl font-semibold tabular-nums">3</p>
            </li>
            <li className="rounded-md border border-[var(--mpa-color-brand-primary)]/25 bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] px-2.5 py-2 sm:col-span-1 col-span-2">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
                Do next
              </p>
              <p className="mt-1 text-xs font-medium leading-snug">
                Assign open maintenance work
              </p>
            </li>
            <li className="rounded-md border border-[var(--mpa-color-border-default)] px-2.5 py-2 sm:col-span-1 col-span-2">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
                Health
              </p>
              <p className="mt-1 text-xs font-medium leading-snug">Needs attention</p>
            </li>
          </ul>
        </div>

        <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-3">
          <p className="text-xs font-semibold">Attention queue</p>
          <p className="mt-0.5 text-[11px] text-[var(--mpa-color-text-secondary)]">
            Prioritized signals from live property work — act from here.
          </p>
          <ul className="mt-3 space-y-2">
            {[
              {
                title: "Maintenance needs assignment",
                detail: "Residential maintenance · Open work waiting on a technician or vendor",
                band: "Immediate"
              },
              {
                title: "Resident balance follow-up",
                detail: "Financial operations · Collection attention from existing billing work",
                band: "Waiting"
              },
              {
                title: "Lease handoff in progress",
                detail: "Leasing · Occupancy work still moving through the operating loop",
                band: "Waiting"
              }
            ].map((item) => (
              <li
                key={item.title}
                className={`rounded-md border border-[var(--mpa-color-border-subtle)] border-l-[3px] px-3 py-2 ${
                  item.band === "Immediate" ? "border-l-[#C0392B]" : "border-l-[#B45309]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--mpa-color-text-secondary)]">
                      {item.detail}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      item.band === "Immediate"
                        ? "bg-[#FCE8E6] text-[#C0392B]"
                        : "bg-amber-50 text-[#B45309]"
                    }`}
                  >
                    {item.band}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
