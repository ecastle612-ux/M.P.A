"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@mpa/ui";
import type { HealthScoreSnapshot } from "../../lib/commercial/health-types";

type Props = {
  organizationId: string;
};

const BAND_LABEL: Record<string, string> = {
  healthy: "Healthy",
  needs_attention: "Needs Attention",
  at_risk: "At Risk",
  critical: "Critical"
};

export function OrgHealthCard({ organizationId }: Props) {
  const [health, setHealth] = useState<HealthScoreSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/organizations/${organizationId}/health`, {
      cache: "no-store"
    });
    const payload = (await response.json()) as {
      health?: HealthScoreSnapshot;
      message?: string;
      error?: string;
    };
    setLoading(false);
    if (!response.ok) {
      setError(payload.message ?? payload.error ?? "Unable to load health");
      return;
    }
    setHealth(payload.health ?? null);
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
            Organization health
          </h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Automatic score for Customer Success prioritization (COM-001).
          </p>
        </div>
        <Button type="button" variant="secondary" disabled={loading} onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">{error}</p>
      ) : null}

      {health ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--mpa-color-text-primary)]">
            <span className="font-medium">
              {BAND_LABEL[health.band] ?? health.band}
            </span>{" "}
            · score {health.score}
          </p>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            CS posture: {health.csCadenceLabel}
          </p>
          {health.drivers.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--mpa-color-text-secondary)]">
              {health.drivers.map((driver) => (
                <li key={`${driver.factor}-${driver.code}`}>
                  {driver.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--mpa-color-text-muted)]">No risk drivers.</p>
          )}
        </div>
      ) : null}
    </Card>
  );
}
