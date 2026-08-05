"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@mpa/ui";
import {
  PROPERTY_LIFECYCLE_DEFINITIONS,
  PROPERTY_LIFECYCLE_STAGES,
  PROPERTY_LIFECYCLE_TRANSITIONS,
  toLifecycleStageLabel,
  type PropertyLifecycleStage
} from "../../lib/property/lifecycle";

export function PropertyLifecyclePanel({
  propertyId,
  currentStage,
  canUpdate
}: {
  propertyId: string;
  currentStage: PropertyLifecycleStage;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const allowed = PROPERTY_LIFECYCLE_TRANSITIONS[currentStage];
  const definition = PROPERTY_LIFECYCLE_DEFINITIONS[currentStage];

  async function advance(toStage: PropertyLifecycleStage) {
    setError(null);
    setPending(toStage);
    try {
      const response = await fetch(`/api/properties/${propertyId}/lifecycle`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ toStage })
      });
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to advance lifecycle.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to advance lifecycle.");
    } finally {
      setPending(null);
    }
  }

  return (
    <section
      className="space-y-4 rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-[var(--mpa-space-4)]"
      data-core004="property-lifecycle"
      aria-labelledby="property-lifecycle-heading"
    >
      <div className="space-y-1">
        <h2
          id="property-lifecycle-heading"
          className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]"
        >
          Property Lifecycle
        </h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Current stage: <span className="font-medium text-[var(--mpa-color-text-primary)]">{definition.label}</span>
        </p>
        <p className="text-xs text-[var(--mpa-color-text-tertiary)]">{definition.exitCriteria[0]}</p>
      </div>

      <ol className="flex flex-wrap gap-2" aria-label="Lifecycle stages">
        {PROPERTY_LIFECYCLE_STAGES.map((stage) => {
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
              {toLifecycleStageLabel(stage)}
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
              {pending === stage ? "Advancing…" : `Move to ${toLifecycleStageLabel(stage)}`}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="grid gap-2 text-xs text-[var(--mpa-color-text-secondary)] md:grid-cols-2">
        <p>
          <span className="font-semibold text-[var(--mpa-color-text-primary)]">Responsible:</span>{" "}
          {definition.responsibleRoles.join(", ")}
        </p>
        <p>
          <span className="font-semibold text-[var(--mpa-color-text-primary)]">Automation:</span>{" "}
          {definition.automation[0] ?? "None"}
        </p>
      </div>
    </section>
  );
}
