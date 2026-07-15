"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DashboardSnapshot, DashboardLeaseSummary, DashboardVendorSummary } from "../../lib/dashboard/server";

const REFRESH_INTERVAL_MS = 30000;

type OperationsPermissions = {
  canCreateProperty: boolean;
  canCreateUnit: boolean;
  canCreateTenant: boolean;
  canCreateMaintenance: boolean;
  canReadMaintenance: boolean;
  canCreateVendor: boolean;
  canReadVendors: boolean;
  canCreateLease: boolean;
  canReadLeases: boolean;
};

export function OperationsCenterView({
  initialSnapshot,
  organizationName,
  permissions
}: {
  initialSnapshot: DashboardSnapshot;
  organizationName: string | null;
  permissions: OperationsPermissions;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(() => formatTime(new Date()));
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshSnapshot = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as { snapshot?: DashboardSnapshot };
      if (payload.snapshot) {
        setSnapshot(payload.snapshot);
        setLastRefreshedAt(formatTime(new Date()));
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(refreshSnapshot, REFRESH_INTERVAL_MS);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshSnapshot();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshSnapshot]);

  const visibleTasks = useMemo(
    () =>
      snapshot.operationalTasks.filter((task) => {
        if (task.id === "create-first-property" && !permissions.canCreateProperty) return false;
        if (task.id === "create-first-unit" && !permissions.canCreateUnit) return false;
        if (task.id === "create-first-tenant" && !permissions.canCreateTenant) return false;
        return true;
      }),
    [snapshot.operationalTasks, permissions]
  );

  return (
    <OperationsCenterLayout
      snapshot={snapshot}
      organizationName={organizationName}
      permissions={permissions}
      visibleTasks={visibleTasks}
      lastRefreshedAt={lastRefreshedAt}
      isRefreshing={isRefreshing}
      onRefresh={() => void refreshSnapshot()}
    />
  );
}

function OperationsCenterLayout({
  snapshot,
  organizationName,
  permissions,
  visibleTasks,
  lastRefreshedAt,
  isRefreshing,
  onRefresh
}: {
  snapshot: DashboardSnapshot;
  organizationName: string | null;
  permissions: OperationsPermissions;
  visibleTasks: DashboardSnapshot["operationalTasks"];
  lastRefreshedAt: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  const hasPortfolio = snapshot.propertiesTotal > 0 || snapshot.unitsTotal > 0;
  const occupancyPercent = Math.round(snapshot.occupancyRate * 100);

  return (
    <main className="mpa-page flex-1 space-y-6">
      <header className="mpa-page-header">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--mpa-color-brand-primary)]">
            Operations Center
          </p>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
            Good morning{organizationName ? `, ${organizationName}` : ""}
          </h1>
          <p className="max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
            Your live portfolio command surface — review tasks, occupancy, and recent changes in one place.
          </p>
          <div
            className="flex flex-wrap items-center gap-2 text-xs text-[var(--mpa-color-text-secondary)]"
            aria-live="polite"
          >
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`inline-block h-2 w-2 rounded-full ${isRefreshing ? "animate-pulse bg-[var(--mpa-color-brand-primary)]" : "bg-emerald-500"}`}
                aria-hidden="true"
              />
              Live data
            </span>
            <span aria-hidden="true">•</span>
            <span>Updated {lastRefreshedAt || "just now"}</span>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="rounded-md px-2 py-1 font-medium text-[var(--mpa-color-brand-primary)] hover:bg-[var(--mpa-color-bg-app)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mpa-color-brand-primary)] disabled:opacity-60"
            >
              {isRefreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
        <QuickActionsBar permissions={permissions} />
      </header>

      <section aria-labelledby="portfolio-summary-heading" className="space-y-3">
        <h2 id="portfolio-summary-heading" className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
          Portfolio Summary
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryMetric
            label="Total Properties"
            value={snapshot.propertiesTotal}
            href="/properties"
            hint="View all properties"
          />
          <SummaryMetric label="Total Units" value={snapshot.unitsTotal} href="/units" hint="View all units" />
          <SummaryMetric
            label="Occupied Units"
            value={snapshot.occupiedUnits}
            href="/units"
            hint="Review occupied inventory"
          />
          <SummaryMetric
            label="Vacant Units"
            value={snapshot.vacanciesTotal}
            href="/units"
            hint="Review vacancies"
            tone={snapshot.vacanciesTotal > 0 ? "warning" : "default"}
          />
          <OccupancyCard occupancyPercent={occupancyPercent} occupied={snapshot.occupiedUnits} total={snapshot.unitsTotal} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <TenantOverviewCard snapshot={snapshot} />
        <OperationalTasksCard tasks={visibleTasks} />
      </section>

      {snapshot.maintenance && permissions.canReadMaintenance ? (
        <MaintenanceOperationsCard snapshot={snapshot.maintenance} canCreate={permissions.canCreateMaintenance} />
      ) : null}

      {snapshot.vendors && permissions.canReadVendors ? (
        <VendorOperationsCard snapshot={snapshot.vendors} canCreate={permissions.canCreateVendor} />
      ) : null}

      {snapshot.leases && permissions.canReadLeases ? (
        <LeaseOperationsCard snapshot={snapshot.leases} canCreate={permissions.canCreateLease} />
      ) : null}

      {!hasPortfolio ? <PortfolioEmptyState permissions={permissions} /> : null}

      <ActivityTimelineCard activity={snapshot.recentActivity} hasPortfolio={hasPortfolio} />
    </main>
  );
}

