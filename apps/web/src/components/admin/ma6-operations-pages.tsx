import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@mpa/ui";
import type { Ma6OperationsSnapshot } from "../../lib/admin/load-ma6-operations";
import {
  diagLabel,
  type Ma6DiagTone,
  type Ma6NotificationRow,
  type Ma6WorkOrderRow
} from "../../lib/admin/ma6-operations";

function ToneBadge({ tone }: { tone: Ma6DiagTone }) {
  const variant = tone === "healthy" ? "success" : tone === "attention" ? "warning" : "neutral";
  return <Badge variant={variant}>{diagLabel(tone)}</Badge>;
}

function OpsNav() {
  const items = [
    ["/admin/operations", "Overview"],
    ["/admin/operations/work-orders", "Work Orders"],
    ["/admin/operations/properties", "Properties & Units"],
    ["/admin/operations/vendors", "Vendors"],
    ["/admin/operations/notifications", "Notifications"]
  ] as const;
  return (
    <nav className="flex flex-wrap gap-3 text-xs">
      {items.map(([href, label]) => (
        <Link key={href} href={href} className="text-[var(--mpa-color-brand-primary)] underline">
          {label}
        </Link>
      ))}
    </nav>
  );
}

function Degraded({ degraded }: { degraded: string[] }) {
  if (!degraded.length) return null;
  return (
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
  );
}

function Pager({
  basePath,
  snapshot
}: {
  basePath: string;
  snapshot: Ma6OperationsSnapshot;
}) {
  const { filters, pagination } = snapshot;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v == null || v === "" || k === "page" || k === "rangeLabel") continue;
    params.set(k, String(v));
  }
  const prev = pagination.page > 1 ? pagination.page - 1 : null;
  const next = pagination.hasMore ? pagination.page + 1 : null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <p className="text-[var(--mpa-color-text-secondary)]">
        Page {pagination.page} of {pagination.totalPages} · {pagination.total} matched
      </p>
      <div className="flex gap-3">
        {prev ? (
          <Link
            href={`${basePath}?${new URLSearchParams({ ...Object.fromEntries(params), page: String(prev) })}`}
            className="text-[var(--mpa-color-brand-primary)] underline"
          >
            Previous
          </Link>
        ) : (
          <span className="text-[var(--mpa-color-text-secondary)]">Previous</span>
        )}
        {next ? (
          <Link
            href={`${basePath}?${new URLSearchParams({ ...Object.fromEntries(params), page: String(next) })}`}
            className="text-[var(--mpa-color-brand-primary)] underline"
          >
            Next
          </Link>
        ) : (
          <span className="text-[var(--mpa-color-text-secondary)]">Next</span>
        )}
      </div>
    </div>
  );
}

