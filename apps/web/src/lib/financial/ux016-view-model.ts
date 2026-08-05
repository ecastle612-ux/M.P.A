/**
 * STD-001 remediation — map financial dashboard metrics → Universal Dashboard Framework.
 * Presentation only; existing financial API signals. Risk first in Immediate Attention.
 */

import { formatCurrency, type FinancialActivityRecord } from "./contracts";
import type { FinancialDashboardMetrics } from "./server";
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

export function buildFinancialUniversalDashboardViewModel(input: {
  metrics: FinancialDashboardMetrics;
  activity: FinancialActivityRecord[];
  canCreate: boolean;
  userName?: string | null;
  organizationName?: string | null;
  timeGreeting?: string;
  dateLabel?: string;
}): UniversalDashboardViewModel {
  const { metrics, activity, canCreate } = input;
  const statementDraft = metrics.ownerStatementStatusCounts.draft ?? 0;
  const failedPayments = activity.filter((item) => item.activityType === "payment_failed").length;

  const attention: UniversalAttentionItem[] = [];
  // Financial risk first (binding for this remediation)
  if (failedPayments > 0) {
    attention.push({
      id: "fin-failed-payments",
      title: "Failed payments require follow-up",
      reason: `${failedPayments} recent payment failure${failedPayments === 1 ? "" : "s"}`,
      href: "/financials/transactions",
      actionLabel: "Review failures",
      severity: "critical"
    });
  }
  if (metrics.lateRentCount > 0) {
    attention.push({
      id: "fin-late-rent",
      title: "Accounts receivable at risk",
      reason: `${metrics.lateRentCount} late rent account${metrics.lateRentCount === 1 ? "" : "s"}`,
      href: "/financials/charges",
      actionLabel: "Open AR",
      severity: "critical"
    });
  }
  if (metrics.outstandingBalancesTotal > 0 && metrics.lateRentCount === 0) {
    attention.push({
      id: "fin-outstanding",
      title: "Outstanding balances",
      reason: formatCurrency(metrics.outstandingBalancesTotal),
      href: "/financials/charges",
      actionLabel: "Review balances",
      severity: "high"
    });
  }
  if (metrics.rentDueToday > 0) {
    attention.push({
      id: "fin-due-today",
      title: "Rent due today",
      reason: `${metrics.rentDueToday} charge${metrics.rentDueToday === 1 ? "" : "s"} due`,
      href: "/financials/charges",
      actionLabel: "Collect",
      severity: "high"
    });
  }
  if (statementDraft > 0) {
    attention.push({
      id: "fin-statements",
      title: "Owner distributions / statements pending",
      reason: `${statementDraft} draft owner statement${statementDraft === 1 ? "" : "s"}`,
      href: "/financials/owner-statements",
      actionLabel: "Review statements",
      severity: "normal"
    });
  }

  const mission: UniversalMissionItem[] = [];
  if (metrics.lateRentCount > 0) {
    mission.push({
      id: "mission-ar",
      label: "accounts receivable (late)",
      count: metrics.lateRentCount,
      href: "/financials/charges"
    });
  }
  if (metrics.rentDueToday > 0) {
    mission.push({
      id: "mission-due-today",
      label: "rent due today",
      count: metrics.rentDueToday,
      href: "/financials/charges"
    });
  }
  if (metrics.recentExpenses.length > 0) {
    mission.push({
      id: "mission-ap",
      label: "accounts payable / expenses",
      count: metrics.recentExpenses.length,
      href: "/financials/expenses"
    });
  }
  if (statementDraft > 0) {
    mission.push({
      id: "mission-owner-dist",
      label: "owner distributions pending",
      count: statementDraft,
      href: "/financials/owner-statements"
    });
  }
  if (failedPayments > 0) {
    mission.push({
      id: "mission-failed",
      label: "failed payments",
      count: failedPayments,
      href: "/financials/transactions"
    });
  }
  const generated = metrics.ownerStatementStatusCounts.generated ?? 0;
  if (generated > 0) {
    mission.push({
      id: "mission-statements-ready",
      label: "statements ready",
      count: generated,
      href: "/financials/owner-statements"
    });
  }

  const waitingOnMe: AssistantWaitingItem[] = [];
  if (statementDraft > 0) {
    waitingOnMe.push({
      id: "me-statement-approval",
      label: "Financial approvals — owner statements",
      detail: `${statementDraft} draft statement(s) need review`,
      href: "/financials/owner-statements"
    });
  }
  if (failedPayments > 0) {
    waitingOnMe.push({
      id: "me-failed-pay",
      label: "Failed payment disposition",
      detail: "Decide retry, contact, or adjustment",
      href: "/financials/transactions"
    });
  }

  const waitingOnOthers: AssistantWaitingItem[] = [];
  if (metrics.lateRentCount > 0) {
    waitingOnOthers.push({
      id: "others-resident-pay",
      label: "Waiting for resident payment",
      detail: `${metrics.lateRentCount} late account(s)`,
      href: "/financials/charges"
    });
  }
  if (metrics.outstandingBalancesTotal > 0) {
    waitingOnOthers.push({
      id: "others-balance",
      label: "Waiting for balance clearance",
      detail: formatCurrency(metrics.outstandingBalancesTotal),
      href: "/financials/charges"
    });
  }

  const quickActions: UniversalQuickAction[] = [
    { id: "qa-charges", label: "Rent charges", href: "/financials/charges" },
    { id: "qa-expenses", label: "Expenses / AP", href: "/financials/expenses" },
    { id: "qa-statements", label: "Owner statements", href: "/financials/owner-statements" },
    { id: "qa-reports", label: "Financial reports", href: "/financials/reports" },
    { id: "qa-payouts", label: "Owner payouts", href: "/settings/payouts" }
  ];
  if (canCreate) {
    quickActions.unshift({ id: "qa-create-charge", label: "Create charge", href: "/financials/charges/new" });
  }

  const recentActivity: UniversalActivityItem[] = activity.slice(0, 10).map((item) => ({
    id: item.id,
    summary: item.summary || item.activityType.replaceAll("_", " "),
    meta: [item.activityType.replaceAll("_", " "), new Date(item.createdAt).toLocaleString()]
      .filter(Boolean)
      .join(" · "),
    href:
      item.entityType === "expense"
        ? "/financials/expenses"
        : item.entityType === "statement"
          ? "/financials/owner-statements"
          : "/financials/charges"
  }));

  const insights: UniversalInsightItem[] = [
    {
      id: "insight-outstanding",
      label: "Outstanding balances",
      value: formatCurrency(metrics.outstandingBalancesTotal),
      href: "/financials/charges"
    },
    {
      id: "insight-late",
      label: "Late rent accounts",
      value: String(metrics.lateRentCount),
      href: "/financials/charges"
    },
    {
      id: "insight-due-today",
      label: "Rent due today",
      value: String(metrics.rentDueToday),
      href: "/financials/charges"
    },
    {
      id: "insight-revenue",
      label: "Recent payments",
      value: String(metrics.recentPayments.length),
      href: "/financials/transactions"
    },
    {
      id: "insight-budget",
      label: "Budget / expense pressure",
      value: String(metrics.recentExpenses.length),
      href: "/financials/expenses"
    },
    {
      id: "insight-statements",
      label: "Owner statements (draft)",
      value: String(statementDraft),
      href: "/financials/owner-statements"
    }
  ];

  return assembleUniversalHome({
    surfaceLabel: "Financial Operations",
    timeGreeting: input.timeGreeting ?? timeGreetingFromNow(),
    userName: input.userName ?? null,
    organizationName: input.organizationName ?? null,
    placeLabel:
      metrics.lateRentCount + failedPayments > 0
        ? "Financial risk elevated"
        : "Financial operations",
    dateLabel: input.dateLabel ?? dateLabelFromNow(),
    supportingLine: "Here’s your financial operational briefing.",
    attention: attention.slice(0, 5),
    mission,
    quickActions: quickActions.slice(0, 6),
    recentActivity,
    insights,
    waitingOnMe,
    waitingOnOthers
  });
}
