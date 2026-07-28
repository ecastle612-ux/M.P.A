"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CommandCenterHomeComposition } from "../../lib/ops/command-center-home";

const PANEL =
  "rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] shadow-[var(--mpa-shadow-xs)]";

export function CommandCenterHomePanel({
  initialHome
}: {
  initialHome: CommandCenterHomeComposition | null;
}) {
  const [home, setHome] = useState(initialHome);
  const [busyActionId, setBusyActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/ops/command-center", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as { home?: CommandCenterHomeComposition };
      if (payload.home) setHome(payload.home);
    } catch {
      // keep last good composition
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => void refresh(), 45000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const kpiEntries = useMemo(() => Object.entries(home?.kpis ?? {}).slice(0, 6), [home?.kpis]);

  async function runAction(actionId: string, href?: string) {
    setBusyActionId(actionId);
    setError(null);
    try {
      const response = await fetch("/api/ops/quick-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId })
      });
      const payload = (await response.json()) as { ok?: boolean; href?: string; error?: string; message?: string };
      if (!response.ok || payload.ok === false) {
        setError(payload.error ?? payload.message ?? "Action denied");
        return;
      }
      const target = payload.href ?? href;
      if (target) {
        window.location.assign(target);
        return;
      }
      await refresh();
    } catch {
      setError("Could not run action");
    } finally {
      setBusyActionId(null);
    }
  }

  if (!home) {
    return (
      <section className={`${PANEL} p-[var(--mpa-space-4)]`}>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Command Center composition unavailable for this session.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-[var(--mpa-space-4)]" id="command-center" aria-label="Universal Command Center">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--mpa-color-text-tertiary)]">
            Operations
          </p>
          <h2 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            Command Center
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
            Cross-module operational summary powered by Task, Workflow, Priority, AI Director, Automation, and
            Analytics engines.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/inbox"
            className="rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] px-3 py-1.5 text-sm text-[var(--mpa-color-text-primary)]"
          >
            Inbox ({home.inboxUnreadCount})
          </Link>
          <Link
            href="/activity"
            className="rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] px-3 py-1.5 text-sm text-[var(--mpa-color-text-primary)]"
          >
            Activity
          </Link>
        </div>
      </header>

      {error ? (
        <p className="text-sm text-[var(--mpa-color-status-danger)]" role="alert">
          {error}
        </p>
      ) : null}

      {home.alerts.length > 0 ? (
        <div className={`${PANEL} p-[var(--mpa-space-3)]`} id="ops-alerts">
          <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Alerts</h3>
          <ul className="mt-2 space-y-1">
            {home.alerts.map((alert) => (
              <li key={`${alert.title}-${alert.href}`}>
                <Link href={alert.href} className="text-sm text-[var(--mpa-color-text-secondary)] hover:underline">
                  [{alert.priority}] {alert.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-[var(--mpa-space-4)] lg:grid-cols-3">
        <div className={`${PANEL} p-[var(--mpa-space-4)]`} id="priority-tasks">
          <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Priority tasks</h3>
          <ul className="mt-3 space-y-2">
            {home.priorityTasks.slice(0, 6).map((task) => (
              <li key={task.taskId} className="text-sm">
                <Link
                  href={task.deepLink ?? "/dashboard#priority-tasks"}
                  className="text-[var(--mpa-color-text-primary)] hover:underline"
                >
                  {task.title}
                </Link>
                <p className="text-xs text-[var(--mpa-color-text-tertiary)]">
                  {task.priority} · {task.status}
                </p>
              </li>
            ))}
            {home.priorityTasks.length === 0 ? (
              <li className="text-sm text-[var(--mpa-color-text-tertiary)]">No open priority tasks.</li>
            ) : null}
          </ul>
        </div>

        <div className={`${PANEL} p-[var(--mpa-space-4)]`}>
          <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Inbox preview</h3>
          <ul className="mt-3 space-y-2">
            {home.inboxPreview.slice(0, 6).map((item) => (
              <li key={item.itemId} className="text-sm">
                <Link
                  href={item.deepLink ?? "/inbox"}
                  className="text-[var(--mpa-color-text-primary)] hover:underline"
                >
                  {item.title}
                </Link>
                <p className="text-xs text-[var(--mpa-color-text-tertiary)]">
                  {item.kind}
                  {item.assignmentState ? ` · ${item.assignmentState}` : ""}
                </p>
              </li>
            ))}
            {home.inboxPreview.length === 0 ? (
              <li className="text-sm text-[var(--mpa-color-text-tertiary)]">Inbox is clear.</li>
            ) : null}
          </ul>
        </div>

        <div className={`${PANEL} p-[var(--mpa-space-4)]`}>
          <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">AI Operations Director</h3>
          <ul className="mt-3 space-y-2">
            {home.aiRecommendations.slice(0, 6).map((rec) => (
              <li key={rec.recommendationId} className="text-sm">
                <Link
                  href={rec.deepLink ?? "/inbox?kind=ai"}
                  className="text-[var(--mpa-color-text-primary)] hover:underline"
                >
                  {rec.title}
                </Link>
                <p className="text-xs text-[var(--mpa-color-text-tertiary)]">
                  {rec.confidenceBand}
                  {rec.requiresHumanGate ? " · human gate" : ""}
                </p>
              </li>
            ))}
            {home.aiRecommendations.length === 0 ? (
              <li className="text-sm text-[var(--mpa-color-text-tertiary)]">No pending recommendations.</li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="grid gap-[var(--mpa-space-4)] lg:grid-cols-3">
        <div className={`${PANEL} p-[var(--mpa-space-4)]`} id="ops-health">
          <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Queue & workflow health</h3>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-[var(--mpa-color-text-tertiary)]">Status</dt>
              <dd className="font-medium text-[var(--mpa-color-text-primary)]">{home.monitoring.executionStatus}</dd>
            </div>
            <div>
              <dt className="text-[var(--mpa-color-text-tertiary)]">Queue pending</dt>
              <dd className="font-medium text-[var(--mpa-color-text-primary)]">{home.monitoring.queuePending}</dd>
            </div>
            <div>
              <dt className="text-[var(--mpa-color-text-tertiary)]">Workflows active</dt>
              <dd className="font-medium text-[var(--mpa-color-text-primary)]">{home.monitoring.workflowsActive}</dd>
            </div>
            <div>
              <dt className="text-[var(--mpa-color-text-tertiary)]">Automation failed (7d)</dt>
              <dd className="font-medium text-[var(--mpa-color-text-primary)]">{home.monitoring.automationFailed7d}</dd>
            </div>
          </dl>
        </div>

        <div className={`${PANEL} p-[var(--mpa-space-4)]`}>
          <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Operational KPIs</h3>
          <ul className="mt-3 space-y-1 text-sm">
            {kpiEntries.map(([key, value]) => (
              <li key={key} className="flex justify-between gap-3">
                <span className="text-[var(--mpa-color-text-secondary)]">{key}</span>
                <span className="font-medium text-[var(--mpa-color-text-primary)]">{value}</span>
              </li>
            ))}
            {kpiEntries.length === 0 ? (
              <li className="text-[var(--mpa-color-text-tertiary)]">No KPI snapshots yet.</li>
            ) : null}
          </ul>
        </div>

        <div className={`${PANEL} p-[var(--mpa-space-4)]`}>
          <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Quick actions</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {home.quickActions.map((action) => (
              <button
                key={action.actionId}
                type="button"
                disabled={busyActionId === action.actionId}
                onClick={() => void runAction(action.actionId, action.href)}
                className="rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-bg-muted)] px-3 py-1.5 text-sm text-[var(--mpa-color-text-primary)] disabled:opacity-60"
              >
                {busyActionId === action.actionId ? "Working…" : action.label}
              </button>
            ))}
            {home.quickActions.length === 0 ? (
              <p className="text-sm text-[var(--mpa-color-text-tertiary)]">No entitled actions.</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className={`${PANEL} p-[var(--mpa-space-4)]`}>
        <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Recent activity</h3>
        <ul className="mt-3 space-y-2">
          {home.recentActivity.map((entry, index) => (
            <li key={`${entry.eventType}-${entry.occurredAt}-${index}`} className="text-sm">
              {entry.href ? (
                <Link href={entry.href} className="text-[var(--mpa-color-text-primary)] hover:underline">
                  {entry.summary}
                </Link>
              ) : (
                <span className="text-[var(--mpa-color-text-primary)]">{entry.summary}</span>
              )}
              <p className="text-xs text-[var(--mpa-color-text-tertiary)]">
                {entry.eventType} · {new Date(entry.occurredAt).toLocaleString()}
              </p>
            </li>
          ))}
          {home.recentActivity.length === 0 ? (
            <li className="text-sm text-[var(--mpa-color-text-tertiary)]">No recent timeline entries.</li>
          ) : null}
        </ul>
      </div>
    </section>
  );
}
