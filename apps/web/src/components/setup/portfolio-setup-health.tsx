"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card } from "@mpa/ui";
import { SETUP_INVITE_SKIPPED_KEY } from "../../lib/setup/constants";
import type { SetupStatus } from "../../lib/setup/types";
import {
  buildPortfolioActionTasks,
  contextualPortfolioRecommendation,
  estimateSetupMinutesRemaining
} from "../../lib/workflow/shared/setup-progress";

export function PortfolioSetupHealth() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("mpa.setup.health-dismissed.v1") === "true";
  });

  useEffect(() => {
    const inviteSkipped = window.localStorage.getItem(SETUP_INVITE_SKIPPED_KEY) === "true";
    void fetch(`/api/setup/status?inviteSkipped=${inviteSkipped}`)
      .then((response) => response.json())
      .then((payload: { status?: SetupStatus }) => {
        if (payload.status) setStatus(payload.status);
      });
  }, []);

  if (!status || dismissed) {
    return null;
  }

  const inviteSkipped = status.inviteSkipped;
  const tasks = buildPortfolioActionTasks(
    {
      organizations: status.counts.organizations,
      properties: status.counts.properties,
      units: status.counts.units,
      tenants: status.counts.tenants,
      leases: status.counts.leases,
      activeLeases: status.counts.activeLeases,
      vendors: status.counts.vendors,
      payments: status.counts.payments,
      invitations: status.counts.invitations
    },
    inviteSkipped
  );

  const requiredTasks = tasks.filter((task) => !task.optional);
  const completedRequired = requiredTasks.filter((task) => task.complete).length;
  const percent = Math.round((completedRequired / requiredTasks.length) * 100);
  const minutesRemaining = estimateSetupMinutesRemaining(tasks);
  const recommendation = contextualPortfolioRecommendation({
    organizations: status.counts.organizations,
    properties: status.counts.properties,
    units: status.counts.units,
    tenants: status.counts.tenants,
    leases: status.counts.leases,
    activeLeases: status.counts.activeLeases,
    vendors: status.counts.vendors,
    payments: status.counts.payments,
    invitations: status.counts.invitations
  });

  const allRequiredComplete = requiredTasks.every((task) => task.complete);
  if (allRequiredComplete && status.counts.payments > 0) {
    return null;
  }

  const nextIncomplete = tasks.find((task) => !task.complete && !task.optional);

  return (
    <Card className="border-[var(--mpa-color-brand-primary)]/20 bg-[var(--mpa-color-bg-surface-muted)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 className="font-display text-base font-semibold text-[var(--mpa-color-text-primary)]">
              Portfolio Setup
            </h2>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              {allRequiredComplete
                ? "Your core portfolio is configured — optional tasks remain."
                : recommendation ?? `You're ${percent}% complete. Finish the remaining steps to unlock the full workflow.`}
            </p>
            {minutesRemaining > 0 && !allRequiredComplete ? (
              <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                Estimated completion: ~{minutesRemaining} minute{minutesRemaining === 1 ? "" : "s"} remaining
              </p>
            ) : null}
          </div>
          <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-[var(--mpa-color-border-subtle)]">
            <div
              className="h-full rounded-full bg-[var(--mpa-color-brand-primary)] transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center gap-2 text-sm">
                <span
                  className={
                    task.complete
                      ? "text-[var(--mpa-color-brand-primary)]"
                      : "text-[var(--mpa-color-text-secondary)]"
                  }
                  aria-hidden
                >
                  {task.complete ? "✔" : "○"}
                </span>
                {!task.complete && task.href ? (
                  <Link href={task.href} className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
                    {task.label}
                    {task.optional ? " (optional)" : ""}
                  </Link>
                ) : (
                  <span
                    className={
                      task.complete
                        ? "text-[var(--mpa-color-text-secondary)]"
                        : "font-medium text-[var(--mpa-color-text-primary)]"
                    }
                  >
                    {task.label}
                    {task.optional ? " (optional)" : ""}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          {!status.isComplete && nextIncomplete?.href ? (
            <Link href={nextIncomplete.href}>
              <Button size="sm">Continue: {nextIncomplete.label} →</Button>
            </Link>
          ) : !status.isComplete ? (
            <Link href="/setup">
              <Button size="sm">Continue Setup →</Button>
            </Link>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              window.localStorage.setItem("mpa.setup.health-dismissed.v1", "true");
              setDismissed(true);
            }}
          >
            Dismiss
          </Button>
        </div>
      </div>
    </Card>
  );
}