function QuickActionsBar({ permissions }: { permissions: OperationsPermissions }) {
  const actions = [
    { label: "Create Property", href: "/properties/new", show: permissions.canCreateProperty, variant: "primary" as const },
    { label: "Create Unit", href: "/units/new", show: permissions.canCreateUnit, variant: "secondary" as const },
    { label: "Create Tenant", href: "/tenants/new", show: permissions.canCreateTenant, variant: "secondary" as const },
    {
      label: "Create Work Order",
      href: "/maintenance/new",
      show: permissions.canCreateMaintenance,
      variant: "secondary" as const
    },
    {
      label: "Create Vendor",
      href: "/vendors/new",
      show: permissions.canCreateVendor,
      variant: "secondary" as const
    },
    {
      label: "Create Lease",
      href: "/leases/new",
      show: permissions.canCreateLease,
      variant: "secondary" as const
    },
    { label: "Search", href: "#search", show: true, variant: "ghost" as const, isSearch: true }
  ].filter((action) => action.show);

  return (
    <nav aria-label="Quick actions" className="flex flex-wrap gap-2">
      {actions.map((action) =>
        action.isSearch ? (
          <button
            key={action.label}
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("mpa:open-command-center"))}
            className="inline-flex items-center rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm font-medium text-[var(--mpa-color-text-primary)] transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mpa-color-brand-primary)]"
          >
            Search
            <kbd className="ml-2 hidden rounded border border-[var(--mpa-color-border-default)] px-1 text-[10px] sm:inline">
              ⌘K
            </kbd>
          </button>
        ) : (
          <Link
            key={action.label}
            href={action.href}
            className={[
              "inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mpa-color-brand-primary)]",
              action.variant === "primary"
                ? "bg-[var(--mpa-color-brand-primary)] text-white hover:opacity-90"
                : action.variant === "secondary"
                  ? "border border-[var(--mpa-color-border-default)] bg-white text-[var(--mpa-color-text-primary)] hover:bg-gray-50"
                  : "text-[var(--mpa-color-text-secondary)] hover:bg-gray-50"
            ].join(" ")}
          >
            {action.label}
          </Link>
        )
      )}
    </nav>
  );
}

