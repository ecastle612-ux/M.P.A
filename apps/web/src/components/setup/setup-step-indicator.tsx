import type { SetupStepStatus } from "../../lib/setup/types";

export function SetupStepIndicator({
  steps,
  currentStepId
}: {
  steps: SetupStepStatus[];
  currentStepId: string;
}) {
  const visibleSteps = steps.filter((step) => step.id !== "welcome" && step.id !== "complete");

  return (
    <nav aria-label="Setup progress" className="w-full">
      <ol className="flex flex-wrap items-center gap-2">
        {visibleSteps.map((step, index) => {
          const isCurrent = step.id === currentStepId;
          return (
            <li key={step.id} className="flex items-center gap-2">
              <span
                className={[
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  step.complete
                    ? "bg-[var(--mpa-color-brand-primary)]/10 text-[var(--mpa-color-brand-primary)]"
                    : isCurrent
                      ? "bg-[var(--mpa-color-bg-sidebar-elevated)] text-[var(--mpa-color-text-primary)] ring-1 ring-[var(--mpa-color-brand-primary)]/40"
                      : "bg-[var(--mpa-color-bg-surface-muted)] text-[var(--mpa-color-text-secondary)]"
                ].join(" ")}
                aria-current={isCurrent ? "step" : undefined}
              >
                <span aria-hidden>{step.complete ? "✓" : index + 1}</span>
                {step.label}
                {step.optional ? <span className="text-[var(--mpa-color-text-secondary)]">(optional)</span> : null}
              </span>
              {index < visibleSteps.length - 1 ? (
                <span className="text-[var(--mpa-color-text-secondary)]/40" aria-hidden>
                  →
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
