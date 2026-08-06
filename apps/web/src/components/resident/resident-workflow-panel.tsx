"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@mpa/ui";
import {
  RESIDENT_WORKFLOW_DEFINITIONS,
  RESIDENT_WORKFLOW_STAGES,
  RESIDENT_WORKFLOW_TRANSITIONS,
  type ResidentWorkflowStage
} from "../../lib/resident/workflow";

/**
 * CORE-004 Phase 4 — canonical resident advances on existing tenant detail surfaces.
 * Not a new CRUD screen.
 */
export function ResidentWorkflowPanel({
  currentStage,
  canUpdate,
  tenantId
}: {
  currentStage: ResidentWorkflowStage;
  canUpdate: boolean;
  tenantId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const allowed = RESIDENT_WORKFLOW_TRANSITIONS[currentStage];
  const definition = RESIDENT_WORKFLOW_DEFINITIONS[currentStage];

  async function advance(toStage: ResidentWorkflowStage) {
    setError(null);
    setPending(toStage);
    try {
      const response = await fetch(`/api/tenants/${tenantId}/workflow`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ toStage })
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to advance resident workflow.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to advance resident workflow.");
    } finally {
      setPending(null);
    }
  }

  return (
    <section
      className="space-y-4 rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-[var(--mpa-space-4)]"
      data-core004="resident-workflow"
      aria-labelledby="resident-workflow-heading"
    >
      <div className="space-y-1">
        <h2
          id="resident-workflow-heading"
          className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]"
        >
          Resident Workflow
        </h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Current stage:{" "}
          <span className="font-medium text-[var(--mpa-color-text-primary)]">{definition.label}</span>
        </p>
        <p className="text-xs text-[var(--mpa-color-text-tertiary)]">{definition.exitCriteria[0]}</p>
      </div>

      <ol className="flex flex-wrap gap-2" aria-label="Resident workflow stages">
        {RESIDENT_WORKFLOW_STAGES.map((stage) => {
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
              {RESIDENT_WORKFLOW_DEFINITIONS[stage].label}
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
              {pending === stage
                ? "Advancing…"
                : `Advance to ${RESIDENT_WORKFLOW_DEFINITIONS[stage].label}`}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          {allowed.length === 0
            ? "Terminal stage — archive complete."
            : "You do not have permission to advance."}
        </p>
      )}
    </section>
  );
}
