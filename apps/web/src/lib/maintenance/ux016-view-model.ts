/**
 * STD-001 operational remediation — map maintenance queue signals → Universal Dashboard Framework.
 * Presentation only. /maintenance remains the route; WorkOrdersTable stays the queue below.
 */

import type { WorkOrderListItem } from "./server";
import type {
  UniversalActivityItem,
  UniversalAttentionItem,
  UniversalDashboardViewModel,
  UniversalInsightItem,
  UniversalMissionItem,
  UniversalQuickAction
} from "../dashboard/ux016-view-model";
import type { AssistantWaitingItem } from "../dashboard/ux016-assistant";
import {
  assembleUniversalHome,
  dateLabelFromNow,
  timeGreetingFromNow
} from "../std001/assemble-universal-home";

const OPEN_STATUSES = new Set([
  "submitted",
  "triaged",
  "assigned",
  "in_progress",
  "vendor_on_site",
  "awaiting_approval",
  "on_hold"
]);

function isOverdue(item: WorkOrderListItem): boolean {
  if (!item.dueDate) return false;
  if (item.status === "completed" || item.status === "cancelled") return false;
  return item.dueDate.slice(0, 10) < new Date().toISOString().slice(0, 10);
}

function pushAttention(items: UniversalAttentionItem[], item: UniversalAttentionItem) {
  if (items.length >= 5) return;
  items.push(item);
}