export function Ma6OperationsOverviewPage({ snapshot }: { snapshot: Ma6OperationsSnapshot }) {
  const { overview, organizations, anomalies, degraded, limitations } = snapshot;
  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Master Admin
        </p>
        <h1 className="font-display text-3xl font-semibold">Operations</h1>
        <p className="max-w-3xl text-sm text-[var(--mpa-color-text-secondary)]">
          Platform-wide operational health — properties, units, work orders, vendors, and
          notifications. Read-only.
        </p>
        <OpsNav />
        <ToneBadge tone={overview.health} />
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ["Properties", overview.properties],
            ["Units", overview.units],
            ["Open WOs", overview.openWorkOrders],
            ["Overdue WOs", overview.overdueWorkOrders],
            ["In progress", overview.inProgressWorkOrders],
            ["Completed", overview.completedWorkOrders],
            ["Active vendors", overview.activeVendors],
            ["Orgs attention", overview.orgsAttention]
          ] as const
        ).map(([label, value]) => (
          <article
            key={label}
            className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-3"
          >
            <p className="text-[11px] uppercase text-[var(--mpa-color-text-secondary)]">{label}</p>
            <p className="font-display text-2xl font-semibold tabular-nums">{value}</p>
          </article>
        ))}
      </div>

      <Degraded degraded={degraded} />

      <section className="space-y-2">
        <h2 className="font-display text-lg font-semibold">Organization operational health</h2>
        {organizations.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">No organization rows.</p>
        ) : (
          <ul className="divide-y divide-[var(--mpa-color-border-subtle)] rounded-md border border-[var(--mpa-color-border-default)] bg-white">
            {organizations.map((org) => (
              <li key={org.organizationId} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/admin/platform/organizations/${org.organizationId}`}
                    className="font-medium text-[var(--mpa-color-brand-primary)] underline"
                  >
                    {org.organizationName}
                  </Link>
                  <ToneBadge tone={org.health} />
                </div>
                <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                  {org.propertyCount} properties · {org.unitCount} units · {org.openWorkOrders} open ·{" "}
                  {org.overdueWorkOrders} overdue · {org.vendorCount} vendors ·{" "}
                  {org.notificationFailures} notif failures
                </p>
                <Link
                  href={`/admin/operations/work-orders?organizationId=${encodeURIComponent(org.organizationId)}`}
                  className="text-xs text-[var(--mpa-color-brand-primary)] underline"
                >
                  Work orders →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-semibold">Operational anomalies</h2>
        {anomalies.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">No anomalies in sample.</p>
        ) : (
          <ul className="space-y-2">
            {anomalies.slice(0, 40).map((a) => (
              <li
                key={`${a.code}-${a.objectId}-${a.at}`}
                className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm"
              >
                <Badge variant="warning">{a.code}</Badge> {a.reason}
                {a.href ? (
                  <Link href={a.href} className="ml-2 text-[var(--mpa-color-brand-primary)] underline">
                    Open
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <ul className="space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
        {limitations.map((l) => (
          <li key={l}>• {l}</li>
        ))}
      </ul>
      <Pager basePath="/admin/operations" snapshot={snapshot} />
    </main>
  );
}

export function Ma6WorkOrdersPage({ snapshot }: { snapshot: Ma6OperationsSnapshot }) {
  const { workOrders, filters, degraded, limitations } = snapshot;
  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold">Work Orders</h1>
        <OpsNav />
      </header>
      <FilterForm basePath="/admin/operations/work-orders" filters={filters} workOrder />
      <Degraded degraded={degraded} />
      {workOrders.length === 0 ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">No work orders match.</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--mpa-color-border-default)] text-xs uppercase text-[var(--mpa-color-text-secondary)]">
                  <th className="px-3 py-2">Work order</th>
                  <th className="px-3 py-2">Organization</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Priority</th>
                  <th className="px-3 py-2">Age</th>
                  <th className="px-3 py-2">Health</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.map((wo) => (
                  <tr key={wo.id} className="border-b border-[var(--mpa-color-border-subtle)]">
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/operations/work-orders/${wo.id}`}
                        className="text-[var(--mpa-color-brand-primary)] underline"
                      >
                        {wo.title || wo.id}
                      </Link>
                      <p className="font-mono text-[10px] text-[var(--mpa-color-text-secondary)]">
                        {wo.id}
                      </p>
                    </td>
                    <td className="px-3 py-2">{wo.organizationName ?? wo.organizationId}</td>
                    <td className="px-3 py-2">
                      {wo.status}
                      {wo.overdue ? " · overdue" : ""}
                      {wo.unassigned ? " · unassigned" : ""}
                    </td>
                    <td className="px-3 py-2">{wo.priority}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {wo.ageDays == null ? "—" : `${wo.ageDays}d`}
                    </td>
                    <td className="px-3 py-2">
                      <ToneBadge tone={wo.health} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-3 md:hidden">
            {workOrders.map((wo) => (
              <li
                key={wo.id}
                className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3"
              >
                <Link
                  href={`/admin/operations/work-orders/${wo.id}`}
                  className="text-sm text-[var(--mpa-color-brand-primary)] underline"
                >
                  {wo.title}
                </Link>
                <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                  {wo.status} · {wo.priority} · {wo.organizationName ?? wo.organizationId}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
      <ul className="space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
        {limitations.map((l) => (
          <li key={l}>• {l}</li>
        ))}
      </ul>
      <Pager basePath="/admin/operations/work-orders" snapshot={snapshot} />
    </main>
  );
}

export type Ma6WorkOrderAuditEvent = {
  id: string;
  createdAt: string;
  action: string;
  entityType: string;
  actorId: string | null;
};

export function Ma6WorkOrderDetailPage({
  workOrder,
  notifications,
  auditEvents = [],
  degraded
}: {
  workOrder: Ma6WorkOrderRow | null;
  notifications: Ma6NotificationRow[];
  auditEvents?: Ma6WorkOrderAuditEvent[];
  degraded: string[];
}) {
  if (!workOrder) {
    return (
      <main className="space-y-4 p-4 md:p-6">
        <Link
          href="/admin/operations/work-orders"
          className="text-sm text-[var(--mpa-color-brand-primary)] underline"
        >
          ← Work Orders
        </Link>
        <h1 className="font-display text-2xl font-semibold">Work order not found</h1>
        <Degraded degraded={degraded} />
      </main>
    );
  }
  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <Link
          href="/admin/operations/work-orders"
          className="text-sm text-[var(--mpa-color-brand-primary)] underline"
        >
          ← Work Orders
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-3xl font-semibold">{workOrder.title}</h1>
          <ToneBadge tone={workOrder.health} />
        </div>
        <p className="font-mono text-xs text-[var(--mpa-color-text-secondary)]">{workOrder.id}</p>
      </header>
      <dl className="grid gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 sm:grid-cols-2 text-sm">
        <Kv
          label="Organization"
          value={
            <Link
              href={`/admin/platform/organizations/${workOrder.organizationId}`}
              className="text-[var(--mpa-color-brand-primary)] underline"
            >
              {workOrder.organizationName ?? workOrder.organizationId}
            </Link>
          }
        />
        <Kv label="Property" value={workOrder.propertyName ?? workOrder.propertyId ?? "—"} />
        <Kv label="Unit" value={workOrder.unitLabel ?? workOrder.unitId ?? "—"} />
        <Kv label="Status" value={workOrder.status} />
        <Kv label="Priority" value={workOrder.priority} />
        <Kv
          label="Assignee"
          value={
            workOrder.assigneeType
              ? `${workOrder.assigneeType}${workOrder.technicianUserId ? ` · ${workOrder.technicianUserId}` : ""}`
              : "—"
          }
        />
        <Kv label="Vendor" value={workOrder.vendorName ?? workOrder.vendorId ?? "—"} />
        <Kv label="Surface" value={workOrder.workSurface ?? "—"} />
        <Kv label="Created" value={new Date(workOrder.createdAt).toLocaleString()} />
        <Kv label="Updated" value={new Date(workOrder.updatedAt).toLocaleString()} />
        <Kv label="Due" value={workOrder.dueAt ? new Date(workOrder.dueAt).toLocaleString() : "—"} />
        <Kv
          label="Completed"
          value={workOrder.completedAt ? new Date(workOrder.completedAt).toLocaleString() : "—"}
        />
        <Kv
          label="Cancelled"
          value={workOrder.cancelledAt ? new Date(workOrder.cancelledAt).toLocaleString() : "—"}
        />
        <Kv label="Age (days)" value={workOrder.ageDays ?? "—"} />
        <Kv label="Overdue" value={workOrder.overdue ? "yes" : "no"} />
        <Kv label="Unassigned" value={workOrder.unassigned ? "yes" : "no"} />
      </dl>
      <section className="space-y-2">
        <h2 className="font-display text-lg font-semibold">Timeline</h2>
        <ul className="space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
          <li>Created · {new Date(workOrder.createdAt).toLocaleString()}</li>
          <li>Updated · {new Date(workOrder.updatedAt).toLocaleString()}</li>
          {workOrder.dueAt ? <li>Due · {new Date(workOrder.dueAt).toLocaleString()}</li> : null}
          {workOrder.completedAt ? (
            <li>Completed · {new Date(workOrder.completedAt).toLocaleString()}</li>
          ) : null}
          {workOrder.cancelledAt ? (
            <li>Cancelled · {new Date(workOrder.cancelledAt).toLocaleString()}</li>
          ) : null}
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="font-display text-lg font-semibold">Related notifications</h2>
        {notifications.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">None found for this work order.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {notifications.map((n) => (
              <li key={n.id} className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2">
                {n.title} · {n.channel ?? "—"} · {n.emailDeliveryStatus ?? "no delivery status"} ·{" "}
                {new Date(n.createdAt).toLocaleString()} · <ToneBadge tone={n.health} />
                {n.emailDeliveryError ? (
                  <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">{n.emailDeliveryError}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="space-y-2">
        <h2 className="font-display text-lg font-semibold">Related audit events</h2>
        {auditEvents.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">None found for this work order.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {auditEvents.map((a) => (
              <li key={a.id} className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2">
                <Link href={`/admin/audit/${a.id}`} className="text-[var(--mpa-color-brand-primary)] underline">
                  {a.action}
                </Link>
                <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                  {a.entityType} · {a.actorId ?? "system"} · {new Date(a.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="text-xs text-[var(--mpa-color-text-secondary)]">Read-only. No work-order mutations.</p>
      <Degraded degraded={degraded} />
    </main>
  );
}

export function Ma6PropertiesPage({ snapshot }: { snapshot: Ma6OperationsSnapshot }) {
  const { properties, units, filters, degraded } = snapshot;
  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold">Properties & Units</h1>
        <OpsNav />
        <p className="text-xs text-[var(--mpa-color-text-secondary)]">
          Inventory visibility only. Commercial capacity remains on Capacity (MA-4).
        </p>
      </header>
      <FilterForm basePath="/admin/operations/properties" filters={filters} property />
      <Degraded degraded={degraded} />
      <section className="space-y-2">
        <h2 className="font-display text-lg font-semibold">Properties</h2>
        <ul className="divide-y divide-[var(--mpa-color-border-subtle)] rounded-md border border-[var(--mpa-color-border-default)] bg-white">
          {properties.map((p) => (
            <li key={p.id} className="px-4 py-3 text-sm">
              <p className="font-medium">{p.name}</p>
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                {p.organizationName ?? p.organizationId} · {p.status} · {p.unitCount} units
              </p>
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="font-display text-lg font-semibold">Units (sample)</h2>
        <ul className="divide-y divide-[var(--mpa-color-border-subtle)] rounded-md border border-[var(--mpa-color-border-default)] bg-white">
          {units.map((u) => (
            <li key={u.id} className="px-4 py-3 text-sm">
              <p className="font-medium">{u.unitLabel}</p>
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                {u.propertyName ?? u.propertyId} · {u.organizationName ?? u.organizationId} ·{" "}
                {u.status}
              </p>
            </li>
          ))}
        </ul>
      </section>
      <Pager basePath="/admin/operations/properties" snapshot={snapshot} />
    </main>
  );
}

export function Ma6VendorsPage({ snapshot }: { snapshot: Ma6OperationsSnapshot }) {
  const { vendors, filters, degraded } = snapshot;
  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold">Vendors</h1>
        <OpsNav />
      </header>
      <FilterForm basePath="/admin/operations/vendors" filters={filters} vendor />
      <Degraded degraded={degraded} />
      <ul className="divide-y divide-[var(--mpa-color-border-subtle)] rounded-md border border-[var(--mpa-color-border-default)] bg-white">
        {vendors.map((v) => (
          <li key={v.id} className="px-4 py-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{v.name}</span>
              <ToneBadge tone={v.health} />
            </div>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              {v.organizationName ?? v.organizationId} · {v.status} · outstanding WOs{" "}
              {v.outstandingWorkOrders}
            </p>
            {(v.email || v.phone) && (
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                {[v.email, v.phone].filter(Boolean).join(" · ")}
              </p>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs text-[var(--mpa-color-text-secondary)]">
        No invented vendor ratings. Status and outstanding work orders only.
      </p>
      <Pager basePath="/admin/operations/vendors" snapshot={snapshot} />
    </main>
  );
}

export function Ma6NotificationsPage({ snapshot }: { snapshot: Ma6OperationsSnapshot }) {
  const { notifications, filters, degraded, limitations, overview } = snapshot;
  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-semibold">Notifications</h1>
        <OpsNav />
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Failed {overview.notificationFailed} · Sent {overview.notificationSent} (sample window)
        </p>
      </header>
      <FilterForm basePath="/admin/operations/notifications" filters={filters} notification />
      <Degraded degraded={degraded} />
      <ul className="divide-y divide-[var(--mpa-color-border-subtle)] rounded-md border border-[var(--mpa-color-border-default)] bg-white">
        {notifications.map((n) => (
          <li key={n.id} className="px-4 py-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{n.title}</span>
              <ToneBadge tone={n.health} />
            </div>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              {n.organizationName ?? n.organizationId} · {n.channel ?? "—"} ·{" "}
              {n.emailDeliveryStatus ?? "unknown"} ·{" "}
              {n.createdAt ? new Date(n.createdAt).toLocaleString() : "—"}
            </p>
            {n.workOrderId ? (
              <Link
                href={`/admin/operations/work-orders/${n.workOrderId}`}
                className="text-xs text-[var(--mpa-color-brand-primary)] underline"
              >
                Work order {n.workOrderId}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
      <ul className="space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
        {limitations.map((l) => (
          <li key={l}>• {l}</li>
        ))}
      </ul>
      <Pager basePath="/admin/operations/notifications" snapshot={snapshot} />
    </main>
  );
}

function FilterForm({
  basePath,
  filters,
  workOrder,
  vendor,
  notification,
  property
}: {
  basePath: string;
  filters: Ma6OperationsSnapshot["filters"];
  workOrder?: boolean;
  vendor?: boolean;
  notification?: boolean;
  property?: boolean;
}) {
  return (
    <form
      method="get"
      className="grid gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 md:grid-cols-3 xl:grid-cols-4"
    >
      <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
        Search
        <input
          name="q"
          defaultValue={filters.q ?? ""}
          className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 text-sm"
        />
      </label>
      <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
        Organization ID
        <input
          name="organizationId"
          defaultValue={filters.organizationId ?? ""}
          className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 font-mono text-sm"
        />
      </label>
      {property ? (
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Property ID
          <input
            name="propertyId"
            defaultValue={filters.propertyId ?? ""}
            className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 font-mono text-sm"
          />
        </label>
      ) : null}
      {workOrder ? (
        <>
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Status
            <select
              name="status"
              defaultValue={filters.status ?? ""}
              className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 text-sm"
            >
              <option value="">All</option>
              {[
                "submitted",
                "triaged",
                "assigned",
                "in_progress",
                "completed",
                "closed",
                "cancelled"
              ].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Priority
            <select
              name="priority"
              defaultValue={filters.priority ?? ""}
              className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 text-sm"
            >
              <option value="">All</option>
              {["low", "normal", "high", "urgent", "critical"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Property ID
            <input
              name="propertyId"
              defaultValue={filters.propertyId ?? ""}
              className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 font-mono text-sm"
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Vendor ID
            <input
              name="vendorId"
              defaultValue={filters.vendorId ?? ""}
              className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 font-mono text-sm"
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Overdue
            <select
              name="overdue"
              defaultValue={filters.overdue ?? ""}
              className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="yes">yes</option>
              <option value="no">no</option>
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Assignment
            <select
              name="assigned"
              defaultValue={filters.assigned ?? ""}
              className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="assigned">assigned</option>
              <option value="unassigned">unassigned</option>
            </select>
          </label>
        </>
      ) : null}
      {vendor ? (
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Status
          <select
            name="status"
            defaultValue={filters.status ?? ""}
            className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </label>
      ) : null}
      {notification ? (
        <>
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Delivery status
            <select
              name="status"
              defaultValue={filters.status ?? ""}
              className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="sent">sent</option>
              <option value="failed">failed</option>
              <option value="queued">queued</option>
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Channel
            <input
              name="channel"
              defaultValue={filters.channel ?? ""}
              className="mt-1 w-full rounded-md border border-[var(--mpa-color-border-default)] px-2 py-2 text-sm"
            />
          </label>
        </>
      ) : null}
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
      <input type="hidden" name="page" value="1" />
      <div className="md:col-span-3 xl:col-span-4 flex gap-3">
        <button
          type="submit"
          className="rounded-md bg-[var(--mpa-color-brand-primary)] px-4 py-2 text-sm font-medium text-white"
        >
          Apply filters
        </button>
        <Link href={basePath} className="text-sm text-[var(--mpa-color-brand-primary)] underline">
          Clear
        </Link>
      </div>
    </form>
  );
}

function Kv({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase text-[var(--mpa-color-text-secondary)]">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
