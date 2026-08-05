/**
 * UX-016 Slice A/B — map existing dashboard / Command Center signals into the
 * Universal Dashboard Framework view model. Presentation only; no new APIs.
 */

import type { DashboardSnapshot } from "./server";
import type { CommandCenterHomeComposition } from "../ops/command-center-home";
import type { QuickActionDefinition } from "../ops/quick-actions";
import { UX016_SURFACE_COPY, type Ux016Surface, type Ux016SurfaceCopy } from "./ux016-surfaces";

export type UniversalAttentionItem = {
  id: string;
  title: string;
  reason: string;
  href: string;
  actionLabel: string;
  severity: "critical" | "high" | "normal";
};

export type UniversalMissionItem = {
  id: string;
  label: string;
  count: number;
  href: string;
};

export type UniversalQuickAction = {
  id: string;
  label: string;
  href?: string;
  actionId?: string;
};

export type UniversalActivityItem = {
  id: string;
  summary: string;
  meta: string;
  href: string | null;
};

export type UniversalInsightItem = {
  id: string;
  label: string;
  value: string;
  href?: string;
};

export type UniversalDashboardViewModel = {
  surface: Ux016Surface;
  copy: Ux016SurfaceCopy;
  greeting: {
    timeGreeting: string;
    userName: string | null;
    organizationName: string | null;
    placeLabel: string;
    dateLabel: string;
    statusSummary: string;
    supportingLine: string;
  };
  attention: UniversalAttentionItem[];
  mission: UniversalMissionItem[];
  quickActions: UniversalQuickAction[];
  recentActivity: UniversalActivityItem[];
  insights: UniversalInsightItem[];
};

const PRIORITY_RANK: Record<string, number> = {
  emergency: 0,
  critical: 0,
  high: 1,
  normal: 2,
  medium: 2,
  low: 3
};

function severityFromPriority(priority: string): UniversalAttentionItem["severity"] {
  const rank = PRIORITY_RANK[priority] ?? 2;
  if (rank === 0) return "critical";
  if (rank === 1) return "high";
  return "normal";
}

function placeLabelFromSnapshot(snapshot: DashboardSnapshot): string {
  const total = snapshot.propertiesTotal;
  if (total <= 0) return "No properties yet";
  if (total === 1) return "1 property";
  return `Portfolio · ${total} properties`;
}

function statusSummary(
  surface: Ux016Surface,
  attentionCount: number,
  mission: UniversalMissionItem[],
  userName: string | null
): string {
  const name = userName?.trim();
  if (surface === "property_manager" || surface === "organization_admin") {
    const workOrders = mission.find((row) => row.id === "mission-maintenance");
    if (workOrders && workOrders.count > 0) {
      return `You have ${workOrders.count} work order${workOrders.count === 1 ? "" : "s"} today.`;
    }
    const inbox = mission.find((row) => row.id === "mission-inbox");
    if (inbox && inbox.count > 0) {
      return `${inbox.count} resident${inbox.count === 1 ? " is" : "s are"} waiting for a response.`;
    }
  }
  if (attentionCount > 0) {
    return attentionCount === 1
      ? "1 item needs your attention."
      : `${attentionCount} items need your attention.`;
  }
  const missionTotal = mission.reduce((sum, row) => sum + row.count, 0);
  if (missionTotal > 0) {
    return `${missionTotal} items are in today’s mission.`;
  }
  return name ? `You’re clear for now, ${name}.` : "You’re clear for now.";
}

export function buildUniversalDashboardViewModel(input: {
  timeGreeting: string;
  userGreetingName: string | null;
  organizationName: string | null;
  dateLabel: string;
  snapshot: DashboardSnapshot;
  commandCenterHome: CommandCenterHomeComposition | null;
  permissionQuickActions?: Array<{ id: string; label: string; href: string }>;
  /** UX-016 Slice B — defaults to property_manager */
  surface?: Ux016Surface;
}): UniversalDashboardViewModel {
  const surface = input.surface ?? "property_manager";
  const copy = UX016_SURFACE_COPY[surface];
  const { snapshot, commandCenterHome } = input;
  const attention =
    surface === "organization_admin"
      ? buildAdminAttention(snapshot, commandCenterHome)
      : buildAttention(snapshot, commandCenterHome);
  const mission =
    surface === "organization_admin"
      ? buildAdminMission(snapshot, commandCenterHome)
      : buildMission(snapshot, commandCenterHome);
  const quickActions =
    surface === "organization_admin"
      ? buildAdminQuickActions(commandCenterHome?.quickActions ?? [], input.permissionQuickActions ?? [])
      : buildQuickActions(commandCenterHome?.quickActions ?? [], input.permissionQuickActions ?? []);
  const recentActivity = buildRecentActivity(snapshot, commandCenterHome);
  const insights = buildInsights(snapshot, commandCenterHome);

  return {
    surface,
    copy,
    greeting: {
      timeGreeting: input.timeGreeting,
      userName: input.userGreetingName,
      organizationName: input.organizationName,
      placeLabel: placeLabelFromSnapshot(snapshot),
      dateLabel: input.dateLabel,
      statusSummary: statusSummary(surface, attention.length, mission, input.userGreetingName),
      supportingLine: copy.supportingLine
    },
    attention,
    mission,
    quickActions,
    recentActivity,
    insights
  };
}