function SummaryMetric({
  label,
  value,
  href,
  hint,
  tone = "default"
}: {
  label: string;
  value: number;
  href: string;
  hint: string;
  tone?: "default" | "warning";
}) {
  return (
    <Link
      href={href}
      aria-label={`${label}: ${value}. ${hint}`}
      className="group rounded-xl border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4 shadow-sm transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mpa-color-brand-primary)]"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">{label}</p>
      <p
        className={[
          "mt-2 text-3xl font-semibold tabular-nums",
          tone === "warning" ? "text-amber-700" : "text-[var(--mpa-color-text-primary)]"
        ].join(" ")}
      >
        {value}
      </p>
      <p className="mt-2 text-xs text-[var(--mpa-color-brand-primary)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        {hint} →
      </p>
    </Link>
  );
}

function OccupancyCard({
  occupancyPercent,
  occupied,
  total
}: {
  occupancyPercent: number;
  occupied: number;
  total: number;
}) {
  return (
    <div className="rounded-xl border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4 shadow-sm sm:col-span-2 xl:col-span-1">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
        Occupancy Rate
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-[var(--mpa-color-text-primary)]">
        {occupancyPercent}%
      </p>
      <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
        {occupied} of {total} units occupied
      </p>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100"
        role="img"
        aria-label={`Occupancy ${occupancyPercent} percent`}
      >
        <div
          className="h-full rounded-full bg-[var(--mpa-color-brand-primary)] transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, occupancyPercent))}%` }}
        />
      </div>
    </div>
  );
}

