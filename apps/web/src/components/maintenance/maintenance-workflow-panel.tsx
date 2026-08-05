"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@mpa/ui";
import {
  MAINTENANCE_WORKFLOW_DEFINITIONS,
  MAINTENANCE_WORKFLOW_STAGES,
  MAINTENANCE_WORKFLOW_TRANSITIONS,
  toMaintenanceWorkflowLabel,
  type MaintenanceWorkflowStage
} from "../../lib/maintenance/workflow";

export function MaintenanceWorkflowPanel({
  workOrderId,
  currentStage,
  canUpdate
}: {
  workOrderId: string;
  currentStage: MaintenanceWorkflowStage;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const allowed = MAINTENANCE_WORKFLOW_TRANSITIONS[currentStage];
  const definition = MAINTENANCE_WORKFLOW_DEFINITIONS[currentStage];

  async function advance(toStage: MaintenanceWorkflowStage) {
    setError(null);
    setPending(toStage);
    try {
      const response = await fetch(`/api/maintenance/${workOrderId}/workflow`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ toStage })
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to advance workflow.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to advance workflow.");
    } finally {
      setPending(null);
    }
  }

  return (
    <section
      className="space-y-4 rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-[var(--mpa-space-4)]"
      data-core004="maintenance-workflow"
      aria-labelledby="maintenance-workflow-heading"
    >
      <div className="space-y-1">
        <h2
          id="maintenance-workflow-heading"
          className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]"
        >
          Maintenance Workflow
        </h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Current stage:{" "}
          <span className="font-medium text-[var(--mpa-color-text-primary)]">{definition.label}</span>
        </p>
        <p className="text-xs text-[var(--mpa-color-text-tertiary)]">{definition.exitCriteria[0]}</p>
      </div>

      <ol className="flex flex-wrap gap-2" aria-label="Workflow stages">
        {MAINTENANCE_WORKFLOW_STAGES.map((stage) => {
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
              {toMaintenanceWorkflowLabel(stage)}
            </li>
          );
        })}
      </ol>

      {error ? (
        <p className="text-sm text-[var(--mpa-color-status-danger)]" role="alert">
          {error}
        </p>
      ) : null}

      {canUpdate && allowed.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {allowed.map((stage) => (
            <Button
              key={stage}
              type="button"
              size="sm"
              disabled={pending === stage}
              onClick={() => void advance(stage)}
            >
              {pending === stage ? "Advancing…" : `Move to ${toMaintenanceWorkflowLabel(stage)}`}
            </Button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
