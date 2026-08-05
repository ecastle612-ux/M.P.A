/**
 * STD-001 remediation — map CommercialDashboardSnapshot → Universal Dashboard Framework.
 * Presentation only; existing commercial API signals.
 */

import type { CommercialDashboardSnapshot } from "./dashboard-types";
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

function pushAttention(
  items: UniversalAttentionItem[],
  item: UniversalAttentionItem
) {
  if (items.length >= 5) return;
  items.push(item);
}

export function buildCommercialUniversalDashboardViewModel(input: {
  snapshot: CommercialDashboardSnapshot;
  userName?: string | null;
  timeGreeting?: string;
  dateLabel?: string;
}): UniversalDashboardViewModel {
  const d = input.snapshot;
  const attention: UniversalAttentionItem[] = [];

  if (d.billing.pastDueSubscriptions > 0) {
    pushAttention(attention, {
      id: "comm-past-due",
      title: "Billing failures / past-due subscriptions",
      reason: `${d.billing.pastDueSubscriptions} subscription${d.billing.pastDueSubscriptions === 1 ? "" : "s"} past due`,
      href: "/settings/billing",
      actionLabel: "Review billing",
      severity: "critical"
    });
  }
  if (d.health.critical > 0) {
    pushAttention(attention, {
      id: "comm-health-critical",
      title: "Organizations in critical health",
      reason: `${d.health.critical} org${d.health.critical === 1 ? "" : "s"} scored critical`,
      href: "/master-admin/commercial",
      actionLabel: "Review health",
      severity: "critical"
    });
  }
  if (d.organizations.pendingSetup > 0) {
    pushAttention(attention, {
      id: "comm-pending-setup",
      title: "Organizations awaiting activation",
      reason: `${d.organizations.pendingSetup} pending setup`,
      href: "/master-admin/impersonation",
      actionLabel: "Open directory",
      severity: "high"
    });
  }
  if (d.trials.endingSoon7Days > 0) {
    pushAttention(attention, {
      id: "comm-trial-ending",
      title: "Trial conversions due soon",
      reason: `${d.trials.endingSoon7Days} trial${d.trials.endingSoon7Days === 1 ? "" : "s"} ending within 7 days`,
      href: "/master-admin/commercial",
      actionLabel: "Review trials",
      severity: "high"
    });
  }
  if (d.implementation.stalledBelow50 > 0) {
    pushAttention(attention, {
      id: "comm-stalled-impl",
      title: "Customer onboarding stalled",
      reason: `${d.implementation.stalledBelow50} implementation${d.implementation.stalledBelow50 === 1 ? "" : "s"} below 50%`,
      href: "/master-admin/commercial",
      actionLabel: "Unblock onboarding",
      severity: "high"
    });
  }
  if (d.billing.openInvoiceCount > 0) {
    pushAttention(attention, {
      id: "comm-open-invoices",
      title: "Open commercial invoices",
      reason: `${d.billing.openInvoiceCount} open · $${Math.round(d.billing.openInvoiceAmountDue).toLocaleString()} due`,
      href: "/settings/billing",
      actionLabel: "Review invoices",
      severity: "normal"
    });
  }

  const mission: UniversalMissionItem[] = [];
  if (d.organizations.pendingSetup > 0) {
    mission.push({
      id: "mission-pending-setup",
      label: "awaiting activation",
      count: d.organizations.pendingSetup,
      href: "/master-admin/impersonation"
    });
  }
  if (d.trials.commercialTrialStatus + d.trials.saasTrialing > 0) {
    mission.push({
      id: "mission-trials",
      label: "active trials",
      count: d.trials.commercialTrialStatus + d.trials.saasTrialing,
      href: "/master-admin/commercial"
    });
  }
  if (d.billing.pastDueSubscriptions > 0) {
    mission.push({
      id: "mission-past-due",
      label: "billing failures",
      count: d.billing.pastDueSubscriptions,
      href: "/settings/billing"
    });
  }
  if (d.renewals.dueOrEmitted > 0) {
    mission.push({
      id: "mission-renewals",
      label: "subscription changes / renewals",
      count: d.renewals.dueOrEmitted,
      href: "/master-admin/commercial"
    });
  }
  if (d.implementation.queueBelow100 > 0) {
    mission.push({
      id: "mission-onboarding",
      label: "customer onboarding",
      count: d.implementation.queueBelow100,
      href: "/master-admin/commercial"
    });
  }
  const pipelineTotal = Object.values(d.pipeline).reduce((sum, n) => sum + n, 0);
  if (pipelineTotal > 0) {
    mission.push({
      id: "mission-pipeline",
      label: "sales pipeline items",
      count: pipelineTotal,
      href: "/master-admin/commercial"
    });
  }
  if (d.marketplace.engagementsOpen > 0) {
    mission.push({
      id: "mission-engagements",
      label: "open engagements",
      count: d.marketplace.engagementsOpen,
      href: "/master-admin/commercial"
    });
  }

  const waitingOnMe: AssistantWaitingItem[] = [];
  if (d.organizations.pendingSetup > 0) {
    waitingOnMe.push({
      id: "me-activation",
      label: "Activation / setup approval",
      detail: `${d.organizations.pendingSetup} organization(s) awaiting activation`,
      href: "/master-admin/impersonation"
    });
  }
  if (d.billing.pastDueSubscriptions > 0) {
    waitingOnMe.push({
      id: "me-billing",
      label: "Billing failure response",
      detail: "Past-due subscriptions need operator follow-up",
      href: "/settings/billing"
    });
  }
  if (d.health.needsAttention + d.health.atRisk > 0) {
    waitingOnMe.push({
      id: "me-health",
      label: "Health review",
      detail: `${d.health.needsAttention + d.health.atRisk} org(s) need attention or at risk`,
      href: "/master-admin/commercial"
    });
  }

  const waitingOnOthers: AssistantWaitingItem[] = [];
  if (d.trials.saasTrialing + d.trials.commercialTrialStatus > 0) {
    waitingOnOthers.push({
      id: "others-trial",
      label: "Waiting for trial conversion",
      detail: "Customers still in trial",
      href: "/master-admin/commercial"
    });
  }
  if (d.offboarding.inFlight > 0) {
    waitingOnOthers.push({
      id: "others-offboarding",
      label: "Waiting on offboarding steps",
      detail: `${d.offboarding.inFlight} offboarding in flight`,
      href: "/master-admin/commercial"
    });
  }
  if (d.support.available && (d.support.openTickets ?? 0) > 0) {
    waitingOnOthers.push({
      id: "others-support",
      label: "Waiting for support resolution",
      detail: `${d.support.openTickets} open ticket(s)`,
      href: "/master-admin/recovery"
    });
  }

  const quickActions: UniversalQuickAction[] = [
    { id: "qa-directory", label: "Organizations directory", href: "/master-admin/impersonation" },
    { id: "qa-billing", label: "Billing center", href: "/settings/billing" },
    { id: "qa-integrations", label: "Integrations health", href: "/settings/integrations" },
    { id: "qa-mission", label: "Mission Control", href: "/master-admin" },
    { id: "qa-flags", label: "Feature flags", href: "/master-admin/flags" },
    { id: "qa-portal", label: "Portal launcher", href: "/portal" }
  ];

  const recentActivity: UniversalActivityItem[] = [
    {
      id: "act-gen",
      summary: "Commercial snapshot refreshed",
      meta: `Generated ${new Date(d.generatedAt).toLocaleString()}`,
      href: "/master-admin/commercial"
    }
  ];
  if (d.newCustomersLast30Days > 0) {
    recentActivity.push({
      id: "act-new-customers",
      summary: "New customers activated (30d)",
      meta: `${d.newCustomersLast30Days} organizations`,
      href: "/master-admin/impersonation"
    });
  }
  if (d.renewals.dueOrEmitted > 0) {
    recentActivity.push({
      id: "act-renewals",
      summary: "Subscription renewal activity",
      meta: `${d.renewals.dueOrEmitted} due or emitted`,
      href: "/master-admin/commercial"
    });
  }
  if (d.discovery.accepted > 0) {
    recentActivity.push({
      id: "act-discovery",
      summary: "Feature discovery accepted",
      meta: `${d.discovery.accepted} accepted`,
      href: "/master-admin/commercial"
    });
  }

  const insights: UniversalInsightItem[] = [
    {
      id: "insight-mrr",
      label: "Est. list MRR",
      value: `$${Math.round(d.billing.estimatedListMrr).toLocaleString()}`,
      href: "/settings/billing"
    },
    {
      id: "insight-active-orgs",
      label: "Active organizations",
      value: String(d.organizations.active),
      href: "/master-admin/impersonation"
    },
    {
      id: "insight-active-subs",
      label: "Active subscriptions",
      value: String(d.billing.activeSubscriptions),
      href: "/settings/billing"
    },
    {
      id: "insight-stripe",
      label: "Stripe / billing risk",
      value: d.billing.pastDueSubscriptions > 0 ? String(d.billing.pastDueSubscriptions) : "Healthy",
      href: "/settings/integrations"
    },
    {
      id: "insight-signwell",
      label: "Integrations health",
      value: "Review providers",
      href: "/settings/integrations"
    },
    {
      id: "insight-pipeline",
      label: "Sales pipeline",
      value: String(pipelineTotal),
      href: "/master-admin/commercial"
    }
  ];

  return assembleUniversalHome({
    surfaceLabel: "Commercial Operations",
    timeGreeting: input.timeGreeting ?? timeGreetingFromNow(),
    userName: input.userName ?? null,
    organizationName: "M.P.A. Control Plane",
    placeLabel:
      d.health.critical + d.health.atRisk > 0
        ? `Commercial Health · ${d.health.critical + d.health.atRisk} at risk`
        : "Commercial Health · Stable",
    dateLabel: input.dateLabel ?? dateLabelFromNow(),
    supportingLine: "Here’s your commercial operational briefing.",
    attention,
    mission,
    quickActions,
    recentActivity,
    insights,
    waitingOnMe,
    waitingOnOthers
  });
}
