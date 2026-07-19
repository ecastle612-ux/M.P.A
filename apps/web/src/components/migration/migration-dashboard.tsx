"use client";

import Link from "next/link";
import type { MigrationDashboardMetrics } from "../../lib/migration/server";
import type { MigrationJobRecord } from "../../lib/migration/contracts";
import { Card, KpiMetric } from "@mpa/ui";

export function MigrationDashboard({
  jobs,
  metrics,
  canCreate
}: {
  jobs: MigrationJobRecord[];
  metrics: MigrationDashboardMetrics;
  canCreate: boolean;
}) {
  return (
    <div className="space-y-6">
      <header className="mpa-page-header flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="mpa-section-label text-[var(--mpa-color-brand-primary)]">Migration Center</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
            Migration jobs
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">
            Track each import job below. Use the switching checklist above for overall go-live readiness.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/residents/bulk"
            className="inline-flex h-9 items-center justify-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 text-sm font-medium text-[var(--mpa-color-text-primary)] shadow-[var(--mpa-shadow-xs)]"
          >
            Bulk resident ops
          </Link>
          {canCreate ? (
            <Link
              href="/migration/new"
              className="inline-flex h-9 items-center justify-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-medium text-[var(--mpa-color-text-inverse)] shadow-[var(--mpa-shadow-xs)] hover:bg-[var(--mpa-color-brand-primary-hover)]"
            >
              Start new migration
            </Link>
          ) : null}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiMetric label="Active jobs" value={String(metrics.activeJobs)} />
        <KpiMetric label="Completed" value={String(metrics.completedJobs)} />
        <KpiMetric label="Pending review" value={String(metrics.pendingReview)} />
        <KpiMetric label="Import errors" value={String(metrics.recentErrors)} />
        <KpiMetric label="Avg completion" value={`${metrics.averageCompletionPct}%`} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Recent migrations</h2>
          {metrics.recentImports.length === 0 ? (
            <div className="mt-3 space-y-2 rounded-[var(--mpa-radius-md)] border border-dashed border-[var(--mpa-color-border-default)] p-4">
              <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
                Ready when your export files are
              </p>
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                Start a guided migration to bring Properties, Units, Residents, Leases, and Vendors into M.P.A. with
                preview and rollback.
              </p>
              {canCreate ? (
                <Link
                  href="/migration/new"
                  className="inline-flex text-sm font-semibold text-[var(--mpa-color-brand-primary)] hover:underline"
                >
                  Start guided migration →
                </Link>
              ) : null}
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {metrics.recentImports.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-[var(--mpa-color-bg-muted)]">
                    <span>
                      <span className="block text-sm font-medium text-[var(--mpa-color-text-primary)]">{item.name}</span>
                      <span className="text-xs text-[var(--mpa-color-text-secondary)]">{item.jobNumber}</span>
                    </span>
                    <span className="text-xs font-medium text-[var(--mpa-color-text-secondary)]">
                      {item.completionPct}% · {item.status.replaceAll("_", " ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Recent activity</h2>
          {metrics.recentActivity.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">Activity will appear here as you migrate.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {metrics.recentActivity.map((event) => (
                <li key={event.id}>
                  <Link href={event.href} className="block rounded-md px-2 py-2 hover:bg-[var(--mpa-color-bg-muted)]">
                    <p className="text-sm text-[var(--mpa-color-text-primary)]">{event.summary}</p>
                    <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                      {event.jobNumber} · {new Date(event.createdAt).toLocaleString()}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">All migration jobs</h2>
          {canCreate ? (
            <Link href="/migration/new" className="text-xs font-semibold text-[var(--mpa-color-brand-primary)] hover:underline">
              New migration
            </Link>
          ) : null}
        </div>
        {jobs.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-[var(--mpa-color-border-subtle)] p-6 text-center">
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              You haven&apos;t started a migration yet. When you&apos;re ready, create your first job and we&apos;ll walk you through the rest.
            </p>
            {canCreate ? (
              <Link
                href="/migration/new"
                className="mt-4 inline-flex h-9 items-center justify-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-medium text-[var(--mpa-color-text-inverse)]"
              >
                Start your first migration
              </Link>
            ) : null}
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--mpa-color-border-subtle)]">
            {jobs.map((job) => (
              <li key={job.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <Link href={`/migration/${job.id}`} className="text-sm font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
                    {job.name}
                  </Link>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                    {job.jobNumber} · {job.sourceSoftware.replaceAll("_", " ")} · {job.status.replaceAll("_", " ")}
                  </p>
                </div>
                <div className="text-right text-xs text-[var(--mpa-color-text-secondary)]">
                  <p>{job.progressImported}/{job.progressTotal || "—"} imported</p>
                  <p>{job.completionPct}% complete</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