function buildAttention(
  snapshot: DashboardSnapshot,
  home: CommandCenterHomeComposition | null
): UniversalAttentionItem[] {
  const items: UniversalAttentionItem[] = [];

  for (const alert of home?.alerts ?? []) {
    items.push({
      id: `alert-${alert.title}-${alert.href}`,
      title: alert.title,
      reason: `Priority: ${alert.priority}`,
      href: alert.href,
      actionLabel: "Review",
      severity: severityFromPriority(alert.priority)
    });
  }

  for (const task of home?.priorityTasks ?? []) {
    items.push({
      id: `ops-task-${task.taskId}`,
      title: task.title,
      reason: task.description?.trim() || `${task.priority} · ${task.status}`,
      href: task.deepLink ?? "/inbox",
      actionLabel: "Open",
      severity: severityFromPriority(task.priority)
    });
  }

  for (const item of home?.inboxPreview ?? []) {
    items.push({
      id: `inbox-${item.itemId}`,
      title: item.title,
      reason: item.kind ? `Unread · ${item.kind}` : "Unread inbox item",
      href: item.deepLink ?? "/inbox",
      actionLabel: "Open",
      severity: "high"
    });
  }

  for (const task of snapshot.operationalTasks) {
    items.push({
      id: `dash-task-${task.id}`,
      title: task.title,
      reason: task.description,
      href: task.href,
      actionLabel: task.actionLabel,
      severity: task.priority === "high" ? "high" : task.priority === "low" ? "normal" : "high"
    });
  }

  const emergencySample = snapshot.maintenance?.highPrioritySample?.[0];
  if (emergencySample) {
    items.push({
      id: `maint-high-${emergencySample.id}`,
      title: emergencySample.title,
      reason: `High-priority maintenance · ${emergencySample.workOrderNumber}`,
      href: emergencySample.href,
      actionLabel: "Open work order",
      severity: "critical"
    });
  }

  const overdueSample = snapshot.maintenance?.overdueSample?.[0];
  if (overdueSample) {
    items.push({
      id: `maint-overdue-${overdueSample.id}`,
      title: overdueSample.title,
      reason: "Inspection or work order overdue",
      href: overdueSample.href,
      actionLabel: "Open",
      severity: "high"
    });
  }

  const leaseExpiring = snapshot.leases?.expirationSample?.[0];
  if (leaseExpiring) {
    items.push({
      id: `lease-exp-${leaseExpiring.id}`,
      title: `Lease ${leaseExpiring.leaseNumber} expiring`,
      reason: leaseExpiring.tenantName
        ? `${leaseExpiring.tenantName} · ends ${leaseExpiring.endDate}`
        : `Ends ${leaseExpiring.endDate}`,
      href: leaseExpiring.href,
      actionLabel: "Review lease",
      severity: "high"
    });
  }

  items.sort((a, b) => {
    const rank = { critical: 0, high: 1, normal: 2 } as const;
    return rank[a.severity] - rank[b.severity];
  });

  const seen = new Set<string>();
  const deduped: UniversalAttentionItem[] = [];
  for (const item of items) {
    const key = `${item.title}|${item.href}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
    if (deduped.length >= 5) break;
  }
  return deduped;
}

function buildMission(
  snapshot: DashboardSnapshot,
  home: CommandCenterHomeComposition | null
): UniversalMissionItem[] {
  const rows: UniversalMissionItem[] = [];

  const openWo = snapshot.maintenance?.openWorkOrders ?? 0;
  if (openWo > 0) {
    rows.push({
      id: "mission-maintenance",
      label: openWo === 1 ? "work order" : "work orders",
      count: openWo,
      href: "/maintenance"
    });
  }

  const overdueWo = snapshot.maintenance?.overdueWorkOrders ?? 0;
  if (overdueWo > 0) {
    rows.push({
      id: "mission-overdue",
      label: overdueWo === 1 ? "overdue work order" : "overdue work orders",
      count: overdueWo,
      href: "/maintenance"
    });
  }

  const renewals = snapshot.renewalNeededTotal || snapshot.leases?.renewalNeeded || 0;
  if (renewals > 0) {
    rows.push({
      id: "mission-renewals",
      label: renewals === 1 ? "lease renewal" : "lease renewals",
      count: renewals,
      href: "/leases"
    });
  }

  const expirations = snapshot.expiringLeasesTotal || snapshot.leases?.upcomingExpirations || 0;
  if (expirations > 0) {
    rows.push({
      id: "mission-expirations",
      label: expirations === 1 ? "lease expiring soon" : "leases expiring soon",
      count: expirations,
      href: "/leases"
    });
  }

  const signatures = home?.kpis?.["signatures_pending"];
  if (typeof signatures === "number" && signatures > 0) {
    rows.push({
      id: "mission-signatures",
      label: signatures === 1 ? "signature pending" : "signatures pending",
      count: signatures,
      href: "/leases"
    });
  }

  const inbox = home?.inboxUnreadCount ?? 0;
  if (inbox > 0) {
    rows.push({
      id: "mission-inbox",
      label: inbox === 1 ? "inbox item" : "inbox items",
      count: inbox,
      href: "/inbox"
    });
  }

  const lateRent = snapshot.financial?.lateRentCount ?? 0;
  if (lateRent > 0) {
    rows.push({
      id: "mission-late-rent",
      label: lateRent === 1 ? "late rent account" : "late rent accounts",
      count: lateRent,
      href: "/financials"
    });
  }

  const vacancies = snapshot.vacanciesTotal ?? 0;
  if (vacancies > 0) {
    rows.push({
      id: "mission-vacancies",
      label: vacancies === 1 ? "vacancy" : "vacancies",
      count: vacancies,
      href: "/units"
    });
  }

  const applicants = snapshot.applicants?.pendingApplications ?? 0;
  if (applicants > 0) {
    rows.push({
      id: "mission-applicants",
      label: applicants === 1 ? "applicant" : "applicants",
      count: applicants,
      href: "/applicants"
    });
  }

  const awaitingSignatures = snapshot.applicants?.awaitingSignatures ?? 0;
  if (awaitingSignatures > 0) {
    rows.push({
      id: "mission-app-signatures",
      label: awaitingSignatures === 1 ? "signature pending" : "signatures pending",
      count: awaitingSignatures,
      href: "/applicants"
    });
  }

  const vendorApprovals = snapshot.vendors?.awaitingResponse ?? 0;
  if (vendorApprovals > 0) {
    rows.push({
      id: "mission-vendors",
      label: vendorApprovals === 1 ? "vendor awaiting response" : "vendors awaiting response",
      count: vendorApprovals,
      href: "/vendors"
    });
  }

  return rows.slice(0, 8);
}

function buildQuickActions(
  opsActions: QuickActionDefinition[],
  permissionActions: Array<{ id: string; label: string; href: string }>
): UniversalQuickAction[] {
  const merged: UniversalQuickAction[] = [];
  const seen = new Set<string>();

  for (const action of opsActions) {
    if (merged.length >= 6) break;
    if (seen.has(action.actionId)) continue;
    seen.add(action.actionId);
    const next: UniversalQuickAction = {
      id: action.actionId,
      label: action.label,
      actionId: action.actionId
    };
    if (action.href) next.href = action.href;
    merged.push(next);
  }

  for (const action of permissionActions) {
    if (merged.length >= 6) break;
    if (seen.has(action.id)) continue;
    seen.add(action.id);
    merged.push({
      id: action.id,
      label: action.label,
      href: action.href
    });
  }

  return merged;
}

function buildRecentActivity(
  snapshot: DashboardSnapshot,
  home: CommandCenterHomeComposition | null
): UniversalActivityItem[] {
  if (home?.recentActivity?.length) {
    return home.recentActivity.slice(0, 8).map((entry, index) => ({
      id: `cc-${entry.eventType}-${entry.occurredAt}-${index}`,
      summary: entry.summary,
      meta: `${entry.eventType} · ${formatWhen(entry.occurredAt)}`,
      href: entry.href
    }));
  }

  return snapshot.recentActivity.slice(0, 8).map((entry) => ({
    id: entry.id,
    summary: entry.title,
    meta: [entry.subtitle, entry.status, formatWhen(entry.timestamp)].filter(Boolean).join(" · "),
    href: entry.href
  }));
}

function buildInsights(
  snapshot: DashboardSnapshot,
  home: CommandCenterHomeComposition | null
): UniversalInsightItem[] {
  const insights: UniversalInsightItem[] = [
    {
      id: "insight-occupancy",
      label: "Occupancy",
      value: `${Math.round(snapshot.occupancyRate)}%`,
      href: "/properties"
    },
    {
      id: "insight-units",
      label: "Units",
      value: String(snapshot.unitsTotal),
      href: "/units"
    },
    {
      id: "insight-tenants",
      label: "Active residents",
      value: String(snapshot.activeTenants),
      href: "/tenants"
    }
  ];

  if (snapshot.maintenance) {
    insights.push({
      id: "insight-open-wo",
      label: "Open work orders",
      value: String(snapshot.maintenance.openWorkOrders),
      href: "/maintenance"
    });
  }

  const kpiEntries = Object.entries(home?.kpis ?? {}).slice(0, 4);
  for (const [key, value] of kpiEntries) {
    insights.push({
      id: `kpi-${key}`,
      label: key.replace(/_/g, " "),
      value: String(value)
    });
  }

  if (home?.monitoring) {
    insights.push({
      id: "insight-ops-health",
      label: "Ops execution",
      value: home.monitoring.executionStatus,
      href: "/dashboard#insights"
    });
  }

  return insights.slice(0, 8);
}

/** Org Admin: bias toward workspace health, billing, setup, approvals. */
function buildAdminAttention(
  snapshot: DashboardSnapshot,
  home: CommandCenterHomeComposition | null
): UniversalAttentionItem[] {
  const items: UniversalAttentionItem[] = [];

  if (snapshot.propertiesTotal === 0) {
    items.push({
      id: "admin-setup-org",
      title: "Organization needs setup",
      reason: "Add the first property to activate daily operations.",
      href: "/properties/new",
      actionLabel: "Add property",
      severity: "critical"
    });
  } else if (snapshot.propertiesWithoutUnits > 0) {
    items.push({
      id: "admin-setup-units",
      title: "Properties missing units",
      reason: `${snapshot.propertiesWithoutUnits} propert${snapshot.propertiesWithoutUnits === 1 ? "y needs" : "ies need"} unit setup.`,
      href: "/properties",
      actionLabel: "Review",
      severity: "high"
    });
  }

  if (home?.monitoring?.executionStatus === "critical" || home?.monitoring?.executionStatus === "degraded") {
    items.push({
      id: "admin-platform-incident",
      title: `Platform incident · ${home.monitoring.executionStatus}`,
      reason: "Ops execution needs investigation.",
      href: "/dashboard#insights",
      actionLabel: "Inspect",
      severity: "critical"
    });
  }

  for (const alert of home?.alerts ?? []) {
    items.push({
      id: `admin-alert-${alert.title}`,
      title: alert.title,
      reason: "Compliance or platform alert",
      href: alert.href,
      actionLabel: "Review",
      severity: severityFromPriority(alert.priority)
    });
  }

  for (const task of snapshot.operationalTasks.slice(0, 4)) {
    items.push({
      id: `admin-task-${task.id}`,
      title: task.title,
      reason: task.description,
      href: task.href,
      actionLabel: task.actionLabel,
      severity: task.priority === "high" ? "high" : "normal"
    });
  }

  for (const item of home?.inboxPreview?.slice(0, 2) ?? []) {
    items.push({
      id: `admin-inbox-${item.itemId}`,
      title: item.title,
      reason: "Pending approval or escalation",
      href: item.deepLink ?? "/inbox",
      actionLabel: "Open",
      severity: "high"
    });
  }

  return capAttention(items);
}

function buildAdminMission(
  snapshot: DashboardSnapshot,
  home: CommandCenterHomeComposition | null
): UniversalMissionItem[] {
  const rows: UniversalMissionItem[] = [];
  if (snapshot.propertiesTotal === 0 || snapshot.propertiesWithoutUnits > 0) {
    rows.push({
      id: "admin-mission-activation",
      label: snapshot.propertiesTotal === 0 ? "org awaiting activation" : "properties needing setup",
      count: snapshot.propertiesTotal === 0 ? 1 : snapshot.propertiesWithoutUnits,
      href: "/properties"
    });
  }
  const inbox = home?.inboxUnreadCount ?? 0;
  if (inbox > 0) {
    rows.push({
      id: "mission-inbox",
      label: inbox === 1 ? "support escalation" : "support escalations",
      count: inbox,
      href: "/inbox"
    });
  }
  if (snapshot.migration && (snapshot.migration.activeJobs ?? 0) > 0) {
    rows.push({
      id: "admin-mission-migration",
      label: "migration jobs",
      count: snapshot.migration.activeJobs,
      href: "/migration"
    });
  }
  rows.push({
    id: "admin-mission-team",
    label: "team & invitations",
    count: 1,
    href: "/settings/team"
  });
  rows.push({
    id: "admin-mission-billing",
    label: "subscription actions",
    count: 1,
    href: "/settings/billing"
  });
  return rows.slice(0, 8);
}

function buildAdminQuickActions(
  opsActions: QuickActionDefinition[],
  permissionActions: Array<{ id: string; label: string; href: string }>
): UniversalQuickAction[] {
  const preferred: UniversalQuickAction[] = [
    { id: "admin-create-org-property", label: "Add Property", href: "/properties/new" },
    { id: "admin-invite", label: "Invite Admin", href: "/settings/team" },
    { id: "admin-billing", label: "Billing", href: "/settings/billing" },
    { id: "admin-roles", label: "Roles & Permissions", href: "/settings/team" },
    { id: "admin-settings", label: "Settings", href: "/settings" },
    { id: "admin-support", label: "Support", href: "/inbox" }
  ];
  // Prefer admin catalog; fill remaining slots from entitled ops/permission actions.
  const merged = [...preferred];
  for (const action of buildQuickActions(opsActions, permissionActions)) {
    if (merged.length >= 6) break;
    if (merged.some((m) => m.id === action.id || m.href === action.href)) continue;
    merged.push(action);
  }
  return merged.slice(0, 6);
}

function capAttention(items: UniversalAttentionItem[]): UniversalAttentionItem[] {
  items.sort((a, b) => {
    const rank = { critical: 0, high: 1, normal: 2 } as const;
    return rank[a.severity] - rank[b.severity];
  });
  const seen = new Set<string>();
  const deduped: UniversalAttentionItem[] = [];
  for (const item of items) {
    const key = `${item.title}|${item.href}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
    if (deduped.length >= 5) break;
  }
  return deduped;
}

