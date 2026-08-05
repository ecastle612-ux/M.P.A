/**
 * UX-016 Slice D — M.P.A. Assistant view model.
 * Deterministic briefing from existing dashboard / Command Center / Mission Control signals.
 * No external AI calls; presentation and prioritization only.
 */

import type { DashboardSnapshot } from "./server";
import type { CommandCenterHomeComposition } from "../ops/command-center-home";
import type {
  UniversalActivityItem,
  UniversalAttentionItem,
  UniversalInsightItem,
  UniversalMissionItem
} from "./ux016-view-model";

export type AssistantTodayItem = {
  id: string;
  label: string;
  count: number;
  href: string;
};

export type AssistantWaitingItem = {
  id: string;
  label: string;
  detail: string;
  href: string;
};

export type AssistantRelatedContext = {
  label: string;
  value: string;
  href?: string;
};

export type AssistantActionItem = {
  id: string;
  label: string;
  reason: string;
  href: string;
  actionLabel: string;
  relatedContext?: AssistantRelatedContext[];
};

export type AssistantHighestPriority = {
  title: string;
  reason: string;
  href: string;
  actionLabel: string;
  relatedContext?: AssistantRelatedContext[];
};

export type MpaAssistantViewModel = {
  headline: string;
  today: AssistantTodayItem[];
  highestPriority: AssistantHighestPriority | null;
  recommendedNextAction: { label: string; href: string; actionLabel: string } | null;
  waitingOnMe: AssistantWaitingItem[];
  waitingOnOthers: AssistantWaitingItem[];
  recommendedActions: AssistantActionItem[];
  quickWins: AssistantActionItem[];
  operationalTimeline: UniversalActivityItem[];
  caughtUp: boolean;
  caughtUpSuggestions: Array<{ label: string; href: string }>;
};

const MEANINGFUL_ACTIVITY_PATTERNS = [
  /lease\s+sign/i,
  /signed/i,
  /inspection\s+complet/i,
  /vendor\s+accept/i,
  /accepted\s+assignment/i,
  /maintenance\s+request/i,
  /work\s+order/i,
  /invoice\s+approv/i,
  /document\s+upload/i,
  /uploaded/i,
  /payment/i,
  /renewal/i,
  /complet/i,
  /approv/i,
  /assign/i,
  /submitted/i
];

const NOISE_ACTIVITY_PATTERNS = [
  /heartbeat/i,
  /read\s+receipt/i,
  /viewed/i,
  /session/i,
  /ping/i
];

function isMeaningfulActivity(summary: string, meta: string): boolean {
  const text = `${summary} ${meta}`;
  if (NOISE_ACTIVITY_PATTERNS.some((pattern) => pattern.test(text))) return false;
  return MEANINGFUL_ACTIVITY_PATTERNS.some((pattern) => pattern.test(text));
}

function buildRelatedContext(snapshot: DashboardSnapshot): AssistantRelatedContext[] {
  const related: AssistantRelatedContext[] = [];
  const openWo = snapshot.maintenance?.openWorkOrders ?? 0;
  if (openWo > 0) {
    related.push({
      label: "Outstanding maintenance",
      value: openWo === 1 ? "1 open work order" : `${openWo} open work orders`,
      href: "/maintenance"
    });
  }
  const balance = snapshot.financial?.outstandingBalancesTotal ?? 0;
  if (balance > 0) {
    related.push({
      label: "Pending balance",
      value: `$${Math.round(balance).toLocaleString()}`,
      href: "/financials"
    });
  }
  const signaturesPending = snapshot.applicants?.awaitingSignatures ?? 0;
  if (signaturesPending > 0) {
    related.push({
      label: "Unsigned documents",
      value:
        signaturesPending === 1
          ? "1 signature pending"
          : `${signaturesPending} signatures pending`,
      href: "/applicants"
    });
  }
  const overdue = snapshot.maintenance?.overdueWorkOrders ?? 0;
  if (overdue > 0) {
    related.push({
      label: "Upcoming / overdue inspection pressure",
      value: overdue === 1 ? "1 overdue item" : `${overdue} overdue items`,
      href: "/maintenance"
    });
  }
  return related.slice(0, 4);
}

