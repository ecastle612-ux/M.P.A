/**
 * CORE-004 Phase 4 — Resident Command Centers (STD-001 UDF).
 * Staff home + calm resident portal home.
 */

import type { TenantListItem } from "../tenant/server";
import {
  isResidentWorkflowStage,
  primaryNextResidentStage,
  RESIDENT_WORKFLOW_DEFINITIONS,
  toResidentWorkflowLabel,
  type ResidentWorkflowStage
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

function stageOf(tenant: TenantListItem): ResidentWorkflowStage {
  return isResidentWorkflowStage(tenant.workflowStage)
    ? tenant.workflowStage
    : "applicant";
}

export function buildResidentCommandCenterViewModel(input: {
  tenants: TenantListItem[];
  canCreate: boolean;
  userName?: string | null;
  organizationName?: string | null;
}): UniversalDashboardViewModel {
  const active = input.tenants.filter((tenant) => {
    const stage = stageOf(tenant);
    return stage !== "archive" && stage !== "former_resident";
  });
  const moveIns = active.filter((tenant) =>
    ["lease_signed", "move_in_scheduled", "move_in_complete"].includes(stageOf(tenant))
  );
  const renewals = active.filter((tenant) => stageOf(tenant) === "renewal");
  const moveOuts = active.filter((tenant) => stageOf(tenant) === "move_out_scheduled");
  const maintenanceFocus = active.filter((tenant) => stageOf(tenant) === "maintenance");
  const paymentsFocus = active.filter((tenant) => stageOf(tenant) === "payments");

  const attention: UniversalAttentionItem[] = [];
  if (moveIns.length > 0) {
    attention.push({
      id: "res-move-in",
      title: "Move-ins in progress",
      reason: `${moveIns.length} resident${moveIns.length === 1 ? "" : "s"} preparing to move in`,
      href: `/tenants/${moveIns[0]!.id}`,
      actionLabel: "Open",
      severity: "high"
    });
  }
  if (paymentsFocus.length > 0) {
    attention.push({
      id: "res-payments",
      title: "Payments focus",
      reason: `${paymentsFocus.length} resident${paymentsFocus.length === 1 ? "" : "s"} need payment attention`,
      href: `/tenants/${paymentsFocus[0]!.id}`,
      actionLabel: "Review",
      severity: "critical"
    });
  }
  if (maintenanceFocus.length > 0) {
    attention.push({
      id: "res-maintenance",
      title: "Maintenance focus",
      reason: `${maintenanceFocus.length} with open maintenance focus`,
      href: `/tenants/${maintenanceFocus[0]!.id}`,
      actionLabel: "Open",
      severity: "high"
    });
  }
  if (renewals.length > 0 || moveOuts.length > 0) {
    attention.push({
      id: "res-renewal-moveout",
      title: "Renewals & move-outs",
      reason: `${renewals.length} renewal · ${moveOuts.length} move-out`,
      href: renewals[0] ? `/tenants/${renewals[0].id}` : `/tenants/${moveOuts[0]!.id}`,
      actionLabel: "Open",
      severity: "normal"
    });
  }

  const waitingOnMe: AssistantWaitingItem[] = [];
  for (const tenant of [...moveIns, ...renewals, ...moveOuts, ...paymentsFocus].slice(0, 8)) {
    const stage = stageOf(tenant);
    const def = RESIDENT_WORKFLOW_DEFINITIONS[stage];
    const next = primaryNextResidentStage(stage);
    waitingOnMe.push({
      id: `me-${tenant.id}`,
      label: `${tenant.firstName} ${tenant.lastName}`.trim(),
      detail:
        def.waitingOnMe[0] ??
        `${toResidentWorkflowLabel(stage)}${next ? ` → ${toResidentWorkflowLabel(next)}` : ""}`,
      href: `/tenants/${tenant.id}`
    });
  }

  const waitingOnOthers: AssistantWaitingItem[] = moveIns
    .map((tenant) => ({
      id: `other-${tenant.id}`,
      label: `${tenant.firstName} ${tenant.lastName}`.trim(),
      detail: "Waiting on resident move-in tasks",
      href: `/tenants/${tenant.id}`
    }))
    .slice(0, 6);

  const mission: UniversalMissionItem[] = [
    { id: "m-active", label: "active residents", count: active.length, href: "/tenants" },
    { id: "m-move-in", label: "move-ins", count: moveIns.length, href: "/tenants" },
    { id: "m-renewal", label: "renewals", count: renewals.length, href: "/tenants" },
    { id: "m-move-out", label: "move-outs", count: moveOuts.length, href: "/tenants" }
  ];

  const quickActions: UniversalQuickAction[] = [];
  if (input.canCreate) {
    quickActions.push({ id: "qa-new", label: "New resident", href: "/tenants/new" });
  }
  quickActions.push(
    { id: "qa-move-in", label: "Move-in", href: "/residents/move-in" },
    { id: "qa-leases", label: "Leasing", href: "/leases" },
    { id: "qa-maintenance", label: "Maintenance", href: "/maintenance" }
  );

  const recentActivity: UniversalActivityItem[] = active.slice(0, 8).map((tenant) => ({
    id: tenant.id,
    summary: `${tenant.firstName} ${tenant.lastName}`.trim(),
    meta: `${toResidentWorkflowLabel(stageOf(tenant))} · ${tenant.propertyName ?? "Unassigned"}`,
    href: `/tenants/${tenant.id}`
  }));

  const insights: UniversalInsightItem[] = [
    { id: "i-active", label: "Active", value: String(active.length), href: "/tenants" },
    { id: "i-move-in", label: "Move-in", value: String(moveIns.length), href: "/tenants" },
    { id: "i-pay", label: "Payments", value: String(paymentsFocus.length), href: "/tenants" },
    { id: "i-maint", label: "Maintenance", value: String(maintenanceFocus.length), href: "/tenants" }
  ];

  return assembleUniversalHome({
    surfaceLabel: "Resident Operations",
    timeGreeting: timeGreetingFromNow(),
    userName: input.userName ?? null,
    organizationName: input.organizationName ?? null,
    placeLabel: "Residents",
    dateLabel: dateLabelFromNow(),
    supportingLine: "One resident identity · leasing through archive",
    attention,
    mission,
    quickActions,
    recentActivity,
    insights,
    waitingOnMe,
    waitingOnOthers
  });
}

export type ResidentPortalAttention = {
  id: string;
  title: string;
  body: string;
  href: string;
  critical: boolean;
  unread: boolean;
  timeSensitive: boolean;
};

export type ResidentPortalTodayCard = {
  id: string;
  title: string;
  description: string;
  href: string;
};

/** Calm resident portal home on STD-001 UDF. */
export function buildResidentPortalViewModel(input: {
  firstName: string;
  propertyName: string | null;
  unitNumber: string | null;
  hasLinkedTenant: boolean;
  workflowStage?: ResidentWorkflowStage | null;
  attentionItems: ResidentPortalAttention[];
  todayCards: ResidentPortalTodayCard[];
  balanceDue?: number | null;
  openMaintenanceCount?: number;
}): UniversalDashboardViewModel {
  const stage = input.workflowStage ?? "active_resident";
  const def = RESIDENT_WORKFLOW_DEFINITIONS[stage];

  const attention: UniversalAttentionItem[] = input.attentionItems.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.title,
    reason: item.body,
    href: item.href,
    actionLabel: "Open",
    severity: item.critical ? "critical" : item.timeSensitive ? "high" : "normal"
  }));

  if ((input.balanceDue ?? 0) > 0 && !attention.some((item) => item.id.includes("balance"))) {
    attention.unshift({
      id: "portal-balance",
      title: "Balance due",
      reason: `$${Number(input.balanceDue).toFixed(2)} outstanding`,
      href: "/portal/tenant/payments",
      actionLabel: "Pay",
      severity: "critical"
    });
  }

  const waitingOnMe: AssistantWaitingItem[] = input.todayCards.slice(0, 6).map((card) => ({
    id: `today-${card.id}`,
    label: card.title,
    detail: card.description,
    href: card.href
  }));

  if (def.waitingOnMe[0] && input.hasLinkedTenant) {
    waitingOnMe.unshift({
      id: "stage-wait",
      label: def.waitingOnMe[0],
      detail: def.assistantRecommendations[0] ?? def.exitCriteria[0] ?? "Continue residency",
      href: "/portal/tenant"
    });
  }

  const mission: UniversalMissionItem[] = [
    {
      id: "m-today",
      label: "today's items",
      count: input.todayCards.length,
      href: "/portal/tenant"
    },
    {
      id: "m-maint",
      label: "maintenance",
      count: input.openMaintenanceCount ?? 0,
      href: "/portal/tenant/maintenance"
    },
    {
      id: "m-pay",
      label: "payments",
      count: (input.balanceDue ?? 0) > 0 ? 1 : 0,
      href: "/portal/tenant/payments"
    }
  ];

  const quickActions: UniversalQuickAction[] = [
    { id: "qa-pay", label: "Pay rent", href: "/portal/tenant/payments" },
    { id: "qa-maint", label: "Maintenance", href: "/portal/tenant/maintenance" },
    { id: "qa-msg", label: "Messages", href: "/portal/tenant/messages" },
    { id: "qa-docs", label: "Documents", href: "/portal/tenant/documents" },
    { id: "qa-community", label: "Community", href: "/portal/tenant/community" },
    { id: "qa-more", label: "More", href: "/portal/tenant/more" }
  ];

  const recentActivity: UniversalActivityItem[] = input.todayCards.slice(0, 6).map((card) => ({
    id: card.id,
    summary: card.title,
    meta: card.description,
    href: card.href
  }));

  const place =
    input.propertyName && input.unitNumber
      ? `${input.propertyName} · Unit ${input.unitNumber}`
      : input.propertyName ?? "Your home";

  const insights: UniversalInsightItem[] = [
    {
      id: "i-stage",
      label: "Status",
      value: def.label,
      href: "/portal/tenant"
    },
    {
      id: "i-attention",
      label: "For you",
      value: String(input.attentionItems.length),
      href: "/portal/tenant/announcements"
    },
    {
      id: "i-maint",
      label: "Open work",
      value: String(input.openMaintenanceCount ?? 0),
      href: "/portal/tenant/maintenance"
    },
    {
      id: "i-balance",
      label: "Balance",
      value: (input.balanceDue ?? 0) > 0 ? `$${Number(input.balanceDue).toFixed(0)}` : "Clear",
      href: "/portal/tenant/payments"
    }
  ];

  return assembleUniversalHome({
    surfaceLabel: "Resident Home",
    timeGreeting: timeGreetingFromNow(),
    userName: input.firstName,
    organizationName: null,
    placeLabel: place,
    dateLabel: dateLabelFromNow(),
    supportingLine: input.hasLinkedTenant
      ? "A calm place for what needs you today."
      : "Link your resident profile to unlock your home.",
    attention,
    mission,
    quickActions,
    recentActivity,
    insights,
    waitingOnMe,
    waitingOnOthers: []
  });
}
