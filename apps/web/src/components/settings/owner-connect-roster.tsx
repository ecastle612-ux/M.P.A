"use client";

import { useState } from "react";
import { Badge, Button, Card } from "@mpa/ui";
import type { OwnerConnectRosterRow } from "../../lib/owner-payouts/service";

function badgeVariant(
  status: OwnerConnectRosterRow["status"]
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

export function OwnerConnectRoster({
  initialRows,
  canNudge
}: {
  initialRows: OwnerConnectRosterRow[];
  canNudge: boolean;
}) {
  const [rows] = useState(initialRows);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function nudge(ownerUserId: string) {
    setBusyId(ownerUserId);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/payouts/org/nudge-onboarding", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerUserId })
      });
      const json = (await res.json()) as {
        result?: { sent: boolean; reason?: string };
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Unable to send nudge");
      if (json.result?.sent) {
        setMessage("Onboarding reminder sent (in-app). No money was moved.");
      } else {
        setMessage(json.result?.reason ?? "Nudge was not sent.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nudge failed");
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <Card variant="muted" className="p-4 text-sm text-[var(--mpa-color-text-secondary)]">
        No property owners are members of this organization yet. Owner Connect eligibility will appear
        here when owners are invited.
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
          Owner Connect eligibility
        </h2>
        <p className="mt-0.5 text-xs text-[var(--mpa-color-text-secondary)]">
          Read-only verification status. Does not show KYC documents or move money. Optional reminders
          use the existing notification service.
        </p>
      </div>

      {message ? (
        <p className="text-xs text-[var(--mpa-color-feedback-success)]">{message}</p>
      ) : null}
      {error ? <p className="text-xs text-[var(--mpa-color-feedback-error)]">{error}</p> : null}

      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.ownerUserId}>
            <Card variant="elevated" className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
                    {row.displayName}
                  </p>
                  <Badge variant={badgeVariant(row.status)}>{row.statusLabel}</Badge>
                </div>
                {row.email ? (
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">{row.email}</p>
                ) : null}
                <p className="text-xs text-[var(--mpa-color-text-secondary)]">{row.nextStepMessage}</p>
              </div>
              {canNudge && row.remediationRequired && row.status !== "disabled" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busyId === row.ownerUserId}
                  onClick={() => void nudge(row.ownerUserId)}
                >
                  Remind to finish
                </Button>
              ) : null}
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
