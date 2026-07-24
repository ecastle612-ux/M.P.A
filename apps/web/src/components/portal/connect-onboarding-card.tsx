"use client";

import { useState } from "react";
import { Badge, Button, Card } from "@mpa/ui";
import type { ConnectStatusView } from "../../lib/owner-payouts/service";

function statusBadgeVariant(
  status: ConnectStatusView["status"]
): "neutral" | "success" | "warning" | "danger" {
  switch (status) {
    case "eligible":
      return "success";
    case "restricted":
    case "disabled":
      return "danger";
    case "pending_verification":
    case "onboarding":
      return "warning";
    default:
      return "neutral";
  }
}

type Props = {
  initialStatus: ConnectStatusView;
  /** owner | org */
  mode: "owner" | "org";
  returnPath: string;
  title?: string;
  description?: string;
  /** Server already refreshed after Account Link return — show confirmation copy */
  returnedFromConnect?: boolean;
};

export function ConnectOnboardingCard({
  initialStatus,
  mode,
  returnPath,
  title,
  description,
  returnedFromConnect = false
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncedNote, setSyncedNote] = useState<string | null>(
    returnedFromConnect ? "Returned from Stripe — status refreshed on this page." : null
  );

  const statusUrl =
    mode === "owner" ? "/api/owner/payouts/status?refresh=1" : "/api/payouts/org/status?refresh=1";
  const linkUrl =
    mode === "owner" ? "/api/owner/payouts/onboarding-link" : "/api/payouts/org/onboarding-link";

  async function refreshStatus() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(statusUrl, { method: "GET", credentials: "include" });
      const json = (await res.json()) as { status?: ConnectStatusView; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Unable to refresh status");
      if (json.status) {
        setStatus(json.status);
        setSyncedNote("Status updated from Stripe Connect.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed");
    } finally {
      setBusy(false);
    }
  }

  async function startOnboarding() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(linkUrl, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnPath, refreshPath: returnPath })
      });
      const json = (await res.json()) as {
        link?: { url: string };
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Unable to start onboarding");
      if (json.link?.url) {
        window.location.href = json.link.url;
        return;
      }
      throw new Error("No onboarding URL returned");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onboarding failed");
      setBusy(false);
    }
  }

  const heading =
    title ?? (mode === "owner" ? "Owner payout connection" : "Organization settlement account");
  const body =
    description ??
    (mode === "owner"
      ? "Connect your Stripe Express account to become eligible for owner payouts. This does not move money yet."
      : "Connect the organization settlement Express account that will receive rent destination charges. Separate from SaaS subscription billing.");

  if (!status.phaseAEnabled) {
    return (
      <Card variant="muted" className="space-y-2 p-4">
        <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{heading}</h3>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Owner payout Connect onboarding is temporarily disabled.
        </p>
      </Card>
    );
  }

  const ctaLabel =
    status.status === "not_started"
      ? "Connect payouts"
      : status.remediationRequired
        ? "Continue verification"
        : status.status === "pending_verification"
          ? "Review in Stripe"
          : "Continue verification";

  return (
    <Card variant="elevated" className="space-y-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{heading}</h3>
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">{body}</p>
        </div>
        <Badge variant={statusBadgeVariant(status.status)}>{status.statusLabel}</Badge>
      </div>

      <div
        className={[
          "rounded-md px-3 py-2 text-xs",
          status.remediationRequired
            ? "bg-[var(--mpa-color-bg-surface-muted)] text-[var(--mpa-color-text-primary)]"
            : "bg-[var(--mpa-color-bg-surface-muted)] text-[var(--mpa-color-text-secondary)]"
        ].join(" ")}
      >
        <p className="font-medium text-[var(--mpa-color-text-primary)]">Next step</p>
        <p className="mt-0.5">{status.nextStepMessage}</p>
      </div>

      <p className="text-xs text-[var(--mpa-color-text-secondary)]">{status.pendingPayoutMessage}</p>

      {status.currentlyDue.length > 0 ? (
        <p className="text-xs text-[var(--mpa-color-feedback-warning)]">
          Requirements due: {status.currentlyDue.slice(0, 4).join(", ")}
          {status.currentlyDue.length > 4 ? "…" : ""}
        </p>
      ) : null}

      {status.lastSyncedAt ? (
        <p className="text-[11px] text-[var(--mpa-color-text-muted)]">
          Last synced {new Date(status.lastSyncedAt).toLocaleString()}
        </p>
      ) : null}

      {syncedNote ? (
        <p className="text-[11px] text-[var(--mpa-color-text-secondary)]">{syncedNote}</p>
      ) : null}

      {error ? <p className="text-xs text-[var(--mpa-color-feedback-error)]">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        {status.canStartOnboarding ||
        (status.remediationRequired && status.status !== "disabled" && status.externalAccountId) ? (
          <Button type="button" size="sm" disabled={busy} onClick={() => void startOnboarding()}>
            {ctaLabel}
          </Button>
        ) : null}
        {status.externalAccountId || status.status !== "not_started" ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => void refreshStatus()}
          >
            Refresh status
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