export function buildMaintenanceUniversalDashboardViewModel(input: {
  items: WorkOrderListItem[];
  canCreate: boolean;
  userName?: string | null;
  organizationName?: string | null;
  timeGreeting?: string;
  dateLabel?: string;
}): UniversalDashboardViewModel {
  const visible = input.items.filter((item) => !item.deletedAt && !item.archivedAt);
  const open = visible.filter((item) => OPEN_STATUSES.has(item.status));
  const emergency = open.filter((item) => item.priority === "emergency");
  const high = open.filter((item) => item.priority === "high");
  const overdue = open.filter((item) => isOverdue(item));
  const awaitingApproval = open.filter((item) => item.status === "awaiting_approval");
  const onHold = open.filter((item) => item.status === "on_hold");
  const unassigned = open.filter((item) => !item.assignedToUserId);

  const attention: UniversalAttentionItem[] = [];

  if (emergency.length > 0) {
    pushAttention(attention, {
      id: "maint-emergency",
      title: "Emergency work orders",
      reason: `${emergency.length} emergency item${emergency.length === 1 ? "" : "s"} open`,
      href: "/maintenance?priority=emergency",
      actionLabel: "Open emergencies",
      severity: "critical"
    });
  }
  if (overdue.length > 0) {
    pushAttention(attention, {
      id: "maint-overdue",
      title: "Overdue work orders",
      reason: `${overdue.length} past due`,
      href: "/maintenance?status=open",
      actionLabel: "Review overdue",
      severity: "critical"
    });
  }
  if (high.length > 0) {
    pushAttention(attention, {
      id: "maint-high",
      title: "High-priority maintenance",
      reason: `${high.length} high-priority open`,
      href: "/maintenance?priority=high",
      actionLabel: "Review high priority",
      severity: "high"
    });
  }
  if (awaitingApproval.length > 0) {
    pushAttention(attention, {
      id: "maint-approval",
      title: "Awaiting approval",
      reason: `${awaitingApproval.length} work order${awaitingApproval.length === 1 ? "" : "s"} blocked on approval`,
      href: "/maintenance?status=awaiting_approval",
      actionLabel: "Review approvals",
      severity: "high"
    });
  }
  if (unassigned.length > 0) {
    pushAttention(attention, {
      id: "maint-unassigned",
      title: "Unassigned open work",
      reason: `${unassigned.length} open without an assignee`,
      href: "/maintenance?status=open",
      actionLabel: "Assign work",
      severity: "normal"
    });
  }

  const mission: UniversalMissionItem[] = [];
  if (open.length > 0) {
    mission.push({ id: "mission-open", label: "open work orders", count: open.length, href: "/maintenance?status=open" });
  }
  if (overdue.length > 0) {
    mission.push({ id: "mission-overdue", label: "overdue", count: overdue.length, href: "/maintenance?status=open" });
  }
  if (emergency.length + high.length > 0) {
    mission.push({
      id: "mission-priority",
      label: "high / emergency",
      count: emergency.length + high.length,
      href: "/maintenance"
    });
  }
  if (awaitingApproval.length > 0) {
    mission.push({
      id: "mission-approval",
      label: "awaiting approval",
      count: awaitingApproval.length,
      href: "/maintenance?status=awaiting_approval"
    });
  }
  if (onHold.length > 0) {
    mission.push({
      id: "mission-hold",
      label: "on hold",
      count: onHold.length,
      href: "/maintenance?status=on_hold"
    });
  }

  const waitingOnMe: AssistantWaitingItem[] = [];
  if (awaitingApproval.length > 0) {
    waitingOnMe.push({
      id: "wait-me-approval",
      label: "Approvals",
      detail: `${awaitingApproval.length} waiting on you`,
      href: "/maintenance?status=awaiting_approval"
    });
  }
  if (unassigned.length > 0) {
    waitingOnMe.push({
      id: "wait-me-assign",
      label: "Unassigned work",
      detail: "Assign or pick up open orders",
      href: "/maintenance?status=open"
    });
  }

  const waitingOnOthers: AssistantWaitingItem[] = [];
  if (onHold.length > 0) {
    waitingOnOthers.push({
      id: "wait-others-hold",
      label: "On hold",
      detail: `${onHold.length} waiting on parts, vendor, or resident`,
      href: "/maintenance?status=on_hold"
    });
  }

  const quickActions: UniversalQuickAction[] = [
    ...(input.canCreate ? [{ id: "qa-new-wo", label: "Create work order", href: "/maintenance/new" }] : []),
    { id: "qa-open", label: "Open queue", href: "/maintenance?status=open" },
    { id: "qa-facility", label: "Facility hub", href: "/facility" },
    { id: "qa-vendors", label: "Vendors", href: "/vendors" },
    { id: "qa-properties", label: "Properties", href: "/properties" }
  ];

  const recentActivity: UniversalActivityItem[] = visible
    .slice()
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 8)
    .map((item) => ({
      id: `act-${item.id}`,
      summary: item.title,
      meta: [item.workOrderNumber, item.propertyName, item.priority].filter(Boolean).join(" · "),
      href: `/maintenance/${item.id}`
    }));

  const insights: UniversalInsightItem[] = [
    { id: "insight-open", label: "Open", value: String(open.length), href: "/maintenance?status=open" },
    { id: "insight-emergency", label: "Emergency", value: String(emergency.length), href: "/maintenance?priority=emergency" },
    { id: "insight-overdue", label: "Overdue", value: String(overdue.length), href: "/maintenance?status=open" },
    { id: "insight-unassigned", label: "Unassigned", value: String(unassigned.length), href: "/maintenance?status=open" }
  ];

  return assembleUniversalHome({
    surfaceLabel: "Maintenance Home",
    timeGreeting: input.timeGreeting ?? timeGreetingFromNow(),
    userName: input.userName ?? null,
    organizationName: input.organizationName ?? null,
    placeLabel: attention.length > 0 ? "Maintenance queue needs attention" : "Maintenance queue",
    dateLabel: input.dateLabel ?? dateLabelFromNow(),
    supportingLine: "Here’s your maintenance operational briefing — the work queue follows below.",
    attention: attention.slice(0, 5),
    mission: mission.slice(0, 8),
    quickActions: quickActions.slice(0, 6),
    recentActivity,
    insights,
    waitingOnMe,
    waitingOnOthers
  });
}
