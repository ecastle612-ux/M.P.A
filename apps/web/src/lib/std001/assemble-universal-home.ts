/**
 * STD-001 compliance — assemble a UniversalDashboardViewModel from section arrays.
 * Reuses certified UX-016 Assistant builder. Presentation only.
 */

import { buildMpaAssistantFromUniversalSections } from "../dashboard/ux016-assistant";
import type {
  UniversalActivityItem,
  UniversalAttentionItem,
  UniversalDashboardViewModel,
  UniversalInsightItem,
  UniversalMissionItem,
  UniversalQuickAction
} from "../dashboard/ux016-view-model";
import type { AssistantWaitingItem } from "../dashboard/ux016-assistant";

export function assembleUniversalHome(input: {
  surfaceLabel: string;
  timeGreeting: string;
  userName: string | null;
  organizationName: string | null;
  placeLabel: string;
  dateLabel: string;
  supportingLine?: string;
  attention: UniversalAttentionItem[];
  mission: UniversalMissionItem[];
  quickActions: UniversalQuickAction[];
  recentActivity: UniversalActivityItem[];
  insights: UniversalInsightItem[];
  waitingOnMe?: AssistantWaitingItem[];
  waitingOnOthers?: AssistantWaitingItem[];
}): UniversalDashboardViewModel {
  const assistant = buildMpaAssistantFromUniversalSections({
    attention: input.attention,
    mission: input.mission,
    recentActivity: input.recentActivity,
    insights: input.insights,
    ...(input.waitingOnMe ? { waitingOnMe: input.waitingOnMe } : {}),
    ...(input.waitingOnOthers ? { waitingOnOthers: input.waitingOnOthers } : {})
  });

  const missionTotal = input.mission.reduce((sum, row) => sum + row.count, 0);
  const statusSummary =
    input.attention.length > 0
      ? input.attention.length === 1
        ? "1 item needs attention"
        : `${input.attention.length} items need attention`
      : missionTotal > 0
        ? `${missionTotal} items in today’s mission`
        : "You’re clear for now";

  return {
    greeting: {
      surfaceLabel: input.surfaceLabel,
      timeGreeting: input.timeGreeting,
      userName: input.userName,
      organizationName: input.organizationName,
      placeLabel: input.placeLabel,
      dateLabel: input.dateLabel,
      statusSummary,
      supportingLine: input.supportingLine ?? "Here’s your operational briefing."
    },
    assistant,
    attention: input.attention.slice(0, 5),
    mission: input.mission.slice(0, 8),
    quickActions: input.quickActions.slice(0, 6),
    recentActivity: assistant.operationalTimeline.length
      ? assistant.operationalTimeline
      : input.recentActivity.slice(0, 8),
    insights: input.insights.slice(0, 8)
  };
}

export function timeGreetingFromNow(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function dateLabelFromNow(now = new Date()): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(now);
}