function TenantOverviewCard({ snapshot }: { snapshot: DashboardSnapshot }) {
  const items = [
    { label: "Active tenants", value: snapshot.activeTenants, href: "/tenants", action: "View tenants" },
    { label: "Active leases", value: snapshot.leases?.activeLeases ?? 0, href: "/leases", action: "View leases" },
    {
      label: "Expiring leases (60d)",
      value: snapshot.expiringLeasesTotal,
      href: "/leases",
      action: "Review expirations",
      highlight: snapshot.expiringLeasesTotal > 0
    },
    {
      label: "Renewal needed",
      value: snapshot.renewalNeededTotal,
      href: "/leases",
      action: "Review renewals",
      highlight: snapshot.renewalNeededTotal > 0
    },
    { label: "Recent move-ins (30d)", value: snapshot.recentMoveIns, href: "/tenants", action: "Review move-ins" },
    {
      label: "Vacant-ready units",
      value: snapshot.vacanciesTotal,
      href: "/units",
      action: "Fill vacancies",
      highlight: snapshot.vacanciesTotal > 0
    }
  ];

  return (
    <article className="rounded-xl border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5 shadow-sm xl:col-span-1">
      <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Tenant Overview</h2>
      <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
        Occupancy health and move-in momentum across your portfolio.
      </p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="flex items-center justify-between rounded-lg border border-[var(--mpa-color-border-default)] px-3 py-2.5 transition-colors hover:bg-[var(--mpa-color-bg-app)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mpa-color-brand-primary)]"
            >
              <div>
                <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{item.label}</p>
                <p className="text-xs text-[var(--mpa-color-brand-primary)]">{item.action}</p>
              </div>
              <span
                className={[
                  "text-xl font-semibold tabular-nums",
                  item.highlight ? "text-amber-700" : "text-[var(--mpa-color-text-primary)]"
                ].join(" ")}
              >
                {item.value}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}

function OperationalTasksCard({ tasks }: { tasks: DashboardSnapshot["operationalTasks"] }) {
  return (
    <article className="rounded-xl border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5 shadow-sm xl:col-span-2">
      <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Operational Tasks</h2>
      <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
        Actionable next steps generated from your current portfolio state.
      </p>
      {tasks.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--mpa-color-text-secondary)]">No actionable tasks for your current role.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {tasks.map((task) => (
            <li key={task.id}>
              <Link
                href={task.href}
                className="block rounded-lg border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-app)]/40 p-3 transition-colors hover:border-[var(--mpa-color-brand-primary)]/30 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mpa-color-brand-primary)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{task.title}</p>
                  <TaskPriorityBadge priority={task.priority} />
                </div>
                <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">{task.description}</p>
                <span className="mt-2 inline-block text-xs font-semibold text-[var(--mpa-color-brand-primary)]">
                  {task.actionLabel} →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function TaskPriorityBadge({ priority }: { priority: DashboardSnapshot["operationalTasks"][number]["priority"] }) {
  const styles =
    priority === "high"
      ? "bg-red-50 text-red-700"
      : priority === "medium"
        ? "bg-amber-50 text-amber-800"
        : "bg-sky-50 text-sky-800";

  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles}`}>
      {priority}
    </span>
  );
}

function PortfolioEmptyState({ permissions }: { permissions: OperationsPermissions }) {
  return (
    <section className="rounded-xl border border-dashed border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-6">
      <h2 className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">Start your portfolio foundation</h2>
      <p className="mt-1 max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
        Add properties and units to unlock occupancy intelligence, tenant overview, and operational task generation.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {permissions.canCreateProperty ? (
          <Link
            href="/properties/new"
            className="inline-flex rounded-md bg-[var(--mpa-color-brand-primary)] px-3 py-2 text-sm font-medium text-white"
          >
            Create Property
          </Link>
        ) : null}
        {permissions.canCreateUnit ? (
          <Link
            href="/units/new"
            className="inline-flex rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2 text-sm font-medium"
          >
            Create Unit
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function ActivityTimelineCard({
  activity,
  hasPortfolio
}: {
  activity: DashboardSnapshot["recentActivity"];
  hasPortfolio: boolean;
}) {
  return (
    <article className="rounded-xl border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Recent Activity</h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Merged timeline across properties, units, tenants, and maintenance.
          </p>
        </div>
        <Link href="/properties" className="text-xs font-semibold text-[var(--mpa-color-brand-primary)] hover:underline">
          View portfolio
        </Link>
      </div>
      {!hasPortfolio || activity.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-[var(--mpa-color-border-default)] p-6 text-center">
          <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Activity will appear here</p>
          <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
            Create or update properties, units, and tenants to populate your live timeline.
          </p>
        </div>
      ) : (
        <ol className="relative mt-6 space-y-0 border-l border-[var(--mpa-color-border-default)] pl-4">
          {activity.map((item, index) => (
            <li key={item.id} className={`relative pb-5 ${index === activity.length - 1 ? "pb-0" : ""}`}>
              <span
                className="absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[var(--mpa-color-brand-primary)]"
                aria-hidden="true"
              />
              <Link
                href={item.href}
                className="block rounded-lg px-2 py-1 transition-colors hover:bg-[var(--mpa-color-bg-app)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mpa-color-brand-primary)]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <ActivityTypeBadge type={item.type} />
                  <span className="text-xs text-[var(--mpa-color-text-secondary)]">
                    {item.action === "created"
                      ? "Created"
                      : item.action === "updated"
                        ? "Updated"
                        : "Event"} · {formatRelativeTime(item.timestamp)}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-[var(--mpa-color-text-primary)]">{item.title}</p>
                {item.subtitle ? (
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">{item.subtitle}</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

function ActivityTypeBadge({ type }: { type: DashboardActivity["type"] }) {
  const label =
    type === "property" ? "Property" : type === "unit" ? "Unit" : type === "tenant" ? "Tenant" : "Maintenance";
  return (
    <span className="rounded-full bg-[var(--mpa-color-bg-app)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
      {label}
    </span>
  );
}

function MaintenanceOperationsCard({
  snapshot,
  canCreate
}: {
  snapshot: NonNullable<DashboardSnapshot["maintenance"]>;
  canCreate: boolean;
}) {
  const metrics = [
    { label: "Open work orders", value: snapshot.openWorkOrders, href: "/maintenance", tone: "default" as const },
    {
      label: "High priority",
      value: snapshot.highPriorityWorkOrders,
      href: "/maintenance",
      tone: snapshot.highPriorityWorkOrders > 0 ? ("warning" as const) : ("default" as const)
    },
    {
      label: "Overdue",
      value: snapshot.overdueWorkOrders,
      href: "/maintenance",
      tone: snapshot.overdueWorkOrders > 0 ? ("danger" as const) : ("default" as const)
    },
    { label: "Completed (7d)", value: snapshot.recentlyCompleted, href: "/maintenance", tone: "default" as const }
  ];

  return (
    <section aria-labelledby="maintenance-ops-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="maintenance-ops-heading" className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
            Maintenance Operations
          </h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Open, priority, overdue, and recently completed work orders.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/maintenance" className="text-xs font-semibold text-[var(--mpa-color-brand-primary)] hover:underline">
            View all
          </Link>
          {canCreate ? (
            <Link href="/maintenance/new" className="text-xs font-semibold text-[var(--mpa-color-brand-primary)] hover:underline">
              Create work order
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.href}
            className="rounded-xl border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">{metric.label}</p>
            <p
              className={[
                "mt-2 text-3xl font-semibold tabular-nums",
                metric.tone === "danger"
                  ? "text-red-700"
                  : metric.tone === "warning"
                    ? "text-amber-700"
                    : "text-[var(--mpa-color-text-primary)]"
              ].join(" ")}
            >
              {metric.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <MaintenanceListCard
          title="Open work orders"
          items={snapshot.openWorkOrderSample.map((item) => ({
            id: item.id,
            workOrderNumber: item.workOrderNumber,
            title: item.title,
            href: item.href,
            meta: item.propertyName
          }))}
          emptyLabel="No open work orders"
        />
        <MaintenanceListCard
          title="Recently completed"
          items={snapshot.completedSample.map((item) => ({
            id: item.id,
            workOrderNumber: item.workOrderNumber,
            title: item.title,
            href: item.href,
            meta: item.completedAt ? `Completed ${formatRelativeTime(item.completedAt)}` : null
          }))}
          emptyLabel="No recent completions"
        />
      </div>
    </section>
  );
}

function MaintenanceListCard({
  title,
  items,
  emptyLabel
}: {
  title: string;
  items: Array<{ id: string; workOrderNumber: string; title: string; href: string; meta?: string | null }>;
  emptyLabel: string;
}) {
  return (
    <article className="rounded-xl border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5 shadow-sm">
      <h3 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="block rounded-lg border border-[var(--mpa-color-border-default)] px-3 py-2.5 transition-colors hover:bg-[var(--mpa-color-bg-app)]"
              >
                <p className="text-xs font-semibold text-[var(--mpa-color-brand-primary)]">{item.workOrderNumber}</p>
                <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{item.title}</p>
                {item.meta ? <p className="text-xs text-[var(--mpa-color-text-secondary)]">{item.meta}</p> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

type DashboardActivity = DashboardSnapshot["recentActivity"][number];

function VendorOperationsCard({
  snapshot,
  canCreate
}: {
  snapshot: NonNullable<DashboardVendorSummary>;
  canCreate: boolean;
}) {
  const metrics = [
    { label: "Open assignments", value: snapshot.openAssignments, href: "/vendors", tone: "default" as const },
    {
      label: "Awaiting response",
      value: snapshot.awaitingResponse,
      href: "/vendors",
      tone: snapshot.awaitingResponse > 0 ? ("warning" as const) : ("default" as const)
    },
    {
      label: "In progress",
      value: snapshot.inProgress,
      href: "/vendors",
      tone: snapshot.inProgress > 0 ? ("info" as const) : ("default" as const)
    },
    { label: "Completed today", value: snapshot.completedToday, href: "/vendors", tone: "default" as const }
  ];

  return (
    <section aria-labelledby="vendor-ops-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="vendor-ops-heading" className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
            Vendor Operations
          </h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Assignment status, response tracking, and performance at a glance.
            {snapshot.averageRating !== null ? ` Avg rating ${snapshot.averageRating.toFixed(1)}.` : ""}
            {snapshot.preferredVendorCount > 0 ? ` ${snapshot.preferredVendorCount} preferred.` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/vendors" className="text-xs font-semibold text-[var(--mpa-color-brand-primary)] hover:underline">
            View vendors
          </Link>
          {canCreate ? (
            <Link href="/vendors/new" className="text-xs font-semibold text-[var(--mpa-color-brand-primary)] hover:underline">
              Add vendor
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.href}
            className="rounded-xl border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">{metric.label}</p>
            <p
              className={[
                "mt-2 text-3xl font-semibold tabular-nums",
                metric.tone === "warning"
                  ? "text-amber-700"
                  : metric.tone === "info"
                    ? "text-sky-700"
                    : "text-[var(--mpa-color-text-primary)]"
              ].join(" ")}
            >
              {metric.value}
            </p>
          </Link>
        ))}
      </div>

      {snapshot.assignmentSamples.length > 0 ? (
        <article className="rounded-xl border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5 shadow-sm">
          <h3 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Open vendor assignments</h3>
          <ul className="mt-3 space-y-2">
            {snapshot.assignmentSamples.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="block rounded-lg border border-[var(--mpa-color-border-default)] px-3 py-2.5 transition-colors hover:bg-[var(--mpa-color-bg-app)]"
                >
                  <p className="text-xs font-semibold text-[var(--mpa-color-brand-primary)]">
                    {item.workOrderNumber} · {item.vendorBusinessName}
                  </p>
                  <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{item.workOrderTitle}</p>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                    {item.assignmentStatus.replaceAll("_", " ")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </section>
  );
}

function LeaseOperationsCard({
  snapshot,
  canCreate
}: {
  snapshot: NonNullable<DashboardLeaseSummary>;
  canCreate: boolean;
}) {
  const metrics = [
    { label: "Active leases", value: snapshot.activeLeases, href: "/leases", tone: "default" as const },
    {
      label: "Upcoming expirations",
      value: snapshot.upcomingExpirations,
      href: "/leases",
      tone: snapshot.upcomingExpirations > 0 ? ("warning" as const) : ("default" as const)
    },
    {
      label: "Upcoming renewals",
      value: snapshot.upcomingRenewals,
      href: "/leases",
      tone: snapshot.upcomingRenewals > 0 ? ("info" as const) : ("default" as const)
    },
    { label: "Move-ins", value: snapshot.upcomingMoveIns, href: "/leases", tone: "default" as const },
    { label: "Move-outs", value: snapshot.upcomingMoveOuts, href: "/leases", tone: "default" as const },
    { label: "Expired", value: snapshot.expiredLeases, href: "/leases", tone: "default" as const }
  ];

  return (
    <section aria-labelledby="lease-ops-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="lease-ops-heading" className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
            Lease Operations
          </h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Active leases, renewals, expirations, and move activity across your portfolio.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/leases" className="text-xs font-semibold text-[var(--mpa-color-brand-primary)] hover:underline">
            View leases
          </Link>
          {canCreate ? (
            <Link href="/leases/new" className="text-xs font-semibold text-[var(--mpa-color-brand-primary)] hover:underline">
              Create lease
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.href}
            className="rounded-xl border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">{metric.label}</p>
            <p
              className={[
                "mt-2 text-3xl font-semibold tabular-nums",
                metric.tone === "warning"
                  ? "text-amber-700"
                  : metric.tone === "info"
                    ? "text-sky-700"
                    : "text-[var(--mpa-color-text-primary)]"
              ].join(" ")}
            >
              {metric.value}
            </p>
          </Link>
        ))}
      </div>

      {snapshot.expirationSample.length > 0 ? (
        <article className="rounded-xl border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5 shadow-sm">
          <h3 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Upcoming expirations</h3>
          <ul className="mt-3 space-y-2">
            {snapshot.expirationSample.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="block rounded-lg border border-[var(--mpa-color-border-default)] px-3 py-2.5 transition-colors hover:bg-[var(--mpa-color-bg-app)]"
                >
                  <p className="text-xs font-semibold text-[var(--mpa-color-brand-primary)]">
                    {item.leaseNumber}
                    {item.tenantName ? ` · ${item.tenantName}` : ""}
                  </p>
                  <p className="text-sm text-[var(--mpa-color-text-primary)]">{item.propertyName ?? "Property"}</p>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">Ends {item.endDate}</p>
                </Link>
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </section>
  );
}

function formatTime(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  }).format(value);
}

function formatRelativeTime(value: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return "recently";
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(timestamp);
}

// Re-export for shell
export type { OperationsPermissions };
