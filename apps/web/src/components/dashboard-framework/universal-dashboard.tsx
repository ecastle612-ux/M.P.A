"use client";

import Link from "next/link";
import { useState } from "react";
import { EmptyState, KpiMetric, Skeleton } from "@mpa/ui";
import type { UniversalDashboardViewModel } from "./types";

const PANEL =
  "rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] shadow-[var(--mpa-shadow-xs)]";

export function UniversalDashboardSkeleton() {
  return (
    <div className="space-y-[var(--mpa-space-6)]" aria-busy="true" aria-label="Loading dashboard">
      <section className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-4 w-48" />
      </section>
      <section className={`${PANEL} space-y-3 p-[var(--mpa-space-4)]`}>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </section>
      <section className={`${PANEL} space-y-3 p-[var(--mpa-space-4)]`}>
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </section>
    </div>
  );
}

export function UniversalDashboard({
  model,
  onQuickAction
}: {
  model: UniversalDashboardViewModel;
  onQuickAction?: (actionId: string, href?: string) => Promise<void> | void;
}) {
  const [busyActionId, setBusyActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleQuickAction(actionId: string | undefined, href?: string) {
    if (!actionId || !onQuickAction) {
      if (href) window.location.assign(href);
      return;
    }
    setBusyActionId(actionId);
    setActionError(null);
    try {
      await onQuickAction(actionId, href);
    } catch {
      setActionError("Could not run action");
    } finally {
      setBusyActionId(null);
    }
  }

  const greetingTitle = model.greeting.userName
    ? `${model.greeting.timeGreeting}, ${model.greeting.userName}.`
    : `${model.greeting.timeGreeting}.`;

  return (
    <div className="space-y-[var(--mpa-space-6)]" data-ux016="universal-dashboard">
      {/* 1. Greeting */}
      <header className="space-y-[var(--mpa-space-2)]">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--mpa-color-text-tertiary)]">
          Operations
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
          {greetingTitle}
        </h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">{model.greeting.supportingLine}</p>
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
          {model.greeting.organizationName ? (
            <div>
              <dt className="sr-only">Organization</dt>
              <dd>{model.greeting.organizationName}</dd>
            </div>
          ) : null}
          <div>
            <dt className="sr-only">Place</dt>
            <dd>{model.greeting.placeLabel}</dd>
          </div>
          <div>
            <dt className="sr-only">Date</dt>
            <dd>{model.greeting.dateLabel}</dd>
          </div>
        </dl>
        <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
          {model.greeting.statusSummary}
        </p>
      </header>

      {/* 2. Immediate Attention */}
      <section className={`${PANEL} p-[var(--mpa-space-4)]`} aria-labelledby="ux016-attention-heading">
        <div className="flex items-baseline justify-between gap-3">
          <h2
            id="ux016-attention-heading"
            className="text-sm font-semibold text-[var(--mpa-color-text-primary)]"
          >
            Immediate Attention
          </h2>
          <p className="text-xs text-[var(--mpa-color-text-tertiary)]">Highest priority · max 5</p>
        </div>

        {model.attention.length === 0 ? (
          <div className="mt-[var(--mpa-space-3)]">
            <EmptyState
              title="You’re clear for now"
              description="Immediate Attention shows only the highest-priority work. Nothing critical needs you right now."
              whyItMatters="When emergencies, expirations, or approvals appear, they’ll surface here first."
              action={
                model.mission[0]
                  ? { label: "Review today’s mission", href: model.mission[0].href }
                  : model.quickActions[0]?.href
                    ? { label: model.quickActions[0].label, href: model.quickActions[0].href }
                    : { label: "Open inbox", href: "/inbox" }
              }
              className="border-0 bg-transparent px-0 py-[var(--mpa-space-4)]"
            />
          </div>
        ) : (
          <ul className="mt-[var(--mpa-space-3)] divide-y divide-[var(--mpa-color-border-subtle)]">
            {model.attention.map((item, index) => (
              <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {index === 0 ? (
                      <span className="rounded-[var(--mpa-radius-sm)] bg-[var(--mpa-color-brand-primary-subtle)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
                        Next
                      </span>
                    ) : null}
                    <SeverityBadge severity={item.severity} />
                    <p className="font-medium text-[var(--mpa-color-text-primary)]">{item.title}</p>
                  </div>
                  <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{item.reason}</p>
                </div>
                <Link
                  href={item.href}
                  className="inline-flex h-11 min-h-11 shrink-0 items-center justify-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-semibold text-[var(--mpa-color-text-inverse)] shadow-[var(--mpa-shadow-xs)] hover:bg-[var(--mpa-color-brand-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
                >
                  {item.actionLabel}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 3. Today's Mission */}
      <section className={`${PANEL} p-[var(--mpa-space-4)]`} aria-labelledby="ux016-mission-heading">
        <h2
          id="ux016-mission-heading"
          className="text-sm font-semibold text-[var(--mpa-color-text-primary)]"
        >
          Today’s Mission
        </h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Your primary work queue — start directly from here.
        </p>
        {model.mission.length === 0 ? (
          <p className="mt-[var(--mpa-space-3)] text-sm text-[var(--mpa-color-text-tertiary)]">
            No open work in your queues right now. Create work or invite teammates when you’re ready.
          </p>
        ) : (
          <ul className="mt-[var(--mpa-space-3)] grid gap-2 sm:grid-cols-2">
            {model.mission.map((row) => (
              <li key={row.id}>
                <Link
                  href={row.href}
                  className="flex items-center justify-between gap-3 rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] px-3 py-3 text-sm transition-colors hover:bg-[var(--mpa-color-interactive-row-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
                >
                  <span className="text-[var(--mpa-color-text-secondary)]">{row.label}</span>
                  <span className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
                    {row.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 4. Quick Actions */}
      <section className={`${PANEL} p-[var(--mpa-space-4)]`} aria-labelledby="ux016-actions-heading">
        <h2
          id="ux016-actions-heading"
          className="text-sm font-semibold text-[var(--mpa-color-text-primary)]"
        >
          Quick Actions
        </h2>
        {actionError ? (
          <p className="mt-2 text-sm text-[var(--mpa-color-status-danger)]" role="alert">
            {actionError}
          </p>
        ) : null}
        {model.quickActions.length === 0 ? (
          <p className="mt-[var(--mpa-space-3)] text-sm text-[var(--mpa-color-text-tertiary)]">
            No entitled shortcuts for this session.
          </p>
        ) : (
          <div className="mt-[var(--mpa-space-3)] flex flex-wrap gap-2">
            {model.quickActions.map((action) =>
              action.actionId && onQuickAction ? (
                <button
                  key={action.id}
                  type="button"
                  disabled={busyActionId === action.actionId}
                  onClick={() => void handleQuickAction(action.actionId, action.href)}
                  className="inline-flex h-11 min-h-11 items-center justify-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 text-sm font-medium text-[var(--mpa-color-text-primary)] shadow-[var(--mpa-shadow-xs)] hover:bg-[var(--mpa-color-interactive-row-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)] disabled:opacity-60"
                >
                  {busyActionId === action.actionId ? "Working…" : action.label}
                </button>
              ) : (
                <Link
                  key={action.id}
                  href={action.href ?? "/dashboard"}
                  className="inline-flex h-11 min-h-11 items-center justify-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 text-sm font-medium text-[var(--mpa-color-text-primary)] shadow-[var(--mpa-shadow-xs)] hover:bg-[var(--mpa-color-interactive-row-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
                >
                  {action.label}
                </Link>
              )
            )}
          </div>
        )}
      </section>

      {/* 5. Recent Activity */}
      {model.recentActivity.length > 0 ? (
        <section className={`${PANEL} p-[var(--mpa-space-4)]`} aria-labelledby="ux016-activity-heading">
          <div className="flex items-baseline justify-between gap-3">
            <h2
              id="ux016-activity-heading"
              className="text-sm font-semibold text-[var(--mpa-color-text-primary)]"
            >
              Recent Activity
            </h2>
            <Link
              href="/activity"
              className="text-sm text-[var(--mpa-color-brand-primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
            >
              View all
            </Link>
          </div>
          <ul className="mt-[var(--mpa-space-3)] space-y-2">
            {model.recentActivity.map((entry) => (
              <li key={entry.id} className="text-sm">
                {entry.href ? (
                  <Link
                    href={entry.href}
                    className="font-medium text-[var(--mpa-color-text-primary)] hover:underline"
                  >
                    {entry.summary}
                  </Link>
                ) : (
                  <span className="font-medium text-[var(--mpa-color-text-primary)]">{entry.summary}</span>
                )}
                <p className="text-xs text-[var(--mpa-color-text-tertiary)]">{entry.meta}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* 6. Insights — below the fold */}
      <section
        id="insights"
        className={`${PANEL} p-[var(--mpa-space-4)]`}
        aria-labelledby="ux016-insights-heading"
      >
        <h2
          id="ux016-insights-heading"
          className="text-sm font-semibold text-[var(--mpa-color-text-primary)]"
        >
          Insights
        </h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Analytics stay below the fold — work comes first.
        </p>
        {model.insights.length === 0 ? (
          <p className="mt-[var(--mpa-space-3)] text-sm text-[var(--mpa-color-text-tertiary)]">
            Portfolio metrics will appear here as your organization grows.
          </p>
        ) : (
          <div className="mt-[var(--mpa-space-3)] grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {model.insights.map((insight) => {
              if (insight.href) {
                return (
                  <KpiMetric
                    key={insight.id}
                    label={insight.label}
                    value={insight.value}
                    href={insight.href}
                    hint="Open"
                  />
                );
              }
              return <KpiMetric key={insight.id} label={insight.label} value={insight.value} />;
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: "critical" | "high" | "normal" }) {
  const styles =
    severity === "critical"
      ? "bg-[var(--mpa-color-status-danger-subtle,var(--mpa-color-bg-muted))] text-[var(--mpa-color-status-danger)]"
      : severity === "high"
        ? "bg-[var(--mpa-color-status-warning-subtle,var(--mpa-color-bg-muted))] text-[var(--mpa-color-status-warning,#b45309)]"
        : "bg-[var(--mpa-color-bg-muted)] text-[var(--mpa-color-text-secondary)]";

  const label = severity === "critical" ? "Critical" : severity === "high" ? "High" : "Normal";

  return (
    <span className={`rounded-[var(--mpa-radius-sm)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${styles}`}>
      {label}
    </span>
  );
}
