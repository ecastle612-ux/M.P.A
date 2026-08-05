/**
 * STD-001 operational remediation — map Facility technician buckets → Universal Dashboard Framework.
 * Presentation only. Removes parallel dashboard hero; tools remain below.
 */

import type { TechnicianDashboardBuckets } from "./technician-dashboard";
import type { WorkOrderListItem } from "../maintenance/server";
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

function pushAttention(items: UniversalAttentionItem[], item: UniversalAttentionItem) {
  if (items.length >= 5) return;
  items.push(item);
}

function toAttentionFromWorkOrder(
  item: WorkOrderListItem,
  severity: UniversalAttentionItem["severity"]
): UniversalAttentionItem {
  return {
    id: `fac-${item.id}`,
    title: item.title,
    reason: [item.workOrderNumber, item.propertyName, item.unitNumber ? `Unit ${item.unitNumber}` : null]
      .filter(Boolean)
      .join(" · "),
    href: `/maintenance/${item.id}`,
    actionLabel: "Open job",
    severity
  };
}

export function buildFacilityUniversalDashboardViewModel(input: {
  buckets: TechnicianDashboardBuckets;
  canCreateWorkOrder: boolean;
  canWriteInventory: boolean;
  userName?: string | null;
  organizationName?: string | null;
  timeGreeting?: string;
  dateLabel?: string;
}): UniversalDashboardViewModel {
  const { buckets } = input;
  const attention: UniversalAttentionItem[] = [];

  for (const item of buckets.overdue.slice(0, 3)) {
    pushAttention(attention, toAttentionFromWorkOrder(item, item.priority === "emergency" ? "critical" : "critical"));
  }
  for (const item of buckets.today.slice(0, 3)) {
    pushAttention(
      attention,
      toAttentionFromWorkOrder(item, item.priority === "emergency" || item.priority === "high" ? "high" : "normal")
    );
  }
  for (const item of buckets.waiting.slice(0, 2)) {
    pushAttention(attention, toAttentionFromWorkOrder(item, "normal"));
  }
  if (buckets.unassignedPool.length > 0 && attention.length < 5) {
    pushAttention(attention, {
      id: "fac-unassigned-pool",
      title: "Unassigned open pool",
      reason: `${buckets.unassignedPool.length} open job${buckets.unassignedPool.length === 1 ? "" : "s"} available`,
      href: "/maintenance?status=open",
      actionLabel: "Browse pool",
      severity: "normal"
    });
  }

  const mission: UniversalMissionItem[] = [];
  if (buckets.today.length > 0) {
    mission.push({ id: "mission-today", label: "due today", count: buckets.today.length, href: "/facility" });
  }
  if (buckets.overdue.length > 0) {
    mission.push({ id: "mission-overdue", label: "overdue", count: buckets.overdue.length, href: "/facility" });
  }
  if (buckets.waiting.length > 0) {
    mission.push({ id: "mission-waiting", label: "waiting", count: buckets.waiting.length, href: "/facility" });
  }
  if (buckets.unassignedPool.length > 0) {
    mission.push({
      id: "mission-pool",
      label: "unassigned pool",
      count: buckets.unassignedPool.length,
      href: "/maintenance?status=open"
    });
  }

  const waitingOnMe: AssistantWaitingItem[] = [];
  if (buckets.overdue.length > 0) {
    waitingOnMe.push({
      id: "wait-me-overdue",
      label: "Overdue jobs",
      detail: `${buckets.overdue.length} assigned to you`,
      href: "/facility"
    });
  }
  if (buckets.today.length > 0) {
    waitingOnMe.push({
      id: "wait-me-today",
      label: "Today’s jobs",
      detail: `${buckets.today.length} on your board`,
      href: "/facility"
    });
  }

  const waitingOnOthers: AssistantWaitingItem[] = [];
  if (buckets.waiting.length > 0) {
    waitingOnOthers.push({
      id: "wait-others-parts",
      label: "Waiting on parts / approval",
      detail: `${buckets.waiting.length} held jobs`,
      href: "/facility"
    });
  }

  const quickActions: UniversalQuickAction[] = [
    ...(input.canCreateWorkOrder
      ? [{ id: "qa-new-wo", label: "New work order", href: "/maintenance/new" }]
      : []),
    { id: "qa-queue", label: "Maintenance queue", href: "/maintenance" },
    { id: "qa-inventory", label: "Inventory", href: "/facility/inventory" },
    { id: "qa-calendar", label: "Calendar", href: "/facility/calendar" },
    ...(input.canWriteInventory
      ? [{ id: "qa-add-inv", label: "Add inventory", href: "/facility/inventory/new" }]
      : []),
    { id: "qa-vendors", label: "Vendors", href: "/vendors" }
  ];

  const recentActivity: UniversalActivityItem[] = [
    ...buckets.overdue,
    ...buckets.today,
    ...buckets.waiting
  ]
    .slice(0, 8)
    .map((item) => ({
      id: `act-${item.id}`,
      summary: item.title,
      meta: [item.workOrderNumber, item.status, item.priority].join(" · "),
      href: `/maintenance/${item.id}`
    }));

  const insights: UniversalInsightItem[] = [
    { id: "insight-today", label: "Today", value: String(buckets.today.length), href: "/facility" },
    { id: "insight-overdue", label: "Overdue", value: String(buckets.overdue.length), href: "/facility" },
    { id: "insight-waiting", label: "Waiting", value: String(buckets.waiting.length), href: "/facility" },
    {
      id: "insight-pool",
      label: "Unassigned pool",
      value: String(buckets.unassignedPool.length),
      href: "/maintenance?status=open"
    }
  ];

  return assembleUniversalHome({
    surfaceLabel: "Facility Operations",
    timeGreeting: input.timeGreeting ?? timeGreetingFromNow(),
    userName: input.userName ?? null,
    organizationName: input.organizationName ?? null,
    placeLabel:
      buckets.overdue.length > 0
        ? "Overdue work needs you first"
        : buckets.today.length > 0
          ? "Jobs lined up for today"
          : "Facility operations",
    dateLabel: input.dateLabel ?? dateLabelFromNow(),
    supportingLine: "Here’s your facility operational briefing — boards and tools follow below.",
    attention: attention.slice(0, 5),
    mission: mission.slice(0, 8),
    quickActions: quickActions.slice(0, 6),
    recentActivity,
    insights,
    waitingOnMe,
    waitingOnOthers
  });
}
