/**
 * CORE-004 Phase 2 — Maintenance Operations Command Center (STD-001 UDF).
 */

import type { WorkOrderListItem } from "./server";
import {
  MAINTENANCE_WORKFLOW_DEFINITIONS,
  primaryNextMaintenanceStage,
  toMaintenanceWorkflowLabel,
  type MaintenanceWorkflowStage
} from "./workflow";
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

export function buildMaintenanceCommandCenterViewModel(input: {
  items: WorkOrderListItem[];
  canCreate: boolean;
  canAssign: boolean;
  userName?: string | null;
  organizationName?: string | null;
}): UniversalDashboardViewModel {
  const open = input.items.filter(
    (item) => item.workflowStage !== "completion" && item.workflowStage !== "analytics"
  );
  const emergency = open.filter((item) => item.priority === "emergency");
  const overdue = open.filter((item) => {
    if (!item.dueDate) return false;
    return item.dueDate < new Date().toISOString().slice(0, 10);
  });
  const waitingVendor = open.filter((item) => item.workflowStage === "vendor_escalation");
  const waitingResident = open.filter((item) => item.workflowStage === "resident_confirmation");
  const waitingApproval = open.filter((item) => item.workflowStage === "quality_review");
  const waitingParts = open.filter(
    (item) =>
      item.status === "on_hold" ||
      (typeof item.metadata?.["partsRequired"] === "boolean" && item.metadata["partsRequired"])
  );
  const todays = open.filter((item) => {
    if (!item.dueDate) return false;
    return item.dueDate === new Date().toISOString().slice(0, 10);
  });

  const attention: UniversalAttentionItem[] = [];
  if (emergency.length > 0) {
    attention.push({
      id: "maint-emergency",
      title: "Emergency work",
      reason: `${emergency.length} emergency work order${emergency.length === 1 ? "" : "s"}`,
      href: `/maintenance/${emergency[0]!.id}`,
      actionLabel: "Open",
      severity: "critical"
    });
  }
  if (overdue.length > 0) {
    attention.push({
      id: "maint-overdue",
      title: "Overdue work",
      reason: `${overdue.length} past due`,
      href: "/maintenance?status=open",
      actionLabel: "Review",
      severity: "critical"
    });
  }
  if (waitingVendor.length > 0) {
    attention.push({
      id: "maint-vendor",
      title: "Waiting for vendor",
      reason: `${waitingVendor.length} escalated`,
      href: `/maintenance/${waitingVendor[0]!.id}`,
      actionLabel: "Follow up",
      severity: "high"
    });
  }
  if (waitingResident.length > 0) {
    attention.push({
      id: "maint-resident",
      title: "Waiting for resident",
      reason: `${waitingResident.length} confirmation${waitingResident.length === 1 ? "" : "s"}`,
      href: `/maintenance/${waitingResident[0]!.id}`,
      actionLabel: "Follow up",
      severity: "high"
    });
  }
  if (waitingApproval.length > 0) {
    attention.push({
      id: "maint-approval",
      title: "Waiting for approval",
      reason: `${waitingApproval.length} in quality review`,
      href: `/maintenance/${waitingApproval[0]!.id}`,
      actionLabel: "Review",
      severity: "normal"
    });
  }
  if (waitingParts.length > 0) {
    attention.push({
      id: "maint-parts",
      title: "Waiting for parts",
      reason: `${waitingParts.length} held for parts`,
      href: `/maintenance/${waitingParts[0]!.id}`,
      actionLabel: "Review",
      severity: "normal"
    });
  }

  const waitingOnMe: AssistantWaitingItem[] = [];
  for (const item of [...emergency, ...overdue, ...waitingApproval].slice(0, 6)) {
    const next = primaryNextMaintenanceStage(item.workflowStage);
    waitingOnMe.push({
      id: `me-${item.id}`,
      label: item.workOrderNumber,
      detail: `${toMaintenanceWorkflowLabel(item.workflowStage)}${next ? ` → ${toMaintenanceWorkflowLabel(next)}` : ""}`,
      href: `/maintenance/${item.id}`
    });
  }

  const waitingOnOthers: AssistantWaitingItem[] = [
    ...waitingVendor.map((item) => ({
      id: `other-v-${item.id}`,
      label: item.workOrderNumber,
      detail: "Waiting for vendor",
      href: `/maintenance/${item.id}`
    })),
    ...waitingResident.map((item) => ({
      id: `other-r-${item.id}`,
      label: item.workOrderNumber,
      detail: "Waiting for resident confirmation",
      href: `/maintenance/${item.id}`
    }))
  ].slice(0, 6);

  const mission: UniversalMissionItem[] = [
    { id: "m-today", label: "today's work", count: todays.length, href: "/maintenance?status=open" },
    { id: "m-open", label: "open work orders", count: open.length, href: "/maintenance?status=open" },
    { id: "m-emergency", label: "emergency", count: emergency.length, href: "/maintenance?priority=emergency" }
  ];

  const quickActions: UniversalQuickAction[] = [];
  if (input.canCreate) {
    quickActions.push({ id: "qa-new", label: "New request", href: "/maintenance/new" });
  }
  if (input.canAssign) {
    quickActions.push({ id: "qa-assign", label: "Open queue", href: "/maintenance?status=open" });
  }
  quickActions.push(
    { id: "qa-facility", label: "Technician hub", href: "/facility" },
    { id: "qa-vendors", label: "Vendors", href: "/vendors" }
  );

  const recentActivity: UniversalActivityItem[] = open.slice(0, 8).map((item) => ({
    id: item.id,
    summary: `${item.workOrderNumber} · ${item.title}`,
    meta: `${toMaintenanceWorkflowLabel(item.workflowStage)} · ${item.priority}`,
    href: `/maintenance/${item.id}`
  }));

  const byStage = open.reduce(
    (acc, item) => {
      acc[item.workflowStage] = (acc[item.workflowStage] ?? 0) + 1;
      return acc;
    },
    {} as Partial<Record<MaintenanceWorkflowStage, number>>
  );

  const insights: UniversalInsightItem[] = [
    { id: "i-open", label: "Open", value: String(open.length), href: "/maintenance" },
    { id: "i-emergency", label: "Emergency", value: String(emergency.length), href: "/maintenance" },
    {
      id: "i-field",
      label: "Field",
      value: String(byStage.field_execution ?? 0),
      href: "/maintenance"
    },
    {
      id: "i-vendor",
      label: "Vendor",
      value: String(byStage.vendor_escalation ?? 0),
      href: "/maintenance"
    }
  ];

  // Seed recommended next action via Assistant from stage definitions
  void MAINTENANCE_WORKFLOW_DEFINITIONS;

  return assembleUniversalHome({
    surfaceLabel: "Maintenance Operations",
    timeGreeting: timeGreetingFromNow(),
    userName: input.userName ?? null,
    organizationName: input.organizationName ?? null,
    placeLabel: "Work orders",
    dateLabel: dateLabelFromNow(),
    supportingLine: "Canonical maintenance workflow · request through analytics",
    attention,
    mission,
    quickActions,
    recentActivity,
    insights,
    waitingOnMe,
    waitingOnOthers
  });
}

