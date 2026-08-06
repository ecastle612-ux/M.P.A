"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@mpa/ui";
import {
  VENDOR_WORKFLOW_DEFINITIONS,
  VENDOR_WORKFLOW_STAGES,
  VENDOR_WORKFLOW_TRANSITIONS,
  type VendorWorkflowStage
} from "../../lib/vendor/workflow";

/**
 * CORE-004 Phase 5 — canonical vendor advances on existing vendor detail surfaces.
 */
export function VendorWorkflowPanel({
  currentStage,
  canUpdate,
  vendorId
}: {
  currentStage: VendorWorkflowStage;
  canUpdate: boolean;
  vendorId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const allowed = VENDOR_WORKFLOW_TRANSITIONS[currentStage];
  const definition = VENDOR_WORKFLOW_DEFINITIONS[currentStage];

  async function advance(toStage: VendorWorkflowStage) {
    setError(null);
    setPending(toStage);
    try {
      const response = await fetch(`/api/vendors/${vendorId}/workflow`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ toStage })
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to advance vendor workflow.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to advance vendor workflow.");
    } finally {
      setPending(null);
    }
  }

  return (
    <section
      className="space-y-4 rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-[var(--mpa-space-4)]"
      data-core004="vendor-workflow"
      aria-labelledby="vendor-workflow-heading"
    >
      <div className="space-y-1">
        <h2
          id="vendor-workflow-heading"
          className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]"
        >
          Vendor Workflow
        </h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Current stage:{" "}
          <span className="font-medium text-[var(--mpa-color-text-primary)]">{definition.label}</span>
        </p>
        <p className="text-xs text-[var(--mpa-color-text-tertiary)]">{definition.exitCriteria[0]}</p>
      </div>

      <ol className="flex flex-wrap gap-2" aria-label="Vendor workflow stages">
        {VENDOR_WORKFLOW_STAGES.map((stage) => {
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
              {VENDOR_WORKFLOW_DEFINITIONS[stage].label}
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
                : `Advance to ${VENDOR_WORKFLOW_DEFINITIONS[stage].label}`}
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
