/**
 * UX-016 Slice A — map existing dashboard / Command Center signals into the
 * Universal Dashboard Framework view model. Presentation only; no new APIs.
 */

import type { DashboardSnapshot } from "./server";
import type { CommandCenterHomeComposition } from "../ops/command-center-home";
import type { QuickActionDefinition } from "../ops/quick-actions";
import {
  buildMpaAssistantViewModel,
  type MpaAssistantViewModel
} from "./ux016-assistant";

export type { MpaAssistantViewModel } from "./ux016-assistant";

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
  greeting: {
    /** Optional surface eyebrow (defaults to Operations in the framework shell) */
    surfaceLabel?: string;
    timeGreeting: string;
    userName: string | null;
    organizationName: string | null;
    placeLabel: string;
    dateLabel: string;
    statusSummary: string;
    supportingLine: string;
  };
  /** UX-016 Slice D — M.P.A. Assistant briefing + waiting + recommendations */
  assistant: MpaAssistantViewModel;
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

function statusSummary(attentionCount: number, missionTotal: number): string {
  if (attentionCount > 0) {
    return attentionCount === 1
      ? "1 item needs attention"
      : `${attentionCount} items need attention`;
  }
  if (missionTotal > 0) {
    return `${missionTotal} items in today’s mission`;
  }
  return "You’re clear for now";
}

export function buildUniversalDashboardViewModel(input: {
  timeGreeting: string;
  userGreetingName: string | null;
  organizationName: string | null;
  dateLabel: string;
  snapshot: DashboardSnapshot;
  commandCenterHome: CommandCenterHomeComposition | null;
  permissionQuickActions?: Array<{ id: string; label: string; href: string }>;
}): UniversalDashboardViewModel {
  const { snapshot, commandCenterHome } = input;
  const attention = buildAttention(snapshot, commandCenterHome);
  const mission = buildMission(snapshot, commandCenterHome);
  const missionTotal = mission.reduce((sum, row) => sum + row.count, 0);
  const quickActions = buildQuickActions(commandCenterHome?.quickActions ?? [], input.permissionQuickActions ?? []);
  const recentActivity = buildRecentActivity(snapshot, commandCenterHome);
  const insights = buildInsights(snapshot, commandCenterHome);

  const assistant = buildMpaAssistantViewModel({
    snapshot,
    commandCenterHome,
    attention,
    mission,
    recentActivity,
    insights
  });

  return {
    greeting: {
      timeGreeting: input.timeGreeting,
      userName: input.userGreetingName,
      organizationName: input.organizationName,
      placeLabel: placeLabelFromSnapshot(snapshot),
      dateLabel: input.dateLabel,
      statusSummary: statusSummary(attention.length, missionTotal),
      supportingLine: "Here’s your operational briefing."
    },
    assistant,
    attention,
    mission,
    quickActions,
    recentActivity: assistant.operationalTimeline.length
      ? assistant.operationalTimeline
      : recentActivity,
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