export function buildWorkOrderCommandCenterViewModel(input: {
  workOrder: WorkOrderListItem;
  canUpdate: boolean;
  recentWorkflow: Array<{
    id: string;
    fromStage: MaintenanceWorkflowStage | null;
    toStage: MaintenanceWorkflowStage;
    createdAt: string;
    reason: string | null;
  }>;
  userName?: string | null;
}): UniversalDashboardViewModel {
  const wo = input.workOrder;
  const stage = wo.workflowStage;
  const def = MAINTENANCE_WORKFLOW_DEFINITIONS[stage];
  const next = primaryNextMaintenanceStage(stage);
  const base = `/maintenance/${wo.id}`;

  const attention: UniversalAttentionItem[] = [
    {
      id: "wo-stage",
      title: `${def.label} in progress`,
      reason: def.exitCriteria[0] ?? "Advance workflow",
      href: base,
      actionLabel: next ? `Advance to ${toMaintenanceWorkflowLabel(next)}` : "Review",
      severity: wo.priority === "emergency" ? "critical" : "high"
    }
  ];

  const waitingOnMe: AssistantWaitingItem[] = def.waitingOnMe.map((label, index) => ({
    id: `wo-me-${index}`,
    label,
    detail: def.assistantRecommendations[0] ?? def.label,
    href: base
  }));
  const waitingOnOthers: AssistantWaitingItem[] = def.waitingOnOthers.map((label, index) => ({
    id: `wo-other-${index}`,
    label,
    detail: wo.workOrderNumber,
    href: base
  }));

  const mission: UniversalMissionItem[] = [
    {
      id: "wo-mission",
      label: def.label.toLowerCase(),
      count: 1,
      href: base
    }
  ];

  const quickActions: UniversalQuickAction[] = [
    { id: "qa-property", label: "Property Command Center", href: `/properties/${wo.propertyId}` },
    { id: "qa-edit", label: "Edit work order", href: `/maintenance/${wo.id}/edit` }
  ];
  if (input.canUpdate && next) {
    quickActions.unshift({
      id: "qa-advance",
      label: `Advance to ${toMaintenanceWorkflowLabel(next)}`,
      href: `${base}?workflowAction=advance`
    });
  }

  const recentActivity: UniversalActivityItem[] = input.recentWorkflow.slice(0, 8).map((event) => ({
    id: event.id,
    summary: event.fromStage
      ? `${toMaintenanceWorkflowLabel(event.fromStage)} → ${toMaintenanceWorkflowLabel(event.toStage)}`
      : `Entered ${toMaintenanceWorkflowLabel(event.toStage)}`,
    meta: event.reason ?? "Workflow transition",
    href: base
  }));

  const insights: UniversalInsightItem[] = [
    { id: "i-stage", label: "Stage", value: def.label, href: base },
    { id: "i-priority", label: "Priority", value: wo.priority, href: base },
    { id: "i-category", label: "Category", value: wo.category, href: base }
  ];

  return assembleUniversalHome({
    surfaceLabel: "Work Order Command Center",
    timeGreeting: timeGreetingFromNow(),
    userName: input.userName ?? null,
    organizationName: null,
    placeLabel: wo.workOrderNumber,
    dateLabel: dateLabelFromNow(),
    supportingLine: `${wo.title} · ${wo.propertyName ?? "Property"}`,
    attention,
    mission,
    quickActions,
    recentActivity,
    insights,
    waitingOnMe,
    waitingOnOthers
  });
}
