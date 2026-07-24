"use client";

import { useState } from "react";
import { Badge, Button, Card } from "@mpa/ui";
import type { OrgPayoutRunSummary } from "../../lib/owner-payouts/projections";

type RunDetail = {
  run: Record<string, unknown>;
  intents: Record<string, unknown>[];
  allocations: Record<string, unknown>[];
};

function runBadgeVariant(
  status: string
): "neutral" | "success" | "warning" | "danger" {
  if (status === "succeeded") return "success";
  if (status === "failed" || status === "canceled") return "danger";
  if (status === "partial" || status === "running" || status === "queued") return "warning";
  return "neutral";
}

function intentBadgeVariant(
  status: string
): "neutral" | "success" | "warning" | "danger" {
  if (status === "paid" || status === "in_transit") return "success";
  if (status === "failed") return "danger";
  if (status === "needs_reconcile" || status === "executing" || status === "eligible") {
    return "warning";
  }
  return "neutral";
}

function formatCents(amount: unknown, currency: unknown): string {
  const cents = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(cents)) return "—";
  const cur = typeof currency === "string" ? currency : "usd";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur.toUpperCase()
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

export function PayoutRunConsole({
  initialRuns,
  canManage
}: {
  initialRuns: OrgPayoutRunSummary[];
  canManage: boolean;
}) {
  const [runs] = useState(initialRuns);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RunDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadDetail(runId: string) {
    setSelectedId(runId);
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/payouts/org/runs/${runId}`, { credentials: "include" });
      const json = (await res.json()) as RunDetail & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Unable to load payout run");
      setDetail(json);
    } catch (err) {
      setDetail(null);
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setBusy(false);
    }
  }

  async function executeSelected() {
    if (!selectedId || !canManage) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/payouts/org/runs/${selectedId}/execute`, {
        method: "POST",
        credentials: "include"
      });
      const json = (await res.json()) as {
        result?: { status?: string; blockedReason?: string | null };
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Execute failed");
      if (json.result?.blockedReason) {
        setMessage(json.result.blockedReason);
      } else {
        setMessage(`Execute finished with status ${json.result?.status ?? "unknown"}.`);
      }
      await loadDetail(selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Execute failed");
    } finally {
      setBusy(false);
    }
  }

  if (runs.length === 0) {
    return (
      <Card variant="muted" className="space-y-2 p-5">
        <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Payout runs</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          No payout runs yet. Create a run via the Phase C API (`POST /api/payouts/org/runs`) for a
          property period, then review intents and execute here. This console does not schedule
          automatic payouts.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Payout runs</h2>
        <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
          Read-mostly console over Phase C TransferIntents. Execute reuses the existing guarded
          transfer path — no new money-out engine.
        </p>
      </div>

      {message ? (
        <p className="text-xs text-[var(--mpa-color-text-secondary)]" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs text-[var(--mpa-color-danger)]" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="space-y-2">
        {runs.map((run) => (
          <li key={run.runId}>
            <Card
              variant={selectedId === run.runId ? "elevated" : "muted"}
              className="flex flex-wrap items-start justify-between gap-3 p-4"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
                    {run.periodLabel}
                  </p>
                  <Badge variant={runBadgeVariant(run.status)}>{run.statusLabel}</Badge>
                </div>
                <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                  {run.intentCount} intents · {run.paidCount} paid · {run.failedCount} failed ·{" "}
                  {run.pendingCount} pending · {run.needsReconcileCount} reconcile · Created{" "}
                  {run.createdLabel}
                </p>
                {run.failureReason ? (
                  <p className="text-xs text-[var(--mpa-color-danger)]">{run.failureReason}</p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() => void loadDetail(run.runId)}
              >
                {selectedId === run.runId ? "Refresh" : "View"}
              </Button>
            </Card>
          </li>
        ))}
      </ul>

      {selectedId && detail ? (
        <Card className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
                Run detail
              </h3>
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                {String(detail.run["id"] ?? selectedId)} · status{" "}
                {String(detail.run["status"] ?? "—")}
              </p>
            </div>
            {canManage ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={busy}
                onClick={() => void executeSelected()}
              >
                Execute transfers
              </Button>
            ) : null}
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
              Transfer intents
            </h4>
            {detail.intents.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">No intents on this run.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {detail.intents.map((intent) => {
                  const id = String(intent["id"] ?? "");
                  const status = String(intent["status"] ?? "");
                  return (
                    <li key={id}>
                      <div className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-[var(--mpa-color-border-subtle)] px-3 py-2">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={intentBadgeVariant(status)}>{status}</Badge>
                            <span className="text-xs text-[var(--mpa-color-text-secondary)]">
                              Owner {String(intent["owner_user_id"] ?? "").slice(0, 8)}…
                            </span>
                          </div>
                          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                            {intent["external_transfer_id"]
                              ? `Transfer ${String(intent["external_transfer_id"])}`
                              : "No external transfer id yet"}
                            {intent["failure_reason"]
                              ? ` · ${String(intent["failure_reason"])}`
                              : ""}
                            {intent["skip_reason"] ? ` · ${String(intent["skip_reason"])}` : ""}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
                          {formatCents(intent["amount_cents"], intent["currency"])}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            Allocations on run: {detail.allocations.length}. Needs-reconcile intents block period
            supersede — do not treat them as free to re-pay.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
