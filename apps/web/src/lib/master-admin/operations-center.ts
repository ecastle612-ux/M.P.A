import type { User } from "@supabase/supabase-js";
import { createAuthServerComponentClient } from "../auth/server";
import { getDashboardSnapshot } from "../dashboard/server";
import { buildProviderHealthDashboard } from "../integrations/provider-status";
import { getNotificationOpsMetrics } from "../notifications/server";
import { getMasterAdminHealthChecks } from "./health";

export type AttentionSeverity = "critical" | "warning" | "info";

export type AttentionItem = {
  id: string;
  severity: AttentionSeverity;
  category: string;
  title: string;
  context: string | null;
  href: string;
};

export type BusinessKpi = {
  id: string;
  label: string;
  value: string;
  href: string;
  scope: "platform" | "active_org";
  available: boolean;
};

export type OperationsCenterSnapshot = {
  greetingName: string;
  activeOrganizationId: string;
  activeOrganizationName: string;
  attention: AttentionItem[];
  kpis: BusinessKpi[];
  generatedAt: string;
};

function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(amount);
}

function displayNameFromUser(user: User): string {
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
  const fromMeta = meta?.full_name?.trim() || meta?.name?.trim();
  if (fromMeta) return fromMeta.split(" ")[0] ?? fromMeta;
  const email = user.email?.trim();
  if (email) return email.split("@")[0] ?? "there";
  return "there";
}

