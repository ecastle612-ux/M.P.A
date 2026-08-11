import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@mpa/ui";
import type { PlatformErrorsListResult } from "../../lib/admin/load-platform-errors";
import type { SafePlatformErrorDto } from "../../lib/admin/platform-errors";

function severityVariant(severity: string): "danger" | "warning" | "info" | "neutral" {
  if (severity === "critical") return "danger";
  if (severity === "error") return "warning";
  if (severity === "warning") return "info";
  return "neutral";
}

function FilterForm({ filters }: { filters: PlatformErrorsListResult["filters"] }) {
  return (
    <form method="get" className="grid gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 md:grid-cols-4">
      <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
        Severity
        <select
          name="severity"
          defaultValue={filters.severity}
          className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-2 py-2 text-sm text-[var(--mpa-color-text-primary)]"
        >
          <option value="all">All</option>
          <option value="critical">Critical</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
          <option value="debug">Debug</option>
        </select>
      </label>
      <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
        Time range
        <select
          name="range"
          defaultValue={filters.range}
          className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-2 py-2 text-sm text-[var(--mpa-color-text-primary)]"
        >
          <option value="1h">Last 1 hour</option>
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
      </label>
      <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
        Organization ID
        <input
          name="organizationId"
          defaultValue={filters.organizationId ?? ""}
          placeholder="uuid"
          className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-2 py-2 font-mono text-sm text-[var(--mpa-color-text-primary)]"
        />
      </label>
      <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
        Route / category
        <input
          name="q"
          defaultValue={filters.routeContains ?? ""}
          placeholder="route, name, or message"
          className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-2 py-2 text-sm text-[var(--mpa-color-text-primary)]"
        />
      </label>
      <div className="md:col-span-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="rounded-md bg-[var(--mpa-color-brand-primary)] px-4 py-2 text-sm font-medium text-white"
        >
          Apply filters
        </button>
        <Link href="/admin/errors" className="text-sm text-[var(--mpa-color-brand-primary)] underline">
          Clear
        </Link>
        <p className="text-xs text-[var(--mpa-color-text-secondary)]">
          Resolved/unresolved filter: not available — schema has no resolution columns (deferred).
        </p>
      </div>
    </form>
  );
}

