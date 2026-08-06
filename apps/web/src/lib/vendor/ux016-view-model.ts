/**
 * CORE-004 Phase 5 — Vendor Operations Command Center (STD-001 UDF).
 */

import type { VendorRecord } from "./contracts";
import {
  isVendorWorkflowStage,
  primaryNextVendorStage,
  toVendorWorkflowLabel,
  VENDOR_WORKFLOW_DEFINITIONS,
  type VendorWorkflowStage
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

function stageOf(vendor: VendorRecord): VendorWorkflowStage {
  return isVendorWorkflowStage(vendor.workflowStage)
    ? vendor.workflowStage
    : "prospective_vendor";
}

export function buildVendorCommandCenterViewModel(input: {
  vendors: VendorRecord[];
  canCreate: boolean;
  canAssign: boolean;
  userName?: string | null;
  organizationName?: string | null;
}): UniversalDashboardViewModel {
  const open = input.vendors.filter((vendor) => stageOf(vendor) !== "archived");
  const compliance = open.filter((vendor) =>
    ["application_submitted", "compliance_review", "insurance_verification"].includes(
      stageOf(vendor)
    )
  );
  const available = open.filter((vendor) =>
    ["available", "preferred_vendor"].includes(stageOf(vendor))
  );
  const assigned = open.filter((vendor) =>
    ["assigned", "work_in_progress"].includes(stageOf(vendor))
  );
  const invoices = open.filter((vendor) =>
    ["invoice_submitted", "payment_pending"].includes(stageOf(vendor))
  );
  const suspended = open.filter((vendor) => stageOf(vendor) === "suspended");
  const insuranceExpiring = open.filter((vendor) => {
    if (!vendor.insuranceExpiration) return false;
    const days =
      (new Date(`${vendor.insuranceExpiration}T00:00:00.000Z`).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 30;
  });

  const attention: UniversalAttentionItem[] = [];
  if (suspended.length > 0) {
    attention.push({
      id: "vendor-suspended",
      title: "Suspended vendors",
      reason: `${suspended.length} on hold`,
      href: `/vendors/${suspended[0]!.id}`,
      actionLabel: "Review",
      severity: "critical"
    });
  }
  if (invoices.length > 0) {
    attention.push({
      id: "vendor-invoices",
      title: "Invoices & payments",
      reason: `${invoices.length} need financial attention`,
      href: `/vendors/${invoices[0]!.id}`,
      actionLabel: "Open",
      severity: "high"
    });
  }
  if (compliance.length > 0) {
    attention.push({
      id: "vendor-compliance",
      title: "Compliance queue",
      reason: `${compliance.length} in onboarding review`,
      href: `/vendors/${compliance[0]!.id}`,
      actionLabel: "Review",
      severity: "high"
    });
  }
  if (insuranceExpiring.length > 0) {
    attention.push({
      id: "vendor-insurance",
      title: "Insurance expiring",
      reason: `${insuranceExpiring.length} within 30 days`,
      href: `/vendors/${insuranceExpiring[0]!.id}`,
      actionLabel: "Verify",
      severity: "normal"
    });
  }

  const waitingOnMe: AssistantWaitingItem[] = [];
  for (const vendor of [...compliance, ...invoices, ...suspended].slice(0, 8)) {
    const stage = stageOf(vendor);
    const def = VENDOR_WORKFLOW_DEFINITIONS[stage];
    const next = primaryNextVendorStage(stage);
    waitingOnMe.push({
      id: `me-${vendor.id}`,
      label: vendor.businessName,
      detail:
        def.waitingOnMe[0] ??
        `${toVendorWorkflowLabel(stage)}${next ? ` → ${toVendorWorkflowLabel(next)}` : ""}`,
      href: `/vendors/${vendor.id}`
    });
  }

  const waitingOnOthers: AssistantWaitingItem[] = assigned
    .map((vendor) => ({
      id: `other-${vendor.id}`,
      label: vendor.businessName,
      detail: "Waiting on vendor field work",
      href: `/vendors/${vendor.id}`
    }))
    .slice(0, 6);

  const mission: UniversalMissionItem[] = [
    {
      id: "m-today",
      label: "today's assignments",
      count: assigned.length,
      href: "/vendors"
    },
    { id: "m-available", label: "available", count: available.length, href: "/vendors" },
    { id: "m-compliance", label: "compliance", count: compliance.length, href: "/vendors" },
    { id: "m-invoices", label: "invoices", count: invoices.length, href: "/vendors" }
  ];

  const quickActions: UniversalQuickAction[] = [];
  if (input.canCreate) {
    quickActions.push({ id: "qa-new", label: "New vendor", href: "/vendors/new" });
  }
  if (input.canAssign) {
    quickActions.push({ id: "qa-assign", label: "Open maintenance", href: "/maintenance" });
  }
  quickActions.push(
    { id: "qa-maintenance", label: "Maintenance", href: "/maintenance" },
    { id: "qa-financials", label: "Financials", href: "/financials" }
  );

  const recentActivity: UniversalActivityItem[] = open.slice(0, 8).map((vendor) => ({
    id: vendor.id,
    summary: vendor.businessName,
    meta: `${toVendorWorkflowLabel(stageOf(vendor))} · ${(vendor.services ?? []).slice(0, 2).join(", ") || "trade n/a"}`,
    href: `/vendors/${vendor.id}`
  }));

  const insights: UniversalInsightItem[] = [
    { id: "i-available", label: "Available", value: String(available.length), href: "/vendors" },
    { id: "i-assigned", label: "Assigned", value: String(assigned.length), href: "/vendors" },
    { id: "i-invoice", label: "Invoices", value: String(invoices.length), href: "/vendors" },
    { id: "i-compliance", label: "Compliance", value: String(compliance.length), href: "/vendors" }
  ];

  return assembleUniversalHome({
    surfaceLabel: "Vendor Operations",
    timeGreeting: timeGreetingFromNow(),
    userName: input.userName ?? null,
    organizationName: input.organizationName ?? null,
    placeLabel: "Vendors",
    dateLabel: dateLabelFromNow(),
    supportingLine: "One vendor identity · onboarding through performance",
    attention,
    mission,
    quickActions,
    recentActivity,
    insights,
    waitingOnMe,
    waitingOnOthers
  });
}