function buildTodayFromMission(mission: UniversalMissionItem[]): AssistantTodayItem[] {
  return mission.slice(0, 8).map((row) => ({
    id: row.id,
    label: row.label,
    count: row.count,
    href: row.href
  }));
}

function buildWaitingOnMe(
  snapshot: DashboardSnapshot,
  home: CommandCenterHomeComposition | null,
  attention: UniversalAttentionItem[]
): AssistantWaitingItem[] {
  const items: AssistantWaitingItem[] = [];

  const vendorApprovals = snapshot.vendors?.awaitingResponse ?? 0;
  // Approvals waiting on the manager (invoices / vendor review)
  if (vendorApprovals > 0 && attention.some((a) => /approv|vendor/i.test(a.title))) {
    items.push({
      id: "me-vendor-approval",
      label: "Vendor approval needed",
      detail:
        vendorApprovals === 1
          ? "1 vendor item requires your approval or assignment"
          : `${vendorApprovals} vendor items require your approval or assignment`,
      href: "/vendors"
    });
  }

  for (const task of snapshot.operationalTasks) {
    if (/approv|assign|sign|respond|review/i.test(`${task.title} ${task.description}`)) {
      items.push({
        id: `me-task-${task.id}`,
        label: task.title,
        detail: task.description,
        href: task.href
      });
    }
  }

  for (const task of home?.priorityTasks ?? []) {
    if (/approv|assign|sign|respond|review/i.test(`${task.title} ${task.description ?? ""}`)) {
      items.push({
        id: `me-ops-${task.taskId}`,
        label: task.title,
        detail: task.description?.trim() || "Requires your action",
        href: task.deepLink ?? "/inbox"
      });
    }
  }

  for (const item of home?.inboxPreview ?? []) {
    items.push({
      id: `me-inbox-${item.itemId}`,
      label: item.title,
      detail: "Requires your response",
      href: item.deepLink ?? "/inbox"
    });
  }

  const signatures = snapshot.applicants?.awaitingSignatures ?? 0;
  // Counter-sign / staff signature queues surface as waiting on me when titled that way in attention
  if (signatures > 0 && attention.some((a) => /sign/i.test(a.title))) {
    items.push({
      id: "me-signatures",
      label: "Signature required",
      detail:
        signatures === 1
          ? "1 item needs your signature or countersignature"
          : `${signatures} items need your signature or countersignature`,
      href: "/applicants"
    });
  }

  if (snapshot.maintenance?.highPriorityWorkOrders) {
    const high = snapshot.maintenance.highPriorityWorkOrders;
    if (high > 0) {
      items.push({
        id: "me-assign-wo",
        label: "Work order assignment",
        detail:
          high === 1
            ? "1 high-priority work order needs assignment"
            : `${high} high-priority work orders need assignment`,
        href: "/maintenance"
      });
    }
  }

  return dedupeWaiting(items).slice(0, 6);
}

