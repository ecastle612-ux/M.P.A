"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DashboardSnapshot, DashboardLeaseSummary, DashboardVendorSummary, DashboardFinancialSummary, DashboardApplicantSummary } from "../../lib/dashboard/server";
import type { MigrationDashboardMetrics } from "../../lib/migration/server";
import type { CommunicationDashboardMetrics } from "../../lib/communication/server";
import { formatCurrency } from "../../lib/financial/contracts";
import { formatRefreshTime } from "../../lib/format/time";
import { getSnoozedTaskIds, snoozeOpsTask } from "../../lib/command-center/storage";
import { AiPageContextBridge, buildAiPageContext } from "../ai/ai-page-context";
import { DiscloseSection } from "../presentation/disclose-section";
import { PortfolioSetupHealth } from "../setup/portfolio-setup-health";
import { NotificationOperationsWidget } from "./notification-operations-widget";
import { ScreeningOperationsWidget } from "./screening-operations-widget";
import { SignatureOperationsWidget } from "./signature-operations-widget";
import { BillingOperationsWidget } from "./billing-operations-widget";
import { ResidentLifecycleWidget } from "../resident-lifecycle/resident-lifecycle-widget";
import { Button, KpiMetric } from "@mpa/ui";

const REFRESH_INTERVAL_MS = 30000;
const OPS_PANEL =
  "rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] shadow-[var(--mpa-shadow-xs)]";
const OPS_PANEL_PAD_SM = `${OPS_PANEL} p-4`;

type OperationsPermissions = {
  canCreateProperty: boolean;
  canCreateUnit: boolean;
  canCreateTenant: boolean;
  canCreateApplicant: boolean;
  canReadApplicants: boolean;
  canReadScreening: boolean;
  canReadSignatures: boolean;
  canCreateMaintenance: boolean;
  canReadMaintenance: boolean;
  canCreateVendor: boolean;
  canReadVendors: boolean;
  canCreateLease: boolean;
  canReadLeases: boolean;
  canCreateCommunication: boolean;
  canReadCommunications: boolean;
  canCreateFinancial: boolean;
  canReadFinancials: boolean;
  canReadAi: boolean;
  canUseAi: boolean;
  canReadMigration: boolean;
  canCreateMigration: boolean;
};

