"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card } from "@mpa/ui";
import {
  toLeaseEventTypeLabel,
  toLeaseRenewalStatusLabel,
  toLeaseStatusLabel,
  type LeaseEventRecord,
  type LeaseRecord
} from "../../lib/lease/contracts";

type LifecycleAction =
  | "sign"
  | "activate"
  | "offer_renewal"
  | "renew"
  | "give_notice"
  | "expire"
  | "terminate"
  | "move_out";

function availableActions(status: LeaseRecord["status"]): LifecycleAction[] {
  const actions: LifecycleAction[] = [];
  if (status === "draft") {
    actions.push("sign", "activate", "terminate");
  }
  if (status === "signed") {
    actions.push("activate", "expire", "terminate");
  }
  if (status === "active") {
    actions.push("offer_renewal", "renew", "give_notice", "expire", "terminate", "move_out");
  }
  if (status === "expired" || status === "terminated") {
    actions.push("move_out");
  }
  return actions;
}

function getActionLabel(action: LifecycleAction): string {
  const labels: Record<LifecycleAction, string> = {
    sign: "Sign",
    activate: "Activate",
    offer_renewal: "Offer Renewal",
    renew: "Renew",
    give_notice: "Give Notice",
    expire: "Expire",
    terminate: "Terminate",
    move_out: "Record Move Out"
  };
  return labels[action];
}

export function LeaseLifecyclePanel({
  leaseId,
  status,
  renewalStatus,
  events,
  canUpdate
}: {
  leaseId: string;
  status: LeaseRecord["status"];
  renewalStatus: LeaseRecord["renewalStatus"];
  events: LeaseEventRecord[];
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);

  const actions = availableActions(status);

  async function runLifecycleAction(action: LifecycleAction) {
    setError(null);
    setSubmittingAction(action);

    const body: { action: LifecycleAction; extensionMonths?: number } = { action };
    if (action === "renew") {
      body.extensionMonths = 12;
    }

    const response = await fetch(`/api/leases/${leaseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    setSubmittingAction(null);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Lifecycle action failed.");
      return;
    }

    router.refresh();
  }

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Lifecycle</h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Advance the lease through signing, activation, renewal, and move-out workflows.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={status === "active" ? "success" : status === "expired" || status === "terminated" ? "warning" : "info"}>
            {toLeaseStatusLabel(status)}
          </Badge>
          <Badge variant={renewalStatus === "renewed" ? "success" : renewalStatus !== "none" ? "warning" : "info"}>
            {toLeaseRenewalStatusLabel(renewalStatus)}
          </Badge>
        </div>
      </div>

      {canUpdate && actions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action}
              variant={action === "terminate" ? "danger" : action === "move_out" ? "secondary" : "primary"}
              size="sm"
              disabled={submittingAction !== null}
              onClick={() => runLifecycleAction(action)}
            >
              {submittingAction === action ? "Saving..." : getActionLabel(action)}
            </Button>
          ))}
        </div>
      ) : null}

      {!canUpdate ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">You do not have permission to run lifecycle actions.</p>
      ) : null}

      {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}

      <div>
        <h3 className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Event timeline</h3>
        {events.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">No lifecycle events recorded yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {events.map((event) => (
              <li
                key={event.id}
                className="rounded-md border border-[var(--mpa-color-border-subtle)] p-3 text-sm text-[var(--mpa-color-text-secondary)]"
              >
                <p className="font-medium text-[var(--mpa-color-text-primary)]">{toLeaseEventTypeLabel(event.eventType)}</p>
                <p>{event.summary}</p>
                <p className="text-xs">{new Date(event.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