function buildWaitingOnOthers(
  snapshot: DashboardSnapshot,
  home: CommandCenterHomeComposition | null
): AssistantWaitingItem[] {
  const items: AssistantWaitingItem[] = [];

  const vendorAwaiting = snapshot.vendors?.awaitingResponse ?? 0;
  if (vendorAwaiting > 0) {
    items.push({
      id: "others-vendor",
      label: "Waiting for vendor response",
      detail:
        vendorAwaiting === 1
          ? "1 vendor has not responded"
          : `${vendorAwaiting} vendors have not responded`,
      href: "/vendors"
    });
  }

  const residentSignatures = snapshot.applicants?.awaitingSignatures ?? 0;
  if (residentSignatures > 0) {
    items.push({
      id: "others-signature",
      label: "Waiting for resident signature",
      detail:
        residentSignatures === 1
          ? "1 signature outstanding"
          : `${residentSignatures} signatures outstanding`,
      href: "/applicants"
    });
  }

  const lateRent = snapshot.financial?.lateRentCount ?? 0;
  if (lateRent > 0) {
    items.push({
      id: "others-payment",
      label: "Waiting for payment confirmation",
      detail:
        lateRent === 1 ? "1 late rent account" : `${lateRent} late rent accounts`,
      href: "/financials"
    });
  }

  const overdue = snapshot.maintenance?.overdueWorkOrders ?? 0;
  if (overdue > 0) {
    items.push({
      id: "others-inspection",
      label: "Waiting for inspection completion",
      detail:
        overdue === 1
          ? "1 overdue inspection or work item"
          : `${overdue} overdue inspections or work items`,
      href: "/maintenance"
    });
  }

  const renewals = snapshot.renewalNeededTotal || snapshot.leases?.renewalNeeded || 0;
  if (renewals > 0) {
    items.push({
      id: "others-owner-lease",
      label: "Waiting for lease / owner approval",
      detail:
        renewals === 1
          ? "1 lease renewal pending counterparty action"
          : `${renewals} lease renewals pending counterparty action`,
      href: "/leases"
    });
  }

  const blocked = (home?.priorityTasks ?? []).filter((task) => task.status === "blocked");
  for (const task of blocked.slice(0, 3)) {
    items.push({
      id: `others-blocked-${task.taskId}`,
      label: "Waiting on dependency",
      detail: task.title,
      href: task.deepLink ?? "/inbox"
    });
  }

  return dedupeWaiting(items).slice(0, 6);
}