export async function getOperationsCenterSnapshot(
  user: User,
  organizationId: string
): Promise<OperationsCenterSnapshot> {
  const supabase = await createAuthServerComponentClient();
  const attention: AttentionItem[] = [];

  const [
    providers,
    dashboard,
    notificationOps,
    healthChecks,
    orgRow,
    orgCountResult,
    managerCountResult,
    platformOrgRows
  ] = await Promise.all([
    buildProviderHealthDashboard().catch(() => []),
    getDashboardSnapshot(organizationId, supabase, user.id).catch(() => null),
    getNotificationOpsMetrics(organizationId, user.id, supabase).catch(() => null),
    getMasterAdminHealthChecks(supabase, organizationId).catch(() => []),
    supabase.from("organizations").select("id, name").eq("id", organizationId).maybeSingle(),
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase
      .from("organization_memberships")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .contains("roles", ["property_manager"]),
    supabase.from("organizations").select("id, name").order("name", { ascending: true }).limit(100)
  ]);

  const activeOrganizationName =
    (orgRow.data as { name?: string } | null)?.name?.trim() || "Active organization";

  for (const provider of providers) {
    if (provider.status === "configuration_required") {
      attention.push({
        id: `provider-config-${provider.id}`,
        severity: "critical",
        category: "integration",
        title: `${provider.name} requires configuration`,
        context: provider.lastError ?? provider.nextAction,
        href: "/master-admin/providers"
      });
    } else if (provider.lastError) {
      attention.push({
        id: `provider-error-${provider.id}`,
        severity: "warning",
        category: "integration",
        title: `${provider.name} reported an error`,
        context: provider.lastError,
        href: "/master-admin/providers"
      });
    } else if (provider.status === "disabled" && provider.category.toLowerCase().includes("email")) {
      // Skip noisy disabled providers unless they are clearly required later.
    }
  }

  if (notificationOps) {
    if (!notificationOps.providerHealthy) {
      attention.push({
        id: "push-provider-unhealthy",
        severity: "critical",
        category: "notifications",
        title: "Push notification provider is unhealthy",
        context: notificationOps.providerDetail ?? notificationOps.providerKey,
        href: "/settings/notifications"
      });
    }
    if (notificationOps.pushFailed24h > 0 || notificationOps.failedDeliveries24h > 0) {
      const failed = Math.max(notificationOps.pushFailed24h, notificationOps.failedDeliveries24h);
      attention.push({
        id: "push-failed-24h",
        severity: "critical",
        category: "notifications",
        title: `${failed} push notification${failed === 1 ? "" : "s"} failed in the last 24h`,
        context: activeOrganizationName,
        href: "/settings/notifications"
      });
    }
  }

  if (dashboard?.migration) {
    const migration = dashboard.migration;
    if (migration.activeJobs > 0) {
      attention.push({
        id: "migration-active",
        severity: "warning",
        category: "onboarding",
        title: `${migration.activeJobs} migration job${migration.activeJobs === 1 ? "" : "s"} in progress`,
        context: activeOrganizationName,
        href: "/migration"
      });
    }
    if (migration.pendingReview > 0) {
      attention.push({
        id: "migration-review",
        severity: "warning",
        category: "onboarding",
        title: `${migration.pendingReview} migration item${migration.pendingReview === 1 ? "" : "s"} need review`,
        context: activeOrganizationName,
        href: "/migration"
      });
    }
    if (migration.recentErrors > 0) {
      attention.push({
        id: "migration-errors",
        severity: "critical",
        category: "onboarding",
        title: `Migration reported ${migration.recentErrors} recent error${migration.recentErrors === 1 ? "" : "s"}`,
        context: activeOrganizationName,
        href: "/migration"
      });
    }
  }

  if (dashboard?.communications) {
    const pending =
      dashboard.communications.pendingConversations ||
      dashboard.communications.unreadMessages ||
      dashboard.communications.awaitingResidentReply;
    if (pending > 0) {
      attention.push({
        id: "support-messages",
        severity: "warning",
        category: "support",
        title: `${pending} support conversation${pending === 1 ? "" : "s"} waiting`,
        context: activeOrganizationName,
        href: "/communications/inbox"
      });
    }
    if (dashboard.communications.emergencyUnread > 0) {
      attention.push({
        id: "emergency-unread",
        severity: "critical",
        category: "support",
        title: `${dashboard.communications.emergencyUnread} emergency message${dashboard.communications.emergencyUnread === 1 ? "" : "s"} unread`,
        context: activeOrganizationName,
        href: "/communications/inbox"
      });
    }
  }

  if (dashboard?.maintenance) {
    if (dashboard.maintenance.overdueWorkOrders > 0) {
      attention.push({
        id: "maintenance-overdue",
        severity: "critical",
        category: "maintenance",
        title: `${dashboard.maintenance.overdueWorkOrders} maintenance request${dashboard.maintenance.overdueWorkOrders === 1 ? "" : "s"} exceeded SLA`,
        context: activeOrganizationName,
        href: "/maintenance"
      });
    } else if (dashboard.maintenance.highPriorityWorkOrders > 0) {
      attention.push({
        id: "maintenance-high",
        severity: "warning",
        category: "maintenance",
        title: `${dashboard.maintenance.highPriorityWorkOrders} high-priority work order${dashboard.maintenance.highPriorityWorkOrders === 1 ? "" : "s"} open`,
        context: activeOrganizationName,
        href: "/maintenance"
      });
    }
  }

  if (dashboard?.vendors && dashboard.vendors.awaitingResponse > 0) {
    attention.push({
      id: "vendors-stuck",
      severity: "warning",
      category: "operations",
      title: `${dashboard.vendors.awaitingResponse} vendor assignment${dashboard.vendors.awaitingResponse === 1 ? "" : "s"} awaiting response`,
      context: activeOrganizationName,
      href: "/maintenance"
    });
  }

  for (const check of healthChecks) {
    if (!check.ok) {
      attention.push({
        id: `health-${check.table}`,
        severity: "critical",
        category: "platform",
        title: `Health check failed for ${check.table}`,
        context: check.error,
        href: "/master-admin/health"
      });
    }
  }

  const severityRank: Record<AttentionSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2
  };
  attention.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  const organizationCount = orgCountResult.count ?? (platformOrgRows.data?.length ?? 0);
  const managerCount = managerCountResult.count;
  const vendorHealth = healthChecks.find((check) => check.table === "vendors");

  const kpis: BusinessKpi[] = [
    {
      id: "organizations",
      label: "Organizations",
      value: String(organizationCount),
      href: "/master-admin/impersonation",
      scope: "platform",
      available: orgCountResult.error == null
    },
    {
      id: "property-managers",
      label: "Active Property Managers",
      value: managerCount == null ? "—" : String(managerCount),
      href: "/settings/team",
      scope: "active_org",
      available: managerCountResult.error == null && managerCount != null
    },
    {
      id: "properties",
      label: "Properties",
      value: dashboard ? String(dashboard.propertiesTotal) : "—",
      href: "/properties",
      scope: "active_org",
      available: Boolean(dashboard)
    },
    {
      id: "residents",
      label: "Residents",
      value: dashboard ? String(dashboard.tenantsTotal) : "—",
      href: "/tenants",
      scope: "active_org",
      available: Boolean(dashboard)
    },
    {
      id: "vendors",
      label: "Vendors",
      value: vendorHealth?.count != null ? String(vendorHealth.count) : "—",
      href: "/maintenance",
      scope: "active_org",
      available: Boolean(vendorHealth?.ok && vendorHealth.count != null)
    },
    {
      id: "occupancy",
      label: "Occupancy",
      value: dashboard ? formatPercent(dashboard.occupancyRate) : "—",
      href: "/dashboard",
      scope: "active_org",
      available: Boolean(dashboard)
    },
    {
      id: "open-maintenance",
      label: "Open Maintenance",
      value: dashboard?.maintenance ? String(dashboard.maintenance.openWorkOrders) : "—",
      href: "/maintenance",
      scope: "active_org",
      available: Boolean(dashboard?.maintenance)
    },
    {
      id: "revenue",
      label: "Outstanding Balances",
      value: dashboard?.financial
        ? formatCurrency(dashboard.financial.outstandingBalancesTotal)
        : "—",
      href: "/financials",
      scope: "active_org",
      available: Boolean(dashboard?.financial)
    },
    {
      id: "monthly-growth",
      label: "Monthly Growth",
      value: "—",
      href: "/master-admin",
      scope: "platform",
      available: false
    }
  ];

  return {
    greetingName: displayNameFromUser(user),
    activeOrganizationId: organizationId,
    activeOrganizationName,
    attention: attention.slice(0, 12),
    kpis,
    generatedAt: new Date().toISOString()
  };
}
