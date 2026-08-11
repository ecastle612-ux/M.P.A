import Link from "next/link";
import { Badge } from "@mpa/ui";
import type { Ma3AuditDirectory } from "../../lib/admin/load-ma3-audit";
import type { Ma3AuditEvent } from "../../lib/admin/ma3-audit";

export function Ma3AuditLogPage({ directory }: { directory: Ma3AuditDirectory }) {
  const { events, filters, degraded, limitations } = directory;

  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Master Admin
        </p>
        <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
          Audit Log
        </h1>
        <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          Who did what to what, in which organization, when, with what result. Read-only explorer over
          existing audit infrastructure.
        </p>
        <p className="text-xs text-[var(--mpa-color-text-secondary)]">{filters.rangeLabel}</p>
      </header>

      <form
        method="get"
        className="grid gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 md:grid-cols-3 xl:grid-cols-4"
      >
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Time range
          <select
            name="range"
            defaultValue={filters.range ?? "7d"}
            className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 text-sm"
          >
            <option value="1h">Last 1 hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Source
          <select
            name="source"
            defaultValue={filters.source ?? "all"}
            className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="support">Support / Master Admin</option>
            <option value="domain">Domain</option>
            <option value="security">Security signals</option>
          </select>
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Organization ID
          <input
            name="organizationId"
            defaultValue={filters.organizationId ?? ""}
            className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 font-mono text-sm"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Actor ID
          <input
            name="actor"
            defaultValue={filters.actorId ?? ""}
            className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 font-mono text-sm"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Action
          <input
            name="action"
            defaultValue={filters.action ?? ""}
            className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 text-sm"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Target type
          <input
            name="targetType"
            defaultValue={filters.targetType ?? ""}
            className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 text-sm"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Result
          <input
            name="result"
            defaultValue={filters.result ?? ""}
            className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 text-sm"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Search
          <input
            name="q"
            defaultValue={filters.q ?? ""}
            className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 text-sm"
          />
        </label>
        <div className="md:col-span-3 xl:col-span-4 flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-md bg-[var(--mpa-color-brand-primary)] px-4 py-2 text-sm font-medium text-white"
          >
            Apply filters
          </button>
          <Link href="/admin/audit" className="text-sm text-[var(--mpa-color-brand-primary)] underline">
            Clear
          </Link>
        </div>
      </form>

      {degraded.length > 0 ? (
        <div
          role="status"
          className="rounded-md border border-l-4 border-l-[#C0392B] border-[var(--mpa-color-border-default)] bg-white px-4 py-3 text-sm"
        >
          <p className="font-semibold">Partial data</p>
          <ul className="mt-1 list-disc pl-5 text-[var(--mpa-color-text-secondary)]">
            {degraded.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <ul className="space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
        {limitations.map((l) => (
          <li key={l}>• {l}</li>
        ))}
      </ul>

      {events.length === 0 ? (
        <p className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-6 text-sm text-[var(--mpa-color-text-secondary)]">
          No audit events match the current filters.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--mpa-color-border-subtle)] rounded-md border border-[var(--mpa-color-border-default)] bg-white">
          {events.map((e) => (
            <AuditRow key={`${e.source}-${e.id}`} event={e} />
          ))}
        </ul>
      )}
    </main>
  );
}

function AuditRow({ event }: { event: Ma3AuditEvent }) {
  return (
    <li>
      <Link
        href={`/admin/audit/${event.id}`}
        className="block px-4 py-3 hover:bg-[var(--mpa-color-bg-app)]"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">{event.source}</Badge>
          <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{event.action}</span>
          <Badge variant="neutral">{event.result}</Badge>
        </div>
        <p className="mt-1 font-mono text-[11px] text-[var(--mpa-color-text-secondary)]">
          {[
            event.createdAt ? new Date(event.createdAt).toLocaleString() : null,
            event.actorId ? `actor ${event.actorId}` : null,
            event.organizationName ?? event.organizationId,
            `${event.targetType}${event.targetId ? `:${event.targetId}` : ""}`
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </Link>
    </li>
  );
}

export function Ma3AuditDetailPage({
  event,
  degraded
}: {
  event: Ma3AuditEvent | null;
  degraded: string[];
}) {
  if (!event) {
    return (
      <main className="space-y-4 p-4 md:p-6">
        <Link href="/admin/audit" className="text-sm text-[var(--mpa-color-brand-primary)] underline">
          ← Audit Log
        </Link>
        <h1 className="font-display text-2xl font-semibold">Audit event not found</h1>
        {degraded.length > 0 ? (
          <ul className="list-disc pl-5 text-sm text-[var(--mpa-color-text-secondary)]">
            {degraded.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        ) : null}
      </main>
    );
  }

  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <Link href="/admin/audit" className="text-sm text-[var(--mpa-color-brand-primary)] underline">
          ← Audit Log
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral">{event.source}</Badge>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            {event.action}
          </h1>
        </div>
      </header>

      <dl className="grid gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 sm:grid-cols-2 text-sm">
        <div>
          <dt className="text-xs uppercase text-[var(--mpa-color-text-secondary)]">Event ID</dt>
          <dd className="font-mono text-xs break-all">{event.id}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-[var(--mpa-color-text-secondary)]">Timestamp</dt>
          <dd className="font-mono text-xs">
            {event.createdAt ? new Date(event.createdAt).toLocaleString() : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-[var(--mpa-color-text-secondary)]">Actor</dt>
          <dd className="font-mono text-xs break-all">
            {event.actorId ? (
              <Link
                href={`/admin/users/${event.actorId}`}
                className="text-[var(--mpa-color-brand-primary)] underline"
              >
                {event.actorId}
              </Link>
            ) : (
              "—"
            )}
            {event.actorLabel ? ` (${event.actorLabel})` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-[var(--mpa-color-text-secondary)]">Organization</dt>
          <dd className="font-mono text-xs break-all">
            {event.organizationId ? (
              <Link
                href={`/admin/platform/organizations/${event.organizationId}`}
                className="text-[var(--mpa-color-brand-primary)] underline"
              >
                {event.organizationName ?? event.organizationId}
              </Link>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-[var(--mpa-color-text-secondary)]">Target</dt>
          <dd className="font-mono text-xs break-all">
            {event.targetType}
            {event.targetId ? `:${event.targetId}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-[var(--mpa-color-text-secondary)]">Result</dt>
          <dd>{event.result}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-[var(--mpa-color-text-secondary)]">Reason / context</dt>
          <dd>{event.reason ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-[var(--mpa-color-text-secondary)]">Correlation ID</dt>
          <dd className="font-mono text-xs break-all">{event.correlationId ?? "—"}</dd>
        </div>
      </dl>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-semibold">Safe metadata</h2>
        {Object.keys(event.context).length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">No metadata.</p>
        ) : (
          <pre className="overflow-auto rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3 font-mono text-xs">
            {JSON.stringify(event.context, null, 2)}
          </pre>
        )}
      </section>
    </main>
  );
}