/** Shared helper for Slice B role builders. */
export function withSurfaceCopy(
  surface: Ux016Surface,
  partial: Omit<UniversalDashboardViewModel, "surface" | "copy">
): UniversalDashboardViewModel {
  const copy = UX016_SURFACE_COPY[surface];
  return {
    surface,
    copy,
    ...partial,
    greeting: {
      ...partial.greeting,
      supportingLine: partial.greeting.supportingLine || copy.supportingLine
    }
  };
}

function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function permissionQuickActionsFromFlags(permissions: {
  canCreateMaintenance: boolean;
  canCreateProperty: boolean;
  canCreateTenant: boolean;
  canCreateLease: boolean;
  canCreateVendor: boolean;
  canCreateCommunication: boolean;
  canCreateFinancial: boolean;
  canCreateApplicant: boolean;
}): Array<{ id: string; label: string; href: string }> {
  const actions: Array<{ id: string; label: string; href: string }> = [];
  if (permissions.canCreateMaintenance) {
    actions.push({ id: "qa-create-wo", label: "Create Work Order", href: "/maintenance/new" });
  }
  if (permissions.canCreateProperty) {
    actions.push({ id: "qa-add-property", label: "Add Property", href: "/properties/new" });
  }
  if (permissions.canCreateTenant) {
    actions.push({ id: "qa-invite-resident", label: "Invite Resident", href: "/tenants/new" });
  }
  if (permissions.canCreateLease) {
    actions.push({ id: "qa-create-lease", label: "Create Lease", href: "/leases/new" });
  }
  if (permissions.canCreateVendor) {
    actions.push({ id: "qa-create-vendor", label: "Create Vendor", href: "/vendors/new" });
  }
  if (permissions.canCreateApplicant) {
    actions.push({ id: "qa-new-applicant", label: "Add Applicant", href: "/applicants/new" });
  }
  if (permissions.canCreateCommunication) {
    actions.push({ id: "qa-announce", label: "New Announcement", href: "/communications/new" });
  }
  if (permissions.canCreateFinancial) {
    actions.push({ id: "qa-record-payment", label: "Record Payment", href: "/financials/payments/new" });
  }
  return actions;
}
