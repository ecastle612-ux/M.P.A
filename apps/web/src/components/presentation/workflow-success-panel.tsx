import Link from "next/link";
import { Button, Card } from "@mpa/ui";
import type { SetupProgressStep, WorkflowAction } from "../../lib/setup/types";
import type { WorkflowCrossLink } from "../../lib/workflow/shared/types";

export function WorkflowSuccessPanel({
  title,
  description,
  recommendations = [],
  steps,
  primaryAction,
  secondaryActions = [],
  crossLinks = [],
  milestone,
  onDismiss
}: {
  title: string;
  description?: string;
  recommendations?: string[];
  steps?: SetupProgressStep[];
  primaryAction: WorkflowAction;
  secondaryActions?: WorkflowAction[];
  crossLinks?: WorkflowCrossLink[];
  milestone?: string;
  onDismiss?: () => void;
}) {
  return (
    <Card className="border-[var(--mpa-color-brand-primary)]/30 bg-[var(--mpa-color-bg-surface-muted)]">
      <div className="flex items-start gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--mpa-color-brand-primary)] text-sm font-bold text-white"
          aria-hidden
        >
          ✓
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{description}</p>
            ) : null}
            {milestone ? (
              <p className="mt-2 rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-brand-primary)]/20 bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm text-[var(--mpa-color-text-primary)]">
                🎉 {milestone}
              </p>
            ) : null}
          </div>

          {recommendations.length > 0 ? (
            <div className="rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-3">
              <p className="mpa-section-label">Recommended next steps</p>
              <ul className="mt-2 space-y-1.5">
                {recommendations.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[var(--mpa-color-text-secondary)]">
                    <span className="mt-0.5 shrink-0 text-[var(--mpa-color-brand-primary)]" aria-hidden>
                      →
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {steps && steps.length > 0 ? (
            <ul className="space-y-1.5 rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-3">
              {steps.map((step) => (
                <li key={step.id} className="flex items-center gap-2 text-sm">
                  <span
                    className={[
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      step.complete
                        ? "bg-[var(--mpa-color-brand-primary)] text-white"
                        : "border border-[var(--mpa-color-border-default)] text-[var(--mpa-color-text-secondary)]"
                    ].join(" ")}
                    aria-hidden
                  >
                    {step.complete ? "✓" : "○"}
                  </span>
                  <span
                    className={
                      step.complete
                        ? "text-[var(--mpa-color-text-secondary)]"
                        : "font-medium text-[var(--mpa-color-text-primary)]"
                    }
                  >
                    {step.label}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          {crossLinks.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {crossLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--mpa-color-brand-primary)] hover:bg-[var(--mpa-color-bg-surface-muted)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {primaryAction.href ? (
              primaryAction.href.startsWith("#") ? (
                <a href={primaryAction.href}>
                  <Button variant={primaryAction.variant ?? "primary"} size="sm">
                    {primaryAction.label}
                  </Button>
                </a>
              ) : (
                <Link href={primaryAction.href}>
                  <Button variant={primaryAction.variant ?? "primary"} size="sm">
                    {primaryAction.label}
                  </Button>
                </Link>
              )
            ) : (
              <Button variant={primaryAction.variant ?? "primary"} size="sm" onClick={primaryAction.onClick}>
                {primaryAction.label}
              </Button>
            )}
            {secondaryActions.map((action) =>
              action.href ? (
                <Link key={action.label} href={action.href}>
                  <Button variant={action.variant ?? "secondary"} size="sm">
                    {action.label}
                  </Button>
                </Link>
              ) : (
                <Button key={action.label} variant={action.variant ?? "ghost"} size="sm" onClick={action.onClick}>
                  {action.label}
                </Button>
              )
            )}
            {onDismiss ? (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                Dismiss
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
