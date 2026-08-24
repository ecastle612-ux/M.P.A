/**
 * LAUNCH-001 J7 — Daily Operations briefing helpers (rule-based, no AI).
 * Summarizes existing platform attention signals for Mission Control.
 */

import { hasFinanceCapability } from "../finance/permissions";

/** In-product label. This is not a chat or generative model. */
export const MPA_ASSISTANT_LABEL = "M.P.A. Assistant";
/** Honesty line — matches landing certification (docs/31): rule-based briefing only. */
export const MPA_ASSISTANT_KIND = "Rule-based next-action briefing";

export type DailyOpsBriefingAccess = {
  includeFinance: boolean;
  includeResidentLease: boolean;
};

/**
 * Server-side visibility for the Mission Control briefing.
 * Finance and resident/lease queues must not exceed the signed-in user's
 * normal-app permissions. Prompt text is not a security boundary.
 */
export function resolveDailyOpsBriefingAccess(input: {
  roles?: readonly string[] | null;
  permissions?: readonly string[] | null;
}): DailyOpsBriefingAccess {
  const roles = input.roles ?? [];
  const permissions = input.permissions ?? [];
  return {
    includeFinance: hasFinanceCapability(permissions, "pm.finance:read"),
    includeResidentLease: roles.some(
      (role) =>
        role === "organization_admin" ||
        role === "property_manager" ||
        role === "leasing_agent"
    )
  };
}

export type DailyOpsAttentionItem = {
  id: string;
  domain: "finance" | "maintenance" | "leasing" | "resident" | "vendor" | "property";
  title: string;
  detail: string;
  href: string;
  urgency: "immediate" | "waiting_on_me" | "waiting_on_others";
};

export type DailyOpsBriefingInput = {
  displayName?: string | null;
  organizationName?: string | null;
  propertyCount: number;
  outstandingRent: number;
  delinquencyCount: number;
  openMaintenanceCount: number;
  emergencyMaintenanceCount: number;
  unassignedMaintenanceCount: number;
  assignedMaintenanceCount: number;
  pendingSignatureLeaseCount: number;
  pendingActivationResidentCount: number;
  vendorInvoicesAwaitingApproval: number;
  vendorPaymentsDue: number;
  recentActivityCount: number;
  firstActionTitle: string;
};

export function buildDailyOpsGreeting(input: {
  displayName?: string | null;
  hour?: number;
}): string {
  const hour = input.hour ?? new Date().getHours();
  const name = input.displayName?.trim() || "there";
  const part =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${part}, ${name}.`;
}

export function buildDailyOpsAssistantBriefing(input: DailyOpsBriefingInput): {
  summary: string;
  immediateCount: number;
  waitingOnMeCount: number;
  waitingOnOthersCount: number;
  firstTask: string;
  changedSinceLastLogin: string;
} {
  const immediate: string[] = [];
  const waitingOnMe: string[] = [];
  const waitingOnOthers: string[] = [];

  if (input.emergencyMaintenanceCount > 0) {
    immediate.push(`${input.emergencyMaintenanceCount} emergency maintenance request(s)`);
  }
  if (input.delinquencyCount > 0) {
    immediate.push(`${input.delinquencyCount} delinquent resident(s)`);
  }
  if (input.vendorInvoicesAwaitingApproval > 0) {
    waitingOnMe.push(`${input.vendorInvoicesAwaitingApproval} vendor invoice(s) awaiting approval`);
  }
  if (input.unassignedMaintenanceCount > 0) {
    waitingOnMe.push(`${input.unassignedMaintenanceCount} unassigned work order(s)`);
  }
  if (input.pendingSignatureLeaseCount > 0) {
    waitingOnMe.push(`${input.pendingSignatureLeaseCount} lease(s) waiting on signature action`);
  }
  if (input.outstandingRent > 0) {
    waitingOnMe.push("Outstanding rent to follow up");
  }
  if (input.assignedMaintenanceCount > 0) {
    waitingOnOthers.push(`${input.assignedMaintenanceCount} work order(s) with technicians/vendors`);
  }
  if (input.pendingActivationResidentCount > 0) {
    waitingOnOthers.push(
      `${input.pendingActivationResidentCount} resident portal(s) pending activation`
    );
  }
  if (input.vendorPaymentsDue > 0) {
    waitingOnOthers.push(`${input.vendorPaymentsDue} vendor payment(s) scheduled`);
  }

  const immediateCount = immediate.length;
  const waitingOnMeCount = waitingOnMe.length;
  const waitingOnOthersCount = waitingOnOthers.length;

  const firstTask =
    immediate[0] ??
    waitingOnMe[0] ??
    input.firstActionTitle ??
    "Review today's operations.";

  const changedSinceLastLogin =
    input.recentActivityCount > 0
      ? `${input.recentActivityCount} recent finance/ops update(s) are ready to review.`
      : "No new finance activity since your last look — open maintenance and leasing queues next.";

  const summaryParts = [
    immediateCount > 0
      ? `${immediateCount} item(s) need immediate attention.`
      : "Nothing flagged as immediate.",
    waitingOnMeCount > 0
      ? `${waitingOnMeCount} item(s) are waiting on you.`
      : "Nothing is waiting on you.",
    waitingOnOthersCount > 0
      ? `${waitingOnOthersCount} item(s) are waiting on others.`
      : "Nothing is waiting on others.",
    `Start with: ${firstTask}`,
    changedSinceLastLogin
  ];

  return {
    summary: summaryParts.join(" "),
    immediateCount,
    waitingOnMeCount,
    waitingOnOthersCount,
    firstTask,
    changedSinceLastLogin
  };
}

export function buildDailyOpsReadyAssistantCopy(): string {
  return "I can run my property management business from this dashboard. Review your owner's portfolio.";
}
