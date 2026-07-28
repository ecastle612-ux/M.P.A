"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@mpa/ui";
import type { TrialLifecycleSnapshot } from "../../lib/commercial/progress-types";

type Props = {
  organizationId: string;
  canManage?: boolean;
};

export function TrialStatusBanner({ organizationId, canManage = false }: Props) {
  const [trial, setTrial] = useState<TrialLifecycleSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/organizations/${organizationId}/trial`, {
      cache: "no-store"
    });
    const payload = (await response.json()) as {
      trial?: TrialLifecycleSnapshot;
      error?: string;
      message?: string;
    };
    setLoading(false);
    if (!response.ok) {
      setError(payload.message ?? payload.error ?? "Unable to load trial status");
      return;
    }
    setTrial(payload.trial ?? null);
  }, [organizationId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function convert() {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/organizations/${organizationId}/trial`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "convert",
        returnUrl: `${window.location.origin}/settings/billing?saas=success`
      })
    });
    const payload = (await response.json()) as {
      url?: string | null;
      message?: string;
      error?: string;
    };
    setLoading(false);
    if (!response.ok) {
      setError(payload.message ?? payload.error ?? "Convert failed");
      return;
    }
    if (payload.url) {
      window.location.href = payload.url;
      return;
    }
    setError(payload.message ?? "No billing portal URL returned");
  }

  if (!trial || trial.status === "not_trial" || trial.status === "converted") {
    if (trial?.status === "converted" && trial.watermarkPolicy === "pm_ui_badge") {
      return null;
    }
    if (!trial && error) {
      return (
        <Card>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">{error}</p>
        </Card>
      );
    }
    return null;
  }

  const title =
    trial.status === "trial_active"
      ? "Trial active"
      : trial.status === "trial_grace"
        ? "Trial grace period"
        : "Trial ended";

  const detail =
    trial.status === "trial_active"
      ? `${trial.daysRemaining ?? 0} day(s) remaining · upgrade to keep full access`
      : trial.status === "trial_grace"
        ? `${trial.graceDaysRemaining ?? 0} grace day(s) left · billing & view only`
        : "Grace ended · contact support or use sales-assisted reactivation";

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mpa-color-text-muted)]">
            {trial.watermarkPolicy === "pm_ui_badge" ? "Trial" : "Subscription"}
          </p>
          <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
            {title}
          </h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{detail}</p>
          {trial.dueReminders.length > 0 ? (
            <p className="mt-1 text-xs text-[var(--mpa-color-text-muted)]">
              Prompts due: {trial.dueReminders.join(", ")}
            </p>
          ) : null}
        </div>
        {canManage &&
        (trial.status === "trial_active" || trial.status === "trial_grace") ? (
          <Button type="button" disabled={loading} onClick={() => void convert()}>
            Upgrade via billing
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-[var(--mpa-color-text-secondary)]">{error}</p> : null}
    </Card>
  );
}