function ErrorRow({ error }: { error: SafePlatformErrorDto }) {
  return (
    <li>
      <Link
        href={`/admin/errors/${error.id}`}
        className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 hover:bg-[var(--mpa-color-bg-app)]"
      >
        <span className="min-w-0 flex-1 space-y-1">
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant={severityVariant(error.severity)}>{error.severity}</Badge>
            {error.errorName ? (
              <span className="font-mono text-[11px] text-[var(--mpa-color-text-secondary)]">
                {error.errorName}
              </span>
            ) : null}
            <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{error.message}</span>
          </span>
          <span className="block font-mono text-[11px] text-[var(--mpa-color-text-secondary)]">
            {[
              error.route,
              error.organizationId ? `org ${error.organizationId}` : null,
              error.requestId ? `req ${error.requestId}` : null,
              `status ${error.resolutionStatus}`,
              `n=${error.occurrenceCount}`
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </span>
        <time className="font-mono text-[10px] text-[var(--mpa-color-text-secondary)]">
          {new Date(error.createdAt).toLocaleString()}
        </time>
      </Link>
    </li>
  );
}

export function PlatformErrorsPage({ result }: { result: PlatformErrorsListResult }) {
  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Master Admin
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
          Critical Errors
        </h1>
        <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          Authoritative durable feed from Sprint 5 <code className="font-mono text-xs">platform_error_events</code>
          . {result.rangeLabel}. Secrets and credentials are scrubbed.
        </p>
        <Link href="/admin" className="text-sm text-[var(--mpa-color-brand-primary)] underline">
          ← Overview
        </Link>
      </header>

      <FilterForm filters={result.filters} />

      {result.degraded ? (
        <div
          role="alert"
          className="rounded-md border border-[var(--mpa-color-border-default)] border-l-4 border-l-[#C0392B] bg-white px-4 py-3 text-sm"
        >
          <p className="font-semibold text-[var(--mpa-color-text-primary)]">Error feed unavailable</p>
          <p className="text-[var(--mpa-color-text-secondary)]">
            {result.detail ?? "Could not load platform_error_events."}
          </p>
        </div>
      ) : null}

      <p className="text-xs text-[var(--mpa-color-text-secondary)]">{result.resolutionLimitation}</p>

      {result.errors.length === 0 && !result.degraded ? (
        <p className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-6 text-sm text-[var(--mpa-color-text-secondary)]">
          No errors match the current filters.
        </p>
      ) : result.errors.length === 0 ? null : (
        <ul className="divide-y divide-[var(--mpa-color-border-subtle)] rounded-md border border-[var(--mpa-color-border-default)] bg-white">
          {result.errors.map((error) => (
            <ErrorRow key={error.id} error={error} />
          ))}
        </ul>
      )}
    </main>
  );
}

export function PlatformErrorDetailPage({
  error,
  degraded,
  detail
}: {
  error: SafePlatformErrorDto | null;
  degraded: boolean;
  detail?: string;
}): ReactNode {
  if (!error) {
    return (
      <main className="space-y-4 p-4 md:p-6">
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Error not found
        </h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          {degraded
            ? detail ?? "Error feed degraded."
            : "No platform_error_events row for this id."}
        </p>
        <Link href="/admin/errors" className="text-sm text-[var(--mpa-color-brand-primary)] underline">
          ← Back to Errors
        </Link>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <Link href="/admin/errors" className="text-sm text-[var(--mpa-color-brand-primary)] underline">
          ← Errors
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={severityVariant(error.severity)}>{error.severity}</Badge>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            {error.errorName ?? "Platform error"}
          </h1>
        </div>
        <p className="text-sm text-[var(--mpa-color-text-primary)]">{error.message}</p>
      </header>

      <dl className="grid gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase text-[var(--mpa-color-text-secondary)]">When</dt>
          <dd className="font-mono text-sm">{new Date(error.createdAt).toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-[var(--mpa-color-text-secondary)]">Source</dt>
          <dd className="font-mono text-sm">{error.source}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-[var(--mpa-color-text-secondary)]">Route / operation</dt>
          <dd className="font-mono text-sm break-all">{error.route ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-[var(--mpa-color-text-secondary)]">Request / correlation ID</dt>
          <dd className="font-mono text-sm break-all">{error.requestId ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-[var(--mpa-color-text-secondary)]">Organization</dt>
          <dd className="font-mono text-sm break-all">
            {error.organizationId ? (
              <Link
                href={`/admin/platform/organizations/${error.organizationId}`}
                className="text-[var(--mpa-color-brand-primary)] underline"
              >
                {error.organizationId}
              </Link>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-[var(--mpa-color-text-secondary)]">Actor</dt>
          <dd className="font-mono text-sm break-all">{error.actorId ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-[var(--mpa-color-text-secondary)]">Occurrence count</dt>
          <dd className="font-mono text-sm">
            {error.occurrenceCount}{" "}
            <span className="text-xs text-[var(--mpa-color-text-secondary)]">
              (per-row; aggregation not in schema)
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-[var(--mpa-color-text-secondary)]">Resolution</dt>
          <dd className="text-sm">
            {error.resolutionStatus}
            <span className="mt-1 block text-xs text-[var(--mpa-color-text-secondary)]">
              {error.resolutionNote}
            </span>
          </dd>
        </div>
      </dl>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
          Safe metadata
        </h2>
        {Object.keys(error.metadata).length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">No metadata.</p>
        ) : (
          <pre className="overflow-auto rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3 font-mono text-xs text-[var(--mpa-color-text-primary)]">
            {JSON.stringify(error.metadata, null, 2)}
          </pre>
        )}
      </section>

      {error.stack ? (
        <section className="space-y-2">
          <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
            Stack (scrubbed)
          </h2>
          <pre className="max-h-80 overflow-auto rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3 font-mono text-[11px] text-[var(--mpa-color-text-secondary)]">
            {error.stack}
          </pre>
        </section>
      ) : null}
    </main>
  );
}
