"use client";

import {
  PORTFOLIO_GUIDE_PHASES,
  type PortfolioGuidePhaseId
} from "../../lib/migration/guide";

export function MigrationGuideRail({
  activePhaseId
}: {
  activePhaseId: PortfolioGuidePhaseId;
}) {
  const activeIndex = PORTFOLIO_GUIDE_PHASES.findIndex((phase) => phase.id === activePhaseId);

  return (
    <ol className="space-y-2">
      {PORTFOLIO_GUIDE_PHASES.map((phase, index) => {
        const done = index < activeIndex;
        const active = index === activeIndex;
        return (
          <li
            key={phase.id}
            className={[
              "rounded-[var(--mpa-radius-md)] border px-3 py-2",
              active
                ? "border-[var(--mpa-color-brand-primary)] bg-[var(--mpa-color-brand-primary-subtle)]/50"
                : "border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)]"
            ].join(" ")}
          >
            <div className="flex items-center gap-2">
              <span
                className={[
                  "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                  done || active
                    ? "bg-[var(--mpa-color-brand-primary)] text-[var(--mpa-color-text-inverse)]"
                    : "bg-[var(--mpa-color-bg-surface-muted)] text-[var(--mpa-color-text-secondary)]"
                ].join(" ")}
              >
                {done ? "✓" : index + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
                  {phase.label}
                  {phase.optional ? (
                    <span className="ml-1 text-xs font-normal text-[var(--mpa-color-text-secondary)]">
                      (optional)
                    </span>
                  ) : null}
                </p>
                {active ? (
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">{phase.description}</p>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
