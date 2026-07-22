"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@mpa/ui";
import type { PushDiagnosticDevice, PushDiagnosticsSnapshot } from "../../lib/master-admin/push-diagnostics";

function truncateId(value: string | null): string {
  if (!value) return "—";
  if (value.length <= 18) return value;
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}

function formatWhen(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function healthLabel(health: PushDiagnosticDevice["subscriptionHealth"]): string {
  if (health === "healthy") return "Healthy";
  if (health === "inactive") return "Inactive";
  return "Missing subscription";
}

export function PushDiagnosticsPanel() {
  const [snapshot, setSnapshot] = useState<PushDiagnosticsSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingUserId, setTestingUserId] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/master-admin/notifications/diagnostics", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as PushDiagnosticsSnapshot & {
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        setError(payload.error ?? payload.message ?? "Failed to load diagnostics");
        setSnapshot(null);
        return;
      }
      setSnapshot(payload);
    } catch {
      setError("Failed to load diagnostics");
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function sendTest(userId: string) {
    setTestingUserId(userId);
    setTestMessage(null);
    try {
      const response = await fetch("/api/master-admin/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId })
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!response.ok) {
        setTestMessage(payload.error ?? payload.message ?? "Test failed");
        return;
      }
      setTestMessage(`Test sent to user ${truncateId(userId)}.`);
      await refresh();
    } catch {
      setTestMessage("Test failed");
    } finally {
      setTestingUserId(null);
    }
  }

  const global = snapshot?.global;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
            Notification diagnostics
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
            Push registration health for the active organization. Send a test to any enrolled user.
          </p>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={() => void refresh()} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {error ? <p className="text-sm text-[var(--mpa-color-feedback-danger,#b91c1c)]">{error}</p> : null}
      {testMessage ? <p className="text-sm text-[var(--mpa-color-text-secondary)]">{testMessage}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Provider", value: global ? `${global.providerKey}${global.providerHealthy ? " · OK" : " · Check"}` : "…" },
          { label: "Active subscribers", value: global ? String(global.activeSubscribers) : "…" },
          {
            label: "Success rate 24h",
            value:
              global?.pushSuccessRate24h === null || global?.pushSuccessRate24h === undefined
                ? "—"
                : `${global.pushSuccessRate24h}%`
          },
          { label: "Failed 24h", value: global ? String(global.failedDeliveries24h) : "…" }
        ].map((card) => (
          <Card key={card.label} className="space-y-1 p-3">
            <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">{card.label}</p>
            <p className="text-lg font-semibold tabular-nums text-[var(--mpa-color-text-primary)]">{card.value}</p>
          </Card>
        ))}
      </div>

      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Registered devices</h2>
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            Last push activity: {formatWhen(global?.lastPushActivityAt)}
          </p>
        </div>

        {loading && !snapshot ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">Loading devices…</p>
        ) : !snapshot || snapshot.devices.length === 0 ? (
          <p className="rounded-md border border-dashed border-[var(--mpa-color-border-subtle)] px-3 py-4 text-sm text-[var(--mpa-color-text-secondary)]">
            No registered devices in this organization yet. Users enroll from Settings → Notifications or the
            enable-push banner.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                <tr>
                  <th className="px-2 py-2 font-medium">User</th>
                  <th className="px-2 py-2 font-medium">Platform</th>
                  <th className="px-2 py-2 font-medium">Subscription</th>
                  <th className="px-2 py-2 font-medium">Health</th>
                  <th className="px-2 py-2 font-medium">Last sent</th>
                  <th className="px-2 py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--mpa-color-border-subtle)]">
                {snapshot.devices.map((device) => (
                  <tr key={device.id}>
                    <td className="px-2 py-2 font-mono text-xs text-[var(--mpa-color-text-primary)]">
                      {truncateId(device.userId)}
                    </td>
                    <td className="px-2 py-2 text-[var(--mpa-color-text-secondary)]">
                      {device.deviceLabel ?? device.platform}
                    </td>
                    <td className="px-2 py-2 font-mono text-xs text-[var(--mpa-color-text-secondary)]">
                      {truncateId(device.externalSubscriptionId)}
                    </td>
                    <td className="px-2 py-2 text-[var(--mpa-color-text-primary)]">
                      {healthLabel(device.subscriptionHealth)}
                      {device.lastPushError ? (
                        <span className="mt-0.5 block text-xs text-[var(--mpa-color-feedback-danger,#b91c1c)]">
                          {device.lastPushError}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-2 py-2 text-[var(--mpa-color-text-secondary)]">
                      {formatWhen(device.lastNotificationSentAt)}
                      {device.lastPushStatus ? ` · ${device.lastPushStatus}` : ""}
                    </td>
                    <td className="px-2 py-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={!device.isActive || !device.hasSubscription || testingUserId === device.userId}
                        onClick={() => void sendTest(device.userId)}
                      >
                        {testingUserId === device.userId ? "Sending…" : "Send test"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
