/**
 * OPS-001 Slice E — Universal Command Center homepage composition.
 * Single OPS-powered landing composition from A–D engines. No parallel home bus.
 */

import { listAiRecommendations, type OpsAiRecommendation } from "./ai-director";
import { getOperationalAnalyticsSummary } from "./operational-analytics";
import { getOpsMonitoringSnapshot } from "./ops-monitoring";
import { listQuickActionsForContext, type QuickActionDefinition } from "./quick-actions";
import { listOrgActivityTimeline } from "./timeline-query";
import { listOpsTasksByPriority, type OpsTaskRecord } from "./task-engine";
import { listUnifiedInbox, type UnifiedInboxItem } from "./unified-inbox";

export type CommandCenterHomeComposition = {
  organizationId: string;
  principalId: string;
  rolePlane: string;
  composedAt: string;
  priorityTasks: OpsTaskRecord[];
  inboxUnreadCount: number;
  inboxPreview: UnifiedInboxItem[];
  aiRecommendations: OpsAiRecommendation[];
  recentActivity: Array<{
    eventType: string;
    summary: string;
    occurredAt: string;
    href: string | null;
  }>;
  quickActions: QuickActionDefinition[];
  kpis: Record<string, number>;
  monitoring: {
    executionStatus: string;
    queuePending: number;
    workflowsActive: number;
    automationFailed7d: number;
    lagSeconds: number | null;
  };
  alerts: Array<{ title: string; priority: string; href: string }>;
};

export async function composeCommandCenterHome(input: {
  organizationId: string;
  principalId: string;
  rolePlane: string;
  permissions: readonly string[];
}): Promise<CommandCenterHomeComposition> {
  const [
    priorityTasks,
    inbox,
    aiRecommendations,
    timeline,
    kpis,
    monitoring,
    quickActions
  ] = await Promise.all([
    listOpsTasksByPriority({
      organizationId: input.organizationId,
      status: ["open", "in_progress", "blocked"],
      limit: 12
    }),
    listUnifiedInbox({
      organizationId: input.organizationId,
      principalId: input.principalId,
      unreadOnly: true,
      limit: 8
    }),
    listAiRecommendations({
      organizationId: input.organizationId,
      status: ["pending"],
      limit: 8
    }),
    listOrgActivityTimeline(input.organizationId, { limit: 10 }).catch(() => []),
    getOperationalAnalyticsSummary(input.organizationId).catch(() => ({
      organizationId: input.organizationId,
      kpis: {} as Record<string, number>,
      computedAt: null
    })),
    getOpsMonitoringSnapshot(input.organizationId).catch(() => null),
    Promise.resolve(
      listQuickActionsForContext({
        rolePlane: input.rolePlane,
        permissions: input.permissions,
        context: "command_center"
      })
    )
  ]);

  const recentActivity = timeline.slice(0, 10).map((entry) => ({
    eventType: entry.eventType,
    summary: entry.summary,
    occurredAt: entry.occurredAt,
    href: entry.href
  }));

  const alerts: CommandCenterHomeComposition["alerts"] = [];
  if (monitoring?.executionStatus === "critical" || monitoring?.executionStatus === "degraded") {
    alerts.push({
      title: `Ops execution ${monitoring.executionStatus}`,
      priority: monitoring.executionStatus === "critical" ? "emergency" : "high",
      href: "/dashboard#ops-health"
    });
  }
  for (const rec of aiRecommendations.slice(0, 3)) {
    alerts.push({
      title: rec.title,
      priority: rec.requiresHumanGate ? "high" : "normal",
      href: "/inbox?kind=ai"
    });
  }

  return {
    organizationId: input.organizationId,
    principalId: input.principalId,
    rolePlane: input.rolePlane,
    composedAt: new Date().toISOString(),
    priorityTasks,
    inboxUnreadCount: inbox.unreadCount,
    inboxPreview: inbox.items,
    aiRecommendations,
    recentActivity,
    quickActions,
    kpis: kpis.kpis,
    monitoring: {
      executionStatus: monitoring?.executionStatus ?? "healthy",
      queuePending: monitoring?.queue.orgPending ?? 0,
      workflowsActive: monitoring?.workflows.active ?? 0,
      automationFailed7d: monitoring?.automation.failed7d ?? 0,
      lagSeconds: monitoring?.latency.lagSeconds ?? null
    },
    alerts
  };
}
