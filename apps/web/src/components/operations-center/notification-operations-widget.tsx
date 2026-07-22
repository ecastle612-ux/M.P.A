"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { InAppNotificationRecord } from "../../lib/notifications/contracts";
import { notificationCategoryLabel } from "../../lib/notifications/contracts";

type NotificationOpsMetrics = {
  unreadCount: number;
  criticalCount: number;
  emergencyCount: number;
  recent: InAppNotificationRecord[];
  pushSent24h: number;
  pushFailed24h: number;
  providerKey: string;
  providerHealthy: boolean;
  providerDetail?: string;
  registeredDevices: number;
  activeSubscribers: number;
  pendingRegistrations: number;
  pushSuccessRate24h: number | null;
  failedDeliveries24h: number;
  lastPushActivityAt: string | null;
};

const PANEL =
  "rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-4 shadow-[var(--mpa-shadow-xs)]";

function formatWhen(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function NotificationOperationsWidget() {
  const [metrics, setMetrics] = useState<NotificationOpsMetrics | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/notifications/ops", { cache: "no-store" });
    if (!response.ok) return;
    setMetrics((await response.json()) as NotificationOpsMetrics);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refresh();
    }, 0);
    const interval = setInterval(() => void refresh(), 30000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [refresh]);

  if (!metrics) {
    return (
      <section aria-labelledby="notification-ops-heading" className="space-y-3">
        <h2 id="notification-ops-heading" className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
          Unread &amp; urgent messages
        </h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">Loading notifications…</p>
      </section>
    );
  }

  const healthCards = [
    { label: "Registered Devices", value: String(metrics.registeredDevices ?? 0) },
    { label: "Active Subscribers", value: String(metrics.activeSubscribers ?? 0) },
    { label: "Pending Registrations", value: String(metrics.pendingRegistrations ?? 0) },
    {
      label: "Push Success Rate",
      value: metrics.pushSuccessRate24h === null || metrics.pushSuccessRate24h === undefined ? "—" : `${metrics.pushSuccessRate24h}%`
    },
    { label: "Failed Deliveries", value: String(metrics.failedDeliveries24h ?? metrics.pushFailed24h ?? 0) },
    { label: "Last Push Activity", value: formatWhen(metrics.lastPushActivityAt ?? null) }
  ];

  const attentionCards = [
    { label: "Unread", value: metrics.unreadCount, tone: "warning" as const },
    { label: "Critical", value: metrics.criticalCount, tone: "danger" as const },
    { label: "Emergency (24h)", value: metrics.emergencyCount, tone: "danger" as const },
    {
      label: "Provider",
      value: metrics.providerHealthy ? "OK" : "Check",
      tone: metrics.providerHealthy ? ("info" as const) : ("danger" as const)
    }
  ];
  const attentionQuiet =
    metrics.unreadCount === 0 && metrics.criticalCount === 0 && metrics.emergencyCount === 0;

  return (
    <section aria-labelledby="notification-ops-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="notification-ops-heading" className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
            Unread &amp; urgent messages
          </h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            What residents and staff need you to see ({metrics.providerKey}
            {metrics.providerDetail ? ` · ${metrics.providerDetail}` : ""}).
          </p>
        </div>
        <Link
          href="/settings/notifications"
          className="text-xs font-semibold text-[var(--mpa-color-brand-primary)] hover:underline"
        >
          Notification Settings
        </Link>
      </div>

      {attentionQuiet ? (
        <p className="rounded-[var(--mpa-radius-xl)] border border-dashed border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-4 py-3 text-sm text-[var(--mpa-color-text-secondary)]">
          No unread or urgent notifications right now.
          {!metrics.providerHealthy ? " Provider needs attention — check delivery health below." : ""}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {attentionCards.map((card) => (
            <div key={card.label} className={PANEL}>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">{card.label}</p>
              <p
                className={[
                  "mt-2 text-3xl font-semibold tabular-nums",
                  card.tone === "warning"
                    ? "text-amber-700"
                    : card.tone === "danger"
                      ? "text-red-700"
                      : "text-sky-700"
                ].join(" ")}
              >
                {card.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <details className="rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--mpa-color-text-primary)]">
          Delivery health
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {healthCards.map((card) => (
            <div key={card.label} className={PANEL}>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--mpa-color-text-primary)]">{card.value}</p>
            </div>
          ))}
        </div>
      </details>

      <div className={PANEL}>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">Recent activity</p>
        {metrics.recent.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">No recent notifications.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {metrics.recent.slice(0, 5).map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium text-[var(--mpa-color-text-primary)]">{item.title}</p>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                    {notificationCategoryLabel(item.category)} · {item.priority}
                    {item.metadata?.["testNotification"] ? " · test" : ""}
                  </p>
                </div>
                {item.href ? (
                  <Link href={item.href} className="text-xs font-semibold text-[var(--mpa-color-brand-primary)] hover:underline">
                    Open
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