export function OperationsCenterView({
  initialSnapshot,
  organizationName,
  userGreetingName,
  timeGreeting,
  permissions,
  initialRefreshedAt
}: {
  initialSnapshot: DashboardSnapshot;
  organizationName: string | null;
  userGreetingName: string | null;
  timeGreeting: string;
  permissions: OperationsPermissions;
  initialRefreshedAt: string;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(initialRefreshedAt);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshSnapshot = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as { snapshot?: DashboardSnapshot };
      if (payload.snapshot) {
        setSnapshot(payload.snapshot);
        setLastRefreshedAt(formatRefreshTime(new Date()));
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

  const [snoozedTaskIds, setSnoozedTaskIds] = useState<string[]>(() => [...getSnoozedTaskIds()]);

  const visibleTasks = useMemo(() => {
    const snoozed = new Set(snoozedTaskIds);
    return snapshot.operationalTasks.filter((task) => {
      if (snoozed.has(task.id)) return false;
      if (task.id === "create-first-property" && !permissions.canCreateProperty) return false;
      if (task.id === "create-first-unit" && !permissions.canCreateUnit) return false;
      if (task.id === "create-first-tenant" && !permissions.canCreateTenant) return false;
      return true;
    });
  }, [snapshot.operationalTasks, permissions, snoozedTaskIds]);

  const handleSnoozeTask = useCallback((taskId: string) => {
    snoozeOpsTask(taskId, 4);
    setSnoozedTaskIds([...getSnoozedTaskIds()]);
  }, []);

  return (
    <OperationsCenterLayout
      snapshot={snapshot}
      organizationName={organizationName}
      userGreetingName={userGreetingName}
      timeGreeting={timeGreeting}
      permissions={permissions}
      visibleTasks={visibleTasks}
      lastRefreshedAt={lastRefreshedAt}
      isRefreshing={isRefreshing}
      onRefresh={() => void refreshSnapshot()}
      onSnoozeTask={handleSnoozeTask}
    />
  );
}

function OperationsCenterLayout({
  snapshot,
  organizationName,
  userGreetingName,
  timeGreeting,
  permissions,
  visibleTasks,
  lastRefreshedAt,
  isRefreshing,
  onRefresh,
  onSnoozeTask
}: {
  snapshot: DashboardSnapshot;
  organizationName: string | null;
  userGreetingName: string | null;
  timeGreeting: string;
  permissions: OperationsPermissions;
  visibleTasks: DashboardSnapshot["operationalTasks"];
  lastRefreshedAt: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  onSnoozeTask: (taskId: string) => void;
}) {
  const hasPortfolio = snapshot.propertiesTotal > 0 || snapshot.unitsTotal > 0;
  const occupancyPercent = Math.round(snapshot.occupancyRate * 100);

  const urgentCount = visibleTasks.filter((task) => task.priority === "high").length;
  const overdueCount = snapshot.maintenance?.overdueWorkOrders ?? 0;
  const approvalCount =
    (snapshot.leases?.renewalNeeded ?? 0) +
    (snapshot.vendors?.awaitingResponse ?? 0) +
    (snapshot.financial?.ownerStatementsDraft ?? 0);
  const changedTodayCount = snapshot.recentActivity.length;
  const attentionLine =
    urgentCount > 0
      ? `${urgentCount} urgent item${urgentCount === 1 ? "" : "s"} need action today.`
      : visibleTasks.length > 0
        ? `${visibleTasks.length} item${visibleTasks.length === 1 ? "" : "s"} on your plate — start with the top task.`
        : "Nothing urgent — glance metrics below if you need portfolio context.";

  return (
    <main className="mpa-page-wide flex-1 space-y-4">
      <AiPageContextBridge {...buildAiPageContext({ entityType: "dashboard" })} />
      <PortfolioSetupHealth />
      <header className="mpa-page-header !items-start gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="mpa-section-label text-[var(--mpa-color-brand-primary)]">Operations Center</p>
          <h1 className="font-display text-xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)] md:text-2xl">
            {userGreetingName ? `${timeGreeting}, ${userGreetingName}.` : `${timeGreeting}.`}
            {organizationName ? (
              <span className="mt-0.5 block text-sm font-medium text-[var(--mpa-color-text-secondary)] md:mt-0 md:ml-2 md:inline">
                {organizationName}
              </span>
            ) : null}
          </h1>
          <p className="max-w-2xl text-sm font-medium text-[var(--mpa-color-text-primary)]">{attentionLine}</p>
          <div
            className="flex flex-wrap items-center gap-2 text-xs text-[var(--mpa-color-text-muted)]"
            aria-live="polite"
          >
            <span>Updated {lastRefreshedAt || "just now"}</span>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="rounded-[var(--mpa-radius-md)] px-2 py-1 font-medium text-[var(--mpa-color-text-link)] transition-colors hover:bg-[var(--mpa-color-interactive-row-hover)] disabled:opacity-60"
            >
              {isRefreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
        <QuickActionsBar permissions={permissions} />
      </header>

      <section aria-label="Command glance" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <GlanceMetric
          label="Needs attention"
          value={visibleTasks.length}
          href="#attention-today-heading"
          tone={urgentCount > 0 ? "warning" : "default"}
        />
        <GlanceMetric
          label="Overdue"
          value={overdueCount}
          href="/maintenance?status=open"
          tone={overdueCount > 0 ? "warning" : "default"}
        />
        <GlanceMetric
          label="Needs approval"
          value={approvalCount}
          href="/leases"
          tone={approvalCount > 0 ? "warning" : "default"}
        />
        <GlanceMetric
          label="Changed today"
          value={changedTodayCount}
          href="#changed-today"
          tone="default"
        />
      </section>

      <section aria-labelledby="attention-today-heading" className="space-y-3">
        <h2 id="attention-today-heading" className="mpa-section-title">
          Needs attention today
        </h2>
        <div className="grid gap-3 xl:grid-cols-3">
          <OperationalTasksCard tasks={visibleTasks} onSnooze={onSnoozeTask} />
          <div className="xl:col-span-2 space-y-3">
            {permissions.canCreateTenant || permissions.canReadLeases ? <ResidentLifecycleWidget /> : null}
            {permissions.canReadCommunications ? <NotificationOperationsWidget /> : null}
          </div>
        </div>
      </section>

      {snapshot.maintenance && permissions.canReadMaintenance ? (
        <MaintenanceOperationsCard snapshot={snapshot.maintenance} canCreate={permissions.canCreateMaintenance} />
      ) : null}

      <DiscloseSection
        id="changed-today"
        title="What changed & portfolio"
        description="Recent activity, communications, and portfolio counts — expand when you need depth."
        defaultOpen={false}
      >
        <div className="space-y-3">
          <ActivityTimelineCard activity={snapshot.recentActivity} hasPortfolio={hasPortfolio} />
          {snapshot.communications && permissions.canReadCommunications ? (
            <CommunicationOperationsCard
              snapshot={snapshot.communications}
              canCreate={permissions.canCreateCommunication}
            />
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <KpiMetric
              label="Total Properties"
              value={snapshot.propertiesTotal}
              href="/properties"
              hint="View all properties"
            />
            <KpiMetric label="Total Units" value={snapshot.unitsTotal} href="/units" hint="View all units" />
            <KpiMetric
              label="Occupied Units"
              value={snapshot.occupiedUnits}
              href="/units"
              hint="Review occupied inventory"
              tone="success"
            />
            <KpiMetric
              label="Vacant Units"
              value={snapshot.vacanciesTotal}
              href="/units"
              hint="Review vacancies"
              tone={snapshot.vacanciesTotal > 0 ? "warning" : "default"}
            />
            <OccupancyCard
              occupancyPercent={occupancyPercent}
              occupied={snapshot.occupiedUnits}
              total={snapshot.unitsTotal}
            />
          </div>
          <TenantOverviewCard snapshot={snapshot} />
        </div>
      </DiscloseSection>

      <DiscloseSection
        title="More operations & analytics"
        description="Signatures, billing, leases, vendors, applicants, screening, migration, and deeper financials."
        defaultOpen={false}
      >
        <div className="space-y-3">
          {snapshot.migration && permissions.canReadMigration ? (
            <MigrationOperationsCard snapshot={snapshot.migration} canCreate={permissions.canCreateMigration} />
          ) : null}
          <div className="grid gap-3 xl:grid-cols-2">
            {permissions.canReadSignatures ? <SignatureOperationsWidget /> : null}
            {permissions.canReadFinancials ? <BillingOperationsWidget /> : null}
          </div>
          {snapshot.leases && permissions.canReadLeases ? (
            <LeaseOperationsCard snapshot={snapshot.leases} canCreate={permissions.canCreateLease} />
          ) : null}
          {snapshot.vendors && permissions.canReadVendors ? (
            <VendorOperationsCard snapshot={snapshot.vendors} canCreate={permissions.canCreateVendor} />
          ) : null}
          {snapshot.applicants && permissions.canReadApplicants ? (
            <ApplicantOperationsCard snapshot={snapshot.applicants} canCreate={permissions.canCreateApplicant} />
          ) : null}
          {permissions.canReadScreening ? <ScreeningOperationsWidget /> : null}
          {snapshot.financial && permissions.canReadFinancials ? (
            <FinancialOperationsCard snapshot={snapshot.financial} canCreate={permissions.canCreateFinancial} />
          ) : null}
        </div>
      </DiscloseSection>

      {!hasPortfolio ? <PortfolioEmptyState permissions={permissions} /> : null}
    </main>
  );
}

function GlanceMetric({
  label,
  value,
  href,
  tone = "default"
}: {
  label: string;
  value: number;
  href: string;
  tone?: "default" | "warning";
}) {
  return (
    <Link
      href={href}
      className={`${OPS_PANEL_PAD_SM} block transition-colors hover:border-[var(--mpa-color-brand-primary)]/30`}
    >
      <p className="mpa-section-label">{label}</p>
      <p
        className={[
          "mt-1 font-display text-2xl font-semibold tabular-nums tracking-tight",
          tone === "warning" && value > 0
            ? "text-[var(--mpa-color-status-warning)]"
            : "text-[var(--mpa-color-text-primary)]"
        ].join(" ")}
      >
        {value}
      </p>
    </Link>
  );
}

function QuickActionsBar({ permissions }: { permissions: OperationsPermissions }) {
  const actions = [
    { label: "Move In", href: "/residents/move-in", show: permissions.canCreateTenant, variant: "primary" as const },
    {
      label: "Work Order",
      href: "/maintenance/new",
      show: permissions.canCreateMaintenance,
      variant: "secondary" as const
    },
    {
      label: "Record Payment",
      href: "/financials/payments/new",
      show: permissions.canCreateFinancial,
      variant: "secondary" as const
    },
    { label: "Message", href: "/communications/inbox", show: permissions.canReadCommunications, variant: "secondary" as const }
  ].filter((action) => action.show);

  return (
    <nav aria-label="Quick actions" className="flex w-full flex-wrap justify-start gap-2.5 lg:w-auto lg:justify-end">
      {actions.map((action) =>
        action.variant === "primary" ? (
          <Link key={action.label} href={action.href}>
            <Button size="sm">{action.label}</Button>
          </Link>
        ) : (
          <Link key={action.label} href={action.href}>
            <Button size="sm" variant="secondary">
              {action.label}
            </Button>
          </Link>
        )
      )}
    </nav>
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
    <div className={`${OPS_PANEL_PAD_SM} sm:col-span-2 xl:col-span-1`}>
      <p className="mpa-section-label">Occupancy rate</p>
      <p className="mt-2 font-display text-2xl font-semibold tabular-nums tracking-tight text-[var(--mpa-color-text-primary)]">
        {occupancyPercent}%
      </p>
      <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
        {occupied} of {total} units occupied
      </p>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--mpa-color-bg-surface-muted)]"
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
      href: "/residents/move-in",
      action: "Start move-in",
      highlight: snapshot.vacanciesTotal > 0
    }
  ];

  return (
    <article className="rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] shadow-[var(--mpa-shadow-xs)] p-4 xl:col-span-1">
      <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Tenant Overview</h2>
      <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
        Occupancy health and move-in momentum across your portfolio.
      </p>
      <ul className="mt-3 space-y-3">
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

function OperationalTasksCard({
  tasks,
  onSnooze
}: {
  tasks: DashboardSnapshot["operationalTasks"];
  onSnooze: (taskId: string) => void;
}) {
  return (
    <article
      id="todays-work"
      className="rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] shadow-[var(--mpa-shadow-xs)] p-4 xl:col-span-2 scroll-mt-24"
    >
      <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Today&apos;s Work</h2>
      <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
        What should you do next? Resolve jumps to the action — never a dead-end list.
      </p>
      {tasks.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">No actionable tasks for your current role.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {tasks.map((task) => {
            const detailsHref = detailsHrefForTask(task);
            const canSnooze = task.id !== "operations-healthy";
            return (
              <li
                key={task.id}
                className="rounded-lg border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-app)]/40 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{task.title}</p>
                      <TaskPriorityBadge priority={task.priority} />
                    </div>
                    <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">{task.description}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={task.href}>
                    <Button size="sm">{task.actionLabel.startsWith("Resolve") ? task.actionLabel : `Resolve · ${task.actionLabel}`}</Button>
                  </Link>
                  {canSnooze ? (
                    <Button size="sm" variant="secondary" type="button" onClick={() => onSnooze(task.id)}>
                      Snooze
                    </Button>
                  ) : null}
                  <Link href={detailsHref}>
                    <Button size="sm" variant="ghost">
                      View Details
                    </Button>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}

function detailsHrefForTask(task: DashboardSnapshot["operationalTasks"][number]): string {
  if (task.href.includes("/maintenance/")) return task.href.split("#")[0] ?? task.href;
  if (task.href.startsWith("/residents/move-in")) {
    try {
      const params = new URL(task.href, "http://local.invalid").searchParams;
      const unitId = params.get("unitId");
      const propertyId = params.get("propertyId");
      if (unitId) return `/units/${unitId}`;
      if (propertyId) return `/units?propertyId=${encodeURIComponent(propertyId)}`;
    } catch {
      /* fall through */
    }
    return "/units";
  }
  if (task.href.startsWith("/financials/payments")) return "/financials/charges";
  if (task.href.startsWith("/leases")) return task.href.includes("?") ? "/leases" : task.href;
  if (task.href.startsWith("/applicants")) return "/applicants";
  if (task.href.startsWith("/units")) return "/units";
  if (task.href.startsWith("/properties")) return "/properties";
  if (task.href.startsWith("/tenants")) return "/tenants";
  return task.href;
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
      <h2 className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">Build your portfolio foundation</h2>
      <p className="mt-1 max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
        Properties are the starting point for everything in M.P.A. — units, tenants, leases, maintenance, and
        financials all connect from here. Create your first property to unlock occupancy intelligence and operational
        tasks.
      </p>
      <ul className="mt-3 max-w-2xl space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
        <li>· Apartment buildings, HOAs, and commercial properties</li>
        <li>· Add units, assign tenants, and activate leases</li>
        <li>· Track maintenance, vendors, and financial activity</li>
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
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
    <article className="rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] shadow-[var(--mpa-shadow-xs)] p-4">
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
        <div className="mt-3 rounded-lg border border-dashed border-[var(--mpa-color-border-default)] p-6 text-center">
          <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Your activity timeline starts here</p>
          <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
            Create a property, add units, or log maintenance — updates appear in this feed as your portfolio grows.
          </p>
        </div>
      ) : (
        <ol className="relative mt-4 space-y-0 border-l border-[var(--mpa-color-border-default)] pl-4">
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
  const waitingVendor = snapshot.openWorkOrderSample.filter((item) => item.status === "assigned");
  const waitingResident = snapshot.completedSample.slice(0, 5);
  const overdueItems = snapshot.overdueSample.slice(0, 5);
  const emergencyItems = snapshot.highPrioritySample.filter((item) => item.priority === "emergency" || item.priority === "high");

  const metrics = [
    {
      label: "Waiting for vendor",
      value: waitingVendor.length,
      href: "/maintenance?status=waiting_vendor",
      tone: waitingVendor.length > 0 ? ("warning" as const) : ("default" as const)
    },
    {
      label: "Waiting for resident",
      value: waitingResident.length,
      href: "/maintenance?status=waiting_resident",
      tone: waitingResident.length > 0 ? ("warning" as const) : ("default" as const)
    },
    {
      label: "Overdue work",
      value: snapshot.overdueWorkOrders,
      href: "/maintenance?status=open",
      tone: snapshot.overdueWorkOrders > 0 ? ("danger" as const) : ("default" as const)
    },
    {
      label: "Emergency / high",
      value: snapshot.highPriorityWorkOrders,
      href: "/maintenance?priority=emergency_high",
      tone: snapshot.highPriorityWorkOrders > 0 ? ("danger" as const) : ("default" as const)
    }
  ];

  return (
    <section aria-labelledby="maintenance-ops-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="maintenance-ops-heading" className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
            Today&apos;s Work · Maintenance
          </h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Waiting vendor, waiting resident, overdue, and emergency — Resolve jumps to the next workflow step.
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.href}
            className="rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-3.5 shadow-[var(--mpa-shadow-xs)] transition-all duration-[var(--mpa-duration-fast)] hover:shadow-[var(--mpa-shadow-sm)]"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">{metric.label}</p>
            <p
              className={[
                "mt-2 text-2xl font-semibold tabular-nums",
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

      <div className="grid gap-3 xl:grid-cols-2">
        <MaintenanceListCard
          title="Waiting for vendor"
          items={waitingVendor.map((item) => ({
            id: item.id,
            workOrderNumber: item.workOrderNumber,
            title: item.title,
            href: `${item.href}`,
            meta: "Resolve · Notify / start work"
          }))}
          emptyLabel="No work orders waiting on vendors"
        />
        <MaintenanceListCard
          title="Waiting for resident"
          items={waitingResident.map((item) => ({
            id: item.id,
            workOrderNumber: item.workOrderNumber,
            title: item.title,
            href: `${item.href}#conversation`,
            meta: "Resolve · Request confirmation"
          }))}
          emptyLabel="No completed work awaiting resident confirmation"
        />
        <MaintenanceListCard
          title="Overdue work"
          items={overdueItems.map((item) => ({
            id: item.id,
            workOrderNumber: item.workOrderNumber,
            title: item.title,
            href: item.href,
            meta: item.dueDate ? `Resolve · Due ${item.dueDate}` : "Resolve · Open workflow"
          }))}
          emptyLabel="No overdue work orders"
        />
        <MaintenanceListCard
          title="Emergency / high priority"
          items={emergencyItems.map((item) => ({
            id: item.id,
            workOrderNumber: item.workOrderNumber,
            title: item.title,
            href: item.status === "submitted" || item.status === "triaged" ? `${item.href}#vendor` : item.href,
            meta:
              item.status === "submitted" || item.status === "triaged"
                ? "Resolve · Assign vendor"
                : item.status === "assigned"
                  ? "Resolve · Notify / start work"
                  : item.status === "in_progress"
                    ? "Resolve · Complete work"
                    : `Resolve · ${item.priority}`
          }))}
          emptyLabel="No high-priority work orders"
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
    <article className="rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] shadow-[var(--mpa-shadow-xs)] p-4">
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.href}
            className="rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-3.5 shadow-[var(--mpa-shadow-xs)] transition-all duration-[var(--mpa-duration-fast)] hover:shadow-[var(--mpa-shadow-sm)]"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">{metric.label}</p>
            <p
              className={[
                "mt-2 text-2xl font-semibold tabular-nums",
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
        <article className="rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] shadow-[var(--mpa-shadow-xs)] p-4">
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
            <Link href="/residents/move-in" className="text-xs font-semibold text-[var(--mpa-color-brand-primary)] hover:underline">
              Start Move in
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.href}
            className="rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-3.5 shadow-[var(--mpa-shadow-xs)] transition-all duration-[var(--mpa-duration-fast)] hover:shadow-[var(--mpa-shadow-sm)]"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">{metric.label}</p>
            <p
              className={[
                "mt-2 text-2xl font-semibold tabular-nums",
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
        <article className="rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] shadow-[var(--mpa-shadow-xs)] p-4">
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

function ApplicantOperationsCard({
  snapshot,
  canCreate
}: {
  snapshot: NonNullable<DashboardApplicantSummary>;
  canCreate: boolean;
}) {
  const metrics = [
    {
      label: "Pending applications",
      value: snapshot.pendingApplications,
      href: "/applicants?status=submitted",
      tone: snapshot.pendingApplications > 0 ? ("warning" as const) : ("default" as const)
    },
    {
      label: "Screening queue",
      value: snapshot.screeningQueue,
      href: "/applicants?status=screening_in_progress",
      tone: snapshot.screeningQueue > 0 ? ("info" as const) : ("default" as const)
    },
    {
      label: "Awaiting documents",
      value: snapshot.awaitingDocuments,
      href: "/applicants?status=awaiting_documents",
      tone: snapshot.awaitingDocuments > 0 ? ("warning" as const) : ("default" as const)
    },
    {
      label: "Awaiting signatures",
      value: snapshot.awaitingSignatures,
      href: "/leases?status=draft",
      tone: snapshot.awaitingSignatures > 0 ? ("warning" as const) : ("default" as const)
    },
    {
      label: "Ready for Move in",
      value: snapshot.recentlyApproved,
      href: "/residents/move-in",
      tone: snapshot.recentlyApproved > 0 ? ("success" as const) : ("default" as const)
    },
    {
      label: "Move-ins this week",
      value: snapshot.moveInsThisWeek,
      href: "/residents/move-in",
      tone: snapshot.moveInsThisWeek > 0 ? ("info" as const) : ("default" as const)
    }
  ];

  const approvedReady = snapshot.recentlyApprovedSample.map((item) => ({
    ...item,
    href: `/residents/move-in?applicantId=${encodeURIComponent(item.id)}`,
    status: "approved_continue_move_in"
  }));

  const sampleItems = [
    ...approvedReady,
    ...snapshot.pendingSample,
    ...snapshot.screeningSample,
    ...snapshot.awaitingDocumentsSample
  ].slice(0, 5);

  return (
    <section aria-labelledby="applicant-ops-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="applicant-ops-heading" className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
            Applicant Operations
          </h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Application pipeline, screening, documents, signatures, and move-in readiness.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/applicants" className="text-xs font-semibold text-[var(--mpa-color-brand-primary)] hover:underline">
            View applicants
          </Link>
          {canCreate ? (
            <Link href="/applicants/new" className="text-xs font-semibold text-[var(--mpa-color-brand-primary)] hover:underline">
              New application
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.href}
            className="rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-4 shadow-[var(--mpa-shadow-xs)] transition-all duration-[var(--mpa-duration-fast)] hover:shadow-[var(--mpa-shadow-sm)]"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">{metric.label}</p>
            <p
              className={[
                "mt-2 text-2xl font-semibold tabular-nums",
                metric.tone === "warning"
                  ? "text-amber-700"
                  : metric.tone === "info"
                    ? "text-sky-700"
                    : metric.tone === "success"
                      ? "text-emerald-700"
                      : "text-[var(--mpa-color-text-primary)]"
              ].join(" ")}
            >
              {metric.value}
            </p>
          </Link>
        ))}
      </div>

      {sampleItems.length > 0 ? (
        <article className="rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-4 shadow-[var(--mpa-shadow-xs)]">
          <h3 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Applications needing attention</h3>
          <ul className="mt-3 space-y-2">
            {sampleItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="block rounded-lg border border-[var(--mpa-color-border-default)] px-3 py-2.5 transition-colors hover:bg-[var(--mpa-color-bg-app)]"
                >
                  <p className="text-xs font-semibold text-[var(--mpa-color-brand-primary)]">
                    {item.applicationNumber} · {item.applicantName}
                  </p>
                  <p className="text-sm text-[var(--mpa-color-text-primary)]">{item.propertyName ?? "Unassigned property"}</p>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                    {item.status === "approved_continue_move_in"
                      ? "Continue to Move In"
                      : item.status.replaceAll("_", " ")}
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

function CommunicationOperationsCard({
  snapshot,
  canCreate
}: {
  snapshot: CommunicationDashboardMetrics;
  canCreate: boolean;
}) {
  const metrics = [
    { label: "Unread messages", value: snapshot.unreadMessages, href: "/communications/inbox", tone: "warning" as const },
    { label: "Awaiting resident", value: snapshot.awaitingResidentReply, href: "/communications/inbox", tone: "warning" as const },
    { label: "Vendor replies", value: snapshot.vendorReplies, href: "/communications/inbox", tone: "default" as const },
    { label: "Pending threads", value: snapshot.pendingConversations, href: "/communications/inbox", tone: "info" as const },
    { label: "Emergency unread", value: snapshot.emergencyUnread, href: "/communications/inbox", tone: "danger" as const },
    { label: "Unread announcements", value: snapshot.unreadAnnouncements, href: "/communications", tone: "warning" as const },
    { label: "Scheduled", value: snapshot.scheduledAnnouncements, href: "/communications", tone: "default" as const },
    { label: "Read rate", value: `${snapshot.averageReadPercentage}%`, href: "/communications", tone: "info" as const }
  ];

  return (
    <section aria-labelledby="communication-ops-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="communication-ops-heading" className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
            Communication Platform
          </h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Unified inbox, resident announcements, readership, and community activity.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/communications/inbox" className="text-xs font-semibold text-[var(--mpa-color-brand-primary)] hover:underline">
            Open inbox
          </Link>
          <Link href="/communications" className="text-xs font-semibold text-[var(--mpa-color-brand-primary)] hover:underline">
            View announcements
          </Link>
          {canCreate ? (
            <Link href="/communications/new" className="text-xs font-semibold text-[var(--mpa-color-brand-primary)] hover:underline">
              Create announcement
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.href}
            className="rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-3.5 shadow-[var(--mpa-shadow-xs)] transition-all duration-[var(--mpa-duration-fast)] hover:shadow-[var(--mpa-shadow-sm)]"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">{metric.label}</p>
            <p
              className={[
                "mt-2 text-2xl font-semibold tabular-nums",
                metric.tone === "warning"
                  ? "text-amber-700"
                  : metric.tone === "danger"
                    ? "text-red-700"
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
    </section>
  );
}

function FinancialOperationsCard({
  snapshot,
  canCreate
}: {
  snapshot: DashboardFinancialSummary;
  canCreate: boolean;
}) {
  const metrics = [
    { label: "Rent due today", value: snapshot.rentDueToday, href: "/financials/charges", tone: "warning" as const },
    { label: "Late rent", value: snapshot.lateRentCount, href: "/financials/charges", tone: "danger" as const },
    {
      label: "Outstanding",
      value: formatCurrency(snapshot.outstandingBalancesTotal),
      href: "/financials/charges",
      tone: "warning" as const
    },
    {
      label: "Owner statements",
      value: snapshot.ownerStatementsGenerated,
      href: "/financials/owner-statements",
      tone: "info" as const
    },
    {
      label: "Draft statements",
      value: snapshot.ownerStatementsDraft,
      href: "/financials/owner-statements",
      tone: "default" as const
    }
  ];

  return (
    <section aria-labelledby="financial-ops-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="financial-ops-heading" className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
            Financial Operations
          </h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Rent collection, expenses, owner statements, and outstanding balances.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/financials" className="text-xs font-semibold text-[var(--mpa-color-brand-primary)] hover:underline">
            View financials
          </Link>
          {canCreate ? (
            <Link href="/financials/expenses/new" className="text-xs font-semibold text-[var(--mpa-color-brand-primary)] hover:underline">
              Record expense
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.href}
            className="rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-3.5 shadow-[var(--mpa-shadow-xs)] transition-all duration-[var(--mpa-duration-fast)] hover:shadow-[var(--mpa-shadow-sm)]"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">{metric.label}</p>
            <p
              className={[
                "mt-2 text-2xl font-semibold tabular-nums",
                metric.tone === "warning"
                  ? "text-amber-700"
                  : metric.tone === "danger"
                    ? "text-red-700"
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

      {(snapshot.recentPaymentSample.length > 0 || snapshot.recentExpenseSample.length > 0) && (
        <div className="grid gap-3 md:grid-cols-2">
          {snapshot.recentPaymentSample.length > 0 ? (
            <article className="rounded-xl border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
              <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Recent payments</h3>
              <ul className="mt-2 space-y-2">
                {snapshot.recentPaymentSample.map((payment) => (
                  <li key={payment.id} className="text-sm">
                    <Link href={payment.href} className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
                      {payment.paymentNumber}
                    </Link>
                    <span className="text-[var(--mpa-color-text-secondary)]">
                      {" "}
                      · {formatCurrency(payment.amount)} · {payment.paymentDate}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}
          {snapshot.recentExpenseSample.length > 0 ? (
            <article className="rounded-xl border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4">
              <h3 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Recent expenses</h3>
              <ul className="mt-2 space-y-2">
                {snapshot.recentExpenseSample.map((expense) => (
                  <li key={expense.id} className="text-sm">
                    <Link href={expense.href} className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
                      {expense.description}
                    </Link>
                    <span className="text-[var(--mpa-color-text-secondary)]">
                      {" "}
                      · {formatCurrency(expense.amount)} · {expense.expenseDate}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}
        </div>
      )}
    </section>
  );
}

function MigrationOperationsCard({
  snapshot,
  canCreate
}: {
  snapshot: MigrationDashboardMetrics;
  canCreate: boolean;
}) {
  const goLiveHint =
    snapshot.pendingReview === 0 && snapshot.activeJobs === 0 && snapshot.completedJobs > 0
      ? "Go-live checklist available"
      : snapshot.pendingReview > 0
        ? "Exceptions blocking go-live"
        : snapshot.activeJobs > 0
          ? "Import in progress"
          : "Start switching when ready";

  const metrics = [
    { label: "Migration health", value: snapshot.averageCompletionPct > 0 ? `${snapshot.averageCompletionPct}%` : "—", href: "/migration" },
    { label: "Incomplete imports", value: snapshot.activeJobs, href: "/migration" },
    { label: "Migration warnings", value: snapshot.pendingReview, href: "/migration" },
    { label: "Migration errors", value: snapshot.recentErrors, href: "/migration" },
    { label: "Go-live status", value: goLiveHint, href: "/migration#go-live" }
  ];

  return (
    <section aria-labelledby="migration-ops-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="migration-ops-heading" className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
            Switching &amp; go-live
          </h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Migration health, exceptions, and whether you&apos;re ready to operate in M.P.A.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/migration" className="text-xs font-semibold text-[var(--mpa-color-brand-primary)] hover:underline">
            Open switching dashboard
          </Link>
          {canCreate ? (
            <Link href="/migration/new" className="text-xs font-semibold text-[var(--mpa-color-brand-primary)] hover:underline">
              New migration
            </Link>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <Link
            key={metric.label}
            href={metric.href}
            className="rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-4 shadow-[var(--mpa-shadow-xs)] transition-all duration-[var(--mpa-duration-fast)] hover:shadow-[var(--mpa-shadow-sm)]"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">{metric.label}</p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-[var(--mpa-color-text-primary)] sm:text-2xl">
              {metric.value}
            </p>
          </Link>
        ))}
      </div>

      {snapshot.pendingReviewSample.length > 0 ? (
        <ul className="space-y-2 rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-4">
          {snapshot.pendingReviewSample.map((item) => (
            <li key={item.id}>
              <Link href={item.href} className="text-sm text-[var(--mpa-color-brand-primary)] hover:underline">
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
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
