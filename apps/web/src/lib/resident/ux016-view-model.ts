/**
 * STD-001 operational remediation — map Resident portal signals → Universal Dashboard Framework.
 * Presentation only; calm Resident specialization. Existing portal signals only.
 */

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

export type ResidentAttentionSignal = {
  id: string;
  title: string;
  body: string;
  href: string;
  critical: boolean;
  unread: boolean;
  timeSensitive: boolean;
  createdAt: string;
  kind: "announcement" | "notification" | "message";
};

export type ResidentTodaySignal = {
  id: string;
  title: string;
  description: string;
  href: string;
};

function pushAttention(items: UniversalAttentionItem[], item: UniversalAttentionItem) {
  if (items.length >= 5) return;
  items.push(item);
}

export function buildResidentUniversalDashboardViewModel(input: {
  firstName: string;
  propertyName: string | null;
  unitNumber: string | null;
  hasLinkedTenant: boolean;
  attentionItems: ResidentAttentionSignal[];
  todayCards: ResidentTodaySignal[];
  timeGreeting?: string;
  dateLabel?: string;
}): UniversalDashboardViewModel {
  const attention: UniversalAttentionItem[] = [];

  for (const item of input.attentionItems) {
    pushAttention(attention, {
      id: item.id,
      title: item.title,
      reason: item.body || (item.critical ? "Needs your attention" : item.unread ? "New for you" : "Update"),
      href: item.href,
      actionLabel: "Open",
      severity: item.critical ? "critical" : item.timeSensitive || item.unread ? "high" : "normal"
    });
  }

  for (const card of input.todayCards) {
    if (attention.some((a) => a.href === card.href)) continue;
    const severity =
      card.id === "rent-due" || card.id === "rent-alert"
        ? "high"
        : card.id === "open-maintenance"
          ? "high"
          : "normal";
    pushAttention(attention, {
      id: `today-${card.id}`,
      title: card.title,
      reason: card.description,
      href: card.href,
      actionLabel: "Open",
      severity
    });
  }

  const mission: UniversalMissionItem[] = [];
  for (const card of input.todayCards) {
    mission.push({
      id: `mission-${card.id}`,
      label: card.title.toLowerCase(),
      count: 1,
      href: card.href
    });
  }
  const unreadCount = input.attentionItems.filter((item) => item.unread).length;
  if (unreadCount > 0 && !mission.some((row) => row.id === "mission-recent-messages")) {
    mission.push({
      id: "mission-unread",
      label: "updates for you",
      count: unreadCount,
      href: "/portal/tenant/notifications"
    });
  }

  const waitingOnMe: AssistantWaitingItem[] = [];
  const rentCard = input.todayCards.find((card) => card.id === "rent-due" || card.id === "rent-alert");
  if (rentCard) {
    waitingOnMe.push({
      id: "wait-me-rent",
      label: rentCard.title,
      detail: rentCard.description,
      href: rentCard.href
    });
  }
  const messageCard = input.todayCards.find((card) => card.id === "recent-messages");
  if (messageCard) {
    waitingOnMe.push({
      id: "wait-me-messages",
      label: messageCard.title,
      detail: messageCard.description,
      href: messageCard.href
    });
  }

  const waitingOnOthers: AssistantWaitingItem[] = [];
  const maintenanceCard = input.todayCards.find((card) => card.id === "open-maintenance");
  if (maintenanceCard) {
    waitingOnOthers.push({
      id: "wait-others-maintenance",
      label: "Maintenance in progress",
      detail: maintenanceCard.description,
      href: maintenanceCard.href
    });
  }

  const quickActions: UniversalQuickAction[] = [
    { id: "qa-pay", label: "Pay rent", href: "/portal/tenant/payments" },
    { id: "qa-maintenance", label: "Request maintenance", href: "/portal/tenant/maintenance/new" },
    { id: "qa-messages", label: "Message office", href: "/portal/tenant/messages" },
    { id: "qa-documents", label: "View documents", href: "/portal/tenant/documents" },
    { id: "qa-announcements", label: "Announcements", href: "/portal/tenant/announcements" },
    { id: "qa-more", label: "More", href: "/portal/tenant/more" }
  ];

  const recentActivity: UniversalActivityItem[] = input.attentionItems.slice(0, 6).map((item) => ({
    id: `act-${item.id}`,
    summary: item.title,
    meta: item.kind,
    href: item.href
  }));

  const placeParts = [input.propertyName, input.unitNumber ? `Unit ${input.unitNumber}` : null].filter(
    Boolean
  ) as string[];
  const placeLabel = placeParts.length
    ? placeParts.join(" · ")
    : input.hasLinkedTenant
      ? "Your home"
      : "Resident portal";

  const insights: UniversalInsightItem[] = [];
  if (input.hasLinkedTenant) {
    insights.push({
      id: "insight-home",
      label: "Home",
      value: placeLabel,
      href: "/portal/tenant"
    });
  }
  if (input.todayCards.length > 0) {
    insights.push({
      id: "insight-today",
      label: "Today’s items",
      value: String(input.todayCards.length),
      href: "/portal/tenant"
    });
  }

  return assembleUniversalHome({
    surfaceLabel: "Resident Home",
    timeGreeting: input.timeGreeting ?? timeGreetingFromNow(),
    userName: input.firstName || null,
    organizationName: null,
    placeLabel,
    dateLabel: input.dateLabel ?? dateLabelFromNow(),
    supportingLine: "A calm view of what matters at your home today.",
    attention: attention.slice(0, 5),
    mission: mission.slice(0, 8),
    quickActions: quickActions.slice(0, 6),
    recentActivity,
    insights,
    waitingOnMe,
    waitingOnOthers
  });
}