function dedupeWaiting(items: AssistantWaitingItem[]): AssistantWaitingItem[] {
  const seen = new Set<string>();
  const out: AssistantWaitingItem[] = [];
  for (const item of items) {
    const key = `${item.label}|${item.href}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function buildRecommendedActions(
  attention: UniversalAttentionItem[],
  home: CommandCenterHomeComposition | null,
  related: AssistantRelatedContext[]
): AssistantActionItem[] {
  const actions: AssistantActionItem[] = [];

  for (const item of attention.slice(0, 5)) {
    const action: AssistantActionItem = {
      id: `rec-${item.id}`,
      label: item.title,
      reason: item.reason,
      href: item.href,
      actionLabel: item.actionLabel
    };
    if (/lease|renewal/i.test(item.title)) {
      action.relatedContext = related;
    }
    actions.push(action);
  }

  for (const rec of home?.aiRecommendations ?? []) {
    if (actions.length >= 5) break;
    actions.push({
      id: `rec-ai-${rec.recommendationId}`,
      label: rec.title,
      reason: rec.summary,
      href: rec.deepLink ?? "/inbox?kind=ai",
      actionLabel: "Review"
    });
  }

  return actions.slice(0, 5);
}

function buildQuickWins(
  snapshot: DashboardSnapshot,
  attention: UniversalAttentionItem[],
  home: CommandCenterHomeComposition | null
): AssistantActionItem[] {
  const wins: AssistantActionItem[] = [];

  if ((snapshot.vendors?.awaitingResponse ?? 0) > 0) {
    wins.push({
      id: "qw-assign-vendor",
      label: "Assign vendor",
      reason: "Takes under two minutes when a preferred vendor is ready.",
      href: "/vendors",
      actionLabel: "Assign"
    });
  }

  if (attention.some((item) => /approv|invoice/i.test(item.title))) {
    wins.push({
      id: "qw-approve",
      label: "Approve invoice",
      reason: "Clear a pending approval to keep vendors moving.",
      href: attention.find((item) => /approv|invoice/i.test(item.title))?.href ?? "/financials",
      actionLabel: "Approve"
    });
  }

  if ((home?.inboxUnreadCount ?? 0) > 0) {
    wins.push({
      id: "qw-reminder",
      label: "Send reminder",
      reason: "Nudge an open inbox item without leaving home.",
      href: "/inbox",
      actionLabel: "Open inbox"
    });
  }

  if ((snapshot.maintenance?.recentlyCompleted ?? 0) > 0) {
    wins.push({
      id: "qw-archive",
      label: "Archive completed work",
      reason: "Keep the queue clean after finished jobs.",
      href: "/maintenance",
      actionLabel: "Review"
    });
  }

  if ((snapshot.maintenance?.overdueWorkOrders ?? 0) > 0) {
    wins.push({
      id: "qw-inspection",
      label: "Mark inspection complete",
      reason: "Close an overdue inspection when fieldwork is done.",
      href: "/maintenance",
      actionLabel: "Open"
    });
  }

  // Prefer short-path attention items as quick wins when titled for quick actions
  for (const item of attention) {
    if (wins.length >= 5) break;
    if (/approv|assign|remind|archive|complete|sign/i.test(item.title)) {
      if (wins.some((win) => win.href === item.href && win.label === item.title)) continue;
      wins.push({
        id: `qw-att-${item.id}`,
        label: item.actionLabel,
        reason: item.title,
        href: item.href,
        actionLabel: item.actionLabel
      });
    }
  }

  return wins.slice(0, 5);
}

function buildOperationalTimeline(activity: UniversalActivityItem[]): UniversalActivityItem[] {
  const meaningful = activity.filter((entry) => isMeaningfulActivity(entry.summary, entry.meta));
  if (meaningful.length > 0) return meaningful.slice(0, 10);
  // Fallback: still show a short curated list rather than a noisy dump
  return activity.slice(0, 5);
}

function buildCaughtUpSuggestions(insights: UniversalInsightItem[]): Array<{ label: string; href: string }> {
  const suggestions: Array<{ label: string; href: string }> = [
    { label: "Review occupancy trends", href: insights.find((i) => /occupancy/i.test(i.label))?.href ?? "/properties" },
    { label: "Archive completed work", href: "/maintenance" },
    { label: "Check resident satisfaction", href: "/communications" }
  ];
  return suggestions;
}

function buildRecommendedNextAction(
  highest: AssistantHighestPriority | null,
  recommended: AssistantActionItem[],
  mission: UniversalMissionItem[]
): { label: string; href: string; actionLabel: string } | null {
  if (highest) {
    const beforeRenewals =
      /emergency|critical|assign/i.test(highest.title) &&
      mission.some((row) => /renewal|lease/i.test(row.label));
    return {
      label: beforeRenewals
        ? `${highest.actionLabel === "Open work order" || /assign/i.test(highest.title) ? "Assign the emergency repair" : highest.actionLabel} before reviewing lease renewals.`
        : `${highest.actionLabel} — ${highest.title}`,
      href: highest.href,
      actionLabel: highest.actionLabel
    };
  }
  const first = recommended[0];
  if (first) {
    return { label: first.label, href: first.href, actionLabel: first.actionLabel };
  }
  return null;
}

export function buildMpaAssistantViewModel(input: {
  snapshot: DashboardSnapshot;
  commandCenterHome: CommandCenterHomeComposition | null;
  attention: UniversalAttentionItem[];
  mission: UniversalMissionItem[];
  recentActivity: UniversalActivityItem[];
  insights: UniversalInsightItem[];
}): MpaAssistantViewModel {
  const { snapshot, commandCenterHome, attention, mission, recentActivity, insights } = input;
  const related = buildRelatedContext(snapshot);
  const today = buildTodayFromMission(mission);
  const highestPriority: AssistantHighestPriority | null = attention[0]
    ? {
        title: attention[0].title,
        reason: attention[0].reason,
        href: attention[0].href,
        actionLabel: attention[0].actionLabel,
        relatedContext: /lease|renewal/i.test(attention[0].title) ? related : related.slice(0, 2)
      }
    : null;

  const waitingOnMe = buildWaitingOnMe(snapshot, commandCenterHome, attention);
  const waitingOnOthers = buildWaitingOnOthers(snapshot, commandCenterHome);
  const recommendedActions = buildRecommendedActions(attention, commandCenterHome, related);
  const quickWins = buildQuickWins(snapshot, attention, commandCenterHome);
  const operationalTimeline = buildOperationalTimeline(recentActivity);
  const recommendedNextAction = buildRecommendedNextAction(highestPriority, recommendedActions, mission);
  const caughtUp = attention.length === 0 && waitingOnMe.length === 0;

  return {
    headline: "Here’s your operational briefing.",
    today,
    highestPriority,
    recommendedNextAction,
    waitingOnMe,
    waitingOnOthers,
    recommendedActions,
    quickWins,
    operationalTimeline,
    caughtUp,
    caughtUpSuggestions: buildCaughtUpSuggestions(insights)
  };
}

/** Master Admin / Mission Control: briefing from already-mapped Universal sections. */
export function buildMpaAssistantFromUniversalSections(input: {
  attention: UniversalAttentionItem[];
  mission: UniversalMissionItem[];
  recentActivity: UniversalActivityItem[];
  insights: UniversalInsightItem[];
  waitingOnMe?: AssistantWaitingItem[];
  waitingOnOthers?: AssistantWaitingItem[];
}): MpaAssistantViewModel {
  const today = buildTodayFromMission(input.mission);
  const highestPriority: AssistantHighestPriority | null = input.attention[0]
    ? {
        title: input.attention[0].title,
        reason: input.attention[0].reason,
        href: input.attention[0].href,
        actionLabel: input.attention[0].actionLabel
      }
    : null;

  const waitingOnMe =
    input.waitingOnMe ??
    input.attention.slice(0, 4).map((item) => ({
      id: `me-${item.id}`,
      label: item.title,
      detail: item.reason,
      href: item.href
    }));

  const waitingOnOthers =
    input.waitingOnOthers ??
    input.mission
      .filter((row) => /support|onboarding|integration|platform/i.test(row.label))
      .slice(0, 4)
      .map((row) => ({
        id: `others-${row.id}`,
        label: `Waiting on ${row.label}`,
        detail: `${row.count} open`,
        href: row.href
      }));

  const recommendedActions: AssistantActionItem[] = input.attention.slice(0, 5).map((item) => ({
    id: `rec-${item.id}`,
    label: item.title,
    reason: item.reason,
    href: item.href,
    actionLabel: item.actionLabel
  }));

  const quickWins: AssistantActionItem[] = recommendedActions
    .filter((action) => /approv|review|open|health|flag/i.test(action.label + action.actionLabel))
    .slice(0, 5)
    .map((action) => ({
      ...action,
      id: `qw-${action.id}`,
      reason: "Short operator action from Mission Control."
    }));

  const caughtUp = input.attention.length === 0;

  return {
    headline: "Here’s your operational briefing.",
    today,
    highestPriority,
    recommendedNextAction: highestPriority
      ? {
          label: `${highestPriority.actionLabel} — ${highestPriority.title}`,
          href: highestPriority.href,
          actionLabel: highestPriority.actionLabel
        }
      : null,
    waitingOnMe,
    waitingOnOthers,
    recommendedActions,
    quickWins:
      quickWins.length > 0
        ? quickWins
        : input.mission.slice(0, 3).map((row) => ({
            id: `qw-${row.id}`,
            label: `Review ${row.label}`,
            reason: "Quick operator check-in.",
            href: row.href,
            actionLabel: "Open"
          })),
    operationalTimeline: buildOperationalTimeline(input.recentActivity),
    caughtUp,
    caughtUpSuggestions: [
      { label: "Review platform health", href: "/master-admin/health" },
      { label: "Open Workspace Launcher", href: "/master-admin#workspace-launcher" },
      { label: "Check integrations", href: "/master-admin/integrations" }
    ]
  };
}
