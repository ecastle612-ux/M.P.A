"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@mpa/ui";
import {
  LEASING_WORKFLOW_DEFINITIONS,
  LEASING_WORKFLOW_STAGES,
  LEASING_WORKFLOW_TRANSITIONS,
  type LeasingWorkflowStage
} from "../../lib/lease/workflow";

/**
 * CORE-004 Phase 3 — canonical leasing advances on existing lease/applicant detail surfaces.
 * Not a new CRUD screen.
 */
export function LeasingWorkflowPanel({
  currentStage,
  canUpdate,
  leaseId,
  applicantId
}: {
  currentStage: LeasingWorkflowStage;
  canUpdate: boolean;
  leaseId?: string | null;
  applicantId?: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const allowed = LEASING_WORKFLOW_TRANSITIONS[currentStage];
  const definition = LEASING_WORKFLOW_DEFINITIONS[currentStage];

  async function advance(toStage: LeasingWorkflowStage) {
    setError(null);
    setPending(toStage);
    try {
      const href = leaseId
        ? `/api/leases/${leaseId}/workflow`
        : applicantId
          ? `/api/applicants/${applicantId}/workflow`
          : null;
      if (!href) throw new Error("Missing lease or applicant subject.");
      const response = await fetch(href, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          toStage,
          ...(leaseId ? { leaseId } : {}),
          ...(applicantId ? { applicantId } : {})
        })
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to advance leasing workflow.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to advance leasing workflow.");
    } finally {
      setPending(null);
    }
  }

  return (
    <section
      className="space-y-4 rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-[var(--mpa-space-4)]"
      data-core004="leasing-workflow"
      aria-labelledby="leasing-workflow-heading"
    >
      <div className="space-y-1">
        <h2
          id="leasing-workflow-heading"
          className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]"
        >
          Leasing Workflow
        </h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Current stage:{" "}
          <span className="font-medium text-[var(--mpa-color-text-primary)]">{definition.label}</span>
        </p>
        <p className="text-xs text-[var(--mpa-color-text-tertiary)]">{definition.exitCriteria[0]}</p>
      </div>

      <ol className="flex flex-wrap gap-2" aria-label="Leasing workflow stages">
        {LEASING_WORKFLOW_STAGES.map((stage) => {
          const active = stage === currentStage;
          return (
            <li
              key={stage}
              className={
                active
                  ? "rounded-md bg-[var(--mpa-color-brand-primary-subtle)] px-2 py-1 text-xs font-semibold text-[var(--mpa-color-brand-primary)]"
                  : "rounded-md border border-[var(--mpa-color-border-subtle)] px-2 py-1 text-xs text-[var(--mpa-color-text-tertiary)]"
              }
            >
              {LEASING_WORKFLOW_DEFINITIONS[stage].label}
            </li>
          );
        })}
      </ol>

      {error ? (
        <p className="text-sm text-[var(--mpa-color-feedback-error)]" role="alert">
          {error}
        </p>
      ) : null}

      {canUpdate && allowed.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {allowed.map((stage) => (
            <Button
              key={stage}
              type="button"
              disabled={pending !== null}
              onClick={() => void advance(stage)}
            >
              {pending === stage ? "Advancing…" : `Advance to ${LEASING_WORKFLOW_DEFINITIONS[stage].label}`}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          {allowed.length === 0 ? "Terminal stage — archive complete." : "You do not have permission to advance."}
        </p>
      )}
    </section>
  );
}
