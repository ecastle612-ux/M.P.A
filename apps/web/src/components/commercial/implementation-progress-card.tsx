"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@mpa/ui";
import type { ImplementationProgressSnapshot } from "../../lib/commercial/progress-types";
import { IMPLEMENTATION_MILESTONES, MILESTONE_LABEL } from "../../lib/commercial/progress-types";

type Props = {
  organizationId: string;
  canManage?: boolean;
};

export function ImplementationProgressCard({ organizationId, canManage = false }: Props) {
  const [progress, setProgress] = useState<ImplementationProgressSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await fetch(
      `/api/organizations/${organizationId}/implementation-progress`,
      { cache: "no-store" }
    );
    const payload = (await response.json()) as {
      progress?: ImplementationProgressSnapshot;
      error?: string;
      message?: string;
    };
    setLoading(false);
    if (!response.ok) {
      setError(payload.message ?? payload.error ?? "Unable to load progress");
      return;
    }
    setProgress(payload.progress ?? null);
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function soloAck() {
    setLoading(true);
    const response = await fetch(
      `/api/organizations/${organizationId}/implementation-progress`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "solo_ack", milestone: "team_invited" })
      }
    );
    const payload = (await response.json()) as {
      progress?: ImplementationProgressSnapshot;
      error?: string;
      message?: string;
    };
    setLoading(false);
    if (!response.ok) {
      setError(payload.message ?? payload.error ?? "Update failed");
      return;
    }
    setProgress(payload.progress ?? null);
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
            Implementation progress
          </h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Setup score toward Production Ready (COM-001).
          </p>
        </div>
        <Button type="button" variant="secondary" disabled={loading} onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">{error}</p>
      ) : null}

      {progress ? (
        <>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
                {progress.score}%
              </p>
              <p className="text-sm text-[var(--mpa-color-text-muted)]">
                {progress.highestMilestone === "none"
                  ? "Not started"
                  : MILESTONE_LABEL[progress.highestMilestone]}
              </p>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-[var(--mpa-color-surface-muted)]"
              role="progressbar"
              aria-valuenow={progress.score}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-[var(--mpa-color-brand-primary)] transition-all"
                style={{ width: `${progress.score}%` }}
              />
            </div>
            {progress.nextStep ? (
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                Next: {progress.nextStep}
              </p>
            ) : (
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                Production Ready complete.
              </p>
            )}
            {progress.blockers.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--mpa-color-text-muted)]">
                {progress.blockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            ) : null}
          </div>

          <ul className="divide-y divide-[var(--mpa-color-border-default)]">
            {IMPLEMENTATION_MILESTONES.map((milestone) => {
              const state = progress.milestones[milestone];
              const done = state.complete || state.waived;
              return (
                <li
                  key={milestone}
                  className="flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <span className="text-[var(--mpa-color-text-primary)]">
                    {MILESTONE_LABEL[milestone]}
                  </span>
                  <span className="text-[var(--mpa-color-text-muted)]">
                    {state.waived ? "Waived" : done ? "Done" : "Open"}
                  </span>
                </li>
              );
            })}
          </ul>

          {canManage &&
          !progress.milestones.team_invited.complete &&
          !progress.milestones.team_invited.waived ? (
            <Button type="button" variant="secondary" disabled={loading} onClick={() => void soloAck()}>
              Acknowledge solo admin (Team Invited)
            </Button>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-[var(--mpa-color-text-muted)]">
          {loading ? "Loading…" : "No progress yet."}
        </p>
      )}
    </Card>
  );
}
