/**
 * STD-001 operational remediation — map leasing pipeline signals → Universal Dashboard Framework.
 * Presentation only. /leases remains the route; LeasesTable stays the tool below.
 */

import type { LeaseListItem } from "./server";
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

function daysUntil(isoDate: string | null | undefined, now = new Date()): number | null {
  if (!isoDate) return null;
  const end = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(end.getTime())) return null;
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function pushAttention(items: UniversalAttentionItem[], item: UniversalAttentionItem) {
  if (items.length >= 5) return;
  items.push(item);
}

export function buildLeasingUniversalDashboardViewModel(input: {
  items: LeaseListItem[];
  canCreate: boolean;
  userName?: string | null;
  organizationName?: string | null;
  timeGreeting?: string;
  dateLabel?: string;
}): UniversalDashboardViewModel {
  const visible = input.items.filter((item) => !item.deletedAt);
  const drafts = visible.filter((item) => item.status === "draft");
  const awaitingSignature = visible.filter((item) => item.status === "signed");
  const active = visible.filter((item) => item.status === "active");
  const renewalPending = visible.filter(
    (item) => item.renewalStatus === "pending" || item.renewalStatus === "offered"
  );
  const expiringSoon = active.filter((item) => {
    const days = daysUntil(item.endDate);
    return days !== null && days >= 0 && days <= 60;
  });
  const moveInsSoon = visible.filter((item) => {
    const days = daysUntil(item.moveInDate);
    return days !== null && days >= 0 && days <= 30;
  });

  const attention: UniversalAttentionItem[] = [];

  if (drafts.length > 0) {
    pushAttention(attention, {
      id: "lease-drafts",
      title: "Draft leases need progress",
      reason: `${drafts.length} draft lease${drafts.length === 1 ? "" : "s"} in the pipeline`,
      href: "/leases?status=draft",
      actionLabel: "Open drafts",
      severity: "high"
    });
  }
  if (awaitingSignature.length > 0) {
    pushAttention(attention, {
      id: "lease-signed",
      title: "Leases awaiting activation",
      reason: `${awaitingSignature.length} signed lease${awaitingSignature.length === 1 ? "" : "s"} not yet active`,
      href: "/leases?status=signed",
      actionLabel: "Review signed",
      severity: "high"
    });
  }
  if (renewalPending.length > 0) {
    pushAttention(attention, {
      id: "lease-renewals",
      title: "Renewals awaiting decision",
      reason: `${renewalPending.length} renewal${renewalPending.length === 1 ? "" : "s"} pending or offered`,
      href: "/leases",
      actionLabel: "Review renewals",
      severity: "high"
    });
  }
  if (expiringSoon.length > 0) {
    pushAttention(attention, {
      id: "lease-expiring",
      title: "Leases expiring within 60 days",
      reason: `${expiringSoon.length} active lease${expiringSoon.length === 1 ? "" : "s"} nearing end`,
      href: "/leases?status=active",
      actionLabel: "Review expirations",
      severity: "normal"
    });
  }
  if (moveInsSoon.length > 0) {
    pushAttention(attention, {
      id: "lease-move-ins",
      title: "Move-ins coming up",
      reason: `${moveInsSoon.length} move-in${moveInsSoon.length === 1 ? "" : "s"} within 30 days`,
      href: "/leases",
      actionLabel: "Review move-ins",
      severity: "normal"
    });
  }

  const mission: UniversalMissionItem[] = [];
  if (drafts.length > 0) {
    mission.push({ id: "mission-drafts", label: "draft leases", count: drafts.length, href: "/leases?status=draft" });
  }
  if (awaitingSignature.length > 0) {
    mission.push({
      id: "mission-signed",
      label: "awaiting activation",
      count: awaitingSignature.length,
      href: "/leases?status=signed"
    });
  }
  if (renewalPending.length > 0) {
    mission.push({
      id: "mission-renewals",
      label: "renewals in play",
      count: renewalPending.length,
      href: "/leases"
    });
  }
  if (expiringSoon.length > 0) {
    mission.push({
      id: "mission-expiring",
      label: "expiring soon",
      count: expiringSoon.length,
      href: "/leases?status=active"
    });
  }
  if (active.length > 0) {
    mission.push({ id: "mission-active", label: "active leases", count: active.length, href: "/leases?status=active" });
  }

  const waitingOnMe: AssistantWaitingItem[] = [];
  if (drafts.length > 0) {
    waitingOnMe.push({
      id: "wait-me-drafts",
      label: "Draft leases",
      detail: "Finish and send for signature",
      href: "/leases?status=draft"
    });
  }
  if (renewalPending.length > 0) {
    waitingOnMe.push({
      id: "wait-me-renewals",
      label: "Renewal decisions",
      detail: `${renewalPending.length} need follow-up`,
      href: "/leases"
    });
  }

  const waitingOnOthers: AssistantWaitingItem[] = [];
  if (awaitingSignature.length > 0) {
    waitingOnOthers.push({
      id: "wait-others-signature",
      label: "Resident signature / activation",
      detail: `${awaitingSignature.length} signed lease${awaitingSignature.length === 1 ? "" : "s"}`,
      href: "/leases?status=signed"
    });
  }

  const quickActions: UniversalQuickAction[] = [
    ...(input.canCreate ? [{ id: "qa-new-lease", label: "New lease", href: "/leases/new" }] : []),
    { id: "qa-active", label: "Active leases", href: "/leases?status=active" },
    { id: "qa-drafts", label: "Drafts", href: "/leases?status=draft" },
    { id: "qa-applicants", label: "Applicants", href: "/applicants" },
    { id: "qa-residents", label: "Residents", href: "/tenants" },
    { id: "qa-properties", label: "Properties", href: "/properties" }
  ];

  const recentActivity: UniversalActivityItem[] = visible
    .slice()
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 8)
    .map((item) => ({
      id: `act-${item.id}`,
      summary: `${item.leaseNumber} · ${item.status}`,
      meta: [item.propertyName, item.unitNumber ? `Unit ${item.unitNumber}` : null, item.tenantName]
        .filter(Boolean)
        .join(" · "),
      href: `/leases/${item.id}`
    }));

  const insights: UniversalInsightItem[] = [
    { id: "insight-active", label: "Active leases", value: String(active.length), href: "/leases?status=active" },
    { id: "insight-drafts", label: "Drafts", value: String(drafts.length), href: "/leases?status=draft" },
    {
      id: "insight-renewals",
      label: "Renewals pending",
      value: String(renewalPending.length),
      href: "/leases"
    },
    {
      id: "insight-expiring",
      label: "Expiring ≤ 60 days",
      value: String(expiringSoon.length),
      href: "/leases?status=active"
    }
  ];

  return assembleUniversalHome({
    surfaceLabel: "Leasing Home",
    timeGreeting: input.timeGreeting ?? timeGreetingFromNow(),
    userName: input.userName ?? null,
    organizationName: input.organizationName ?? null,
    placeLabel:
      attention.length > 0 ? "Leasing pipeline needs attention" : "Leasing pipeline",
    dateLabel: input.dateLabel ?? dateLabelFromNow(),
    supportingLine: "Here’s your leasing operational briefing — pipeline tools follow below.",
    attention: attention.slice(0, 5),
    mission: mission.slice(0, 8),
    quickActions: quickActions.slice(0, 6),
    recentActivity,
    insights,
    waitingOnMe,
    waitingOnOthers
  });
}
