/**
 * STD-001 operational remediation — map Owner portal dashboard → Universal Dashboard Framework.
 * Presentation only. Portfolio KPIs move to Insights (below fold).
 */

import type { OwnerPortalDashboardModel } from "./dashboard";
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

function widgetValue(state: OwnerPortalDashboardModel["propertyCountWidget"]): string | null {
  if (state.status === "ready") return state.value;
  return null;
}

function pushAttention(items: UniversalAttentionItem[], item: UniversalAttentionItem) {
  if (items.length >= 5) return;
  items.push(item);
}

export function buildOwnerUniversalDashboardViewModel(input: {
  model: OwnerPortalDashboardModel;
  organizationName?: string | null;
  timeGreeting?: string;
  dateLabel?: string;
}): UniversalDashboardViewModel {
  const { model } = input;
  const attention: UniversalAttentionItem[] = [];

  for (const item of model.attentionItems.slice(0, 5)) {
    pushAttention(attention, {
      id: item.id,
      title: item.title,
      reason: item.subtitle ?? "Needs your attention",
      href: item.href ?? "/portal/owner",
      actionLabel: "Review",
      severity: /overdue|past due|failed|critical/i.test(`${item.title} ${item.subtitle ?? ""}`)
        ? "critical"
        : /pending|awaiting|due/i.test(`${item.title} ${item.subtitle ?? ""}`)
          ? "high"
          : "normal"
    });
  }

  if (model.outstanding.status === "ready" && model.outstanding.value !== "$0") {
    pushAttention(attention, {
      id: "owner-outstanding",
      title: "Outstanding balances",
      reason: model.outstanding.detail ?? model.outstanding.value,
      href: model.outstanding.href ?? "/portal/owner/financials",
      actionLabel: "Review financials",
      severity: "high"
    });
  }

  if (model.pendingPayout.status === "ready") {
    pushAttention(attention, {
      id: "owner-payout",
      title: "Pending payout",
      reason: model.pendingPayout.detail ?? model.pendingPayout.value,
      href: model.pendingPayout.href ?? "/portal/owner/financials",
      actionLabel: "View payout",
      severity: "normal"
    });
  }

  const mission: UniversalMissionItem[] = [];
  if (model.propertyCount > 0) {
    mission.push({
      id: "mission-properties",
      label: "properties tracked",
      count: model.propertyCount,
      href: "/portal/owner/properties"
    });
  }
  if (model.attentionItems.length > 0) {
    mission.push({
      id: "mission-attention",
      label: "items needing attention",
      count: model.attentionItems.length,
      href: "/portal/owner"
    });
  }
  if (model.recentMessages.status === "ready" && model.recentMessages.items.length > 0) {
    mission.push({
      id: "mission-messages",
      label: "recent messages",
      count: model.recentMessages.items.length,
      href: model.recentMessages.href ?? "/portal/owner/messages"
    });
  }
  if (model.notifications.status === "ready" && model.notifications.items.length > 0) {
    mission.push({
      id: "mission-notifications",
      label: "notifications",
      count: model.notifications.items.length,
      href: "/portal/owner"
    });
  }

  const waitingOnMe: AssistantWaitingItem[] = model.attentionItems.slice(0, 4).map((item) => ({
    id: `wait-me-${item.id}`,
    label: item.title,
    detail: item.subtitle ?? "Waiting on you",
    href: item.href ?? "/portal/owner"
  }));

  const waitingOnOthers: AssistantWaitingItem[] = [];
  if (model.pendingPayout.status === "ready") {
    waitingOnOthers.push({
      id: "wait-others-payout",
      label: "Payout processing",
      detail: model.pendingPayout.detail ?? model.pendingPayout.value,
      href: model.pendingPayout.href ?? "/portal/owner/financials"
    });
  }

  const quickActions: UniversalQuickAction[] = [
    { id: "qa-properties", label: "Properties", href: "/portal/owner/properties" },
    { id: "qa-financials", label: "Financials", href: "/portal/owner/financials" },
    { id: "qa-documents", label: "Documents", href: "/portal/owner/documents" },
    { id: "qa-messages", label: "Messages", href: "/portal/owner/messages" },
    { id: "qa-reports", label: "Reports", href: "/portal/owner/reports" },
    { id: "qa-settings", label: "Settings", href: "/portal/owner/settings" }
  ];

  const recentActivity: UniversalActivityItem[] = [];
  const listSources = [
    model.recentMessages,
    model.recentDocuments,
    model.recentVendorExpenses,
    model.notifications
  ];
  for (const source of listSources) {
    if (source.status !== "ready") continue;
    for (const item of source.items.slice(0, 2)) {
      recentActivity.push({
        id: `act-${item.id}`,
        summary: item.title,
        meta: item.subtitle ?? "Owner activity",
        href: item.href ?? null
      });
    }
  }

  const insights: UniversalInsightItem[] = [];
  const kpiPairs: Array<[string, OwnerPortalDashboardModel["propertyCountWidget"], string?]> = [
    ["Properties", model.propertyCountWidget, "/portal/owner/properties"],
    ["Occupancy", model.occupancy, "/portal/owner/properties"],
    ["Recent collections", model.revenue, "/portal/owner/financials"],
    ["Expenses", model.expenses, "/portal/owner/financials"],
    ["Outstanding balance", model.outstanding, "/portal/owner/financials"],
    ["Pending payout", model.pendingPayout, "/portal/owner/financials"]
  ];
  for (const [label, state, href] of kpiPairs) {
    const value = widgetValue(state);
    if (!value) continue;
    insights.push({
      id: `insight-${label.toLowerCase().replace(/\s+/g, "-")}`,
      label,
      value,
      ...(href ? { href } : {})
    });
  }

  return assembleUniversalHome({
    surfaceLabel: "Owner Home",
    timeGreeting: input.timeGreeting ?? timeGreetingFromNow(),
    userName: model.welcomeName || null,
    organizationName: input.organizationName ?? null,
    placeLabel:
      model.propertyCount > 0
        ? `Portfolio · ${model.propertyCount} propert${model.propertyCount === 1 ? "y" : "ies"}`
        : "Owner portfolio",
    dateLabel: input.dateLabel ?? dateLabelFromNow(),
    supportingLine: "Here’s what needs attention across your portfolio — performance follows below.",
    attention: attention.slice(0, 5),
    mission: mission.slice(0, 8),
    quickActions: quickActions.slice(0, 6),
    recentActivity: recentActivity.slice(0, 8),
    insights: insights.slice(0, 8),
    waitingOnMe,
    waitingOnOthers
  });
}
