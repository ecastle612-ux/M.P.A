/**
 * UX-016 Slice B — map Mission Control snapshot into Universal Dashboard Framework.
 * Presentation only; reuses existing OperationsCenterSnapshot signals.
 */

import type {
  UniversalActivityItem,
  UniversalAttentionItem,
  UniversalDashboardViewModel,
  UniversalInsightItem,
  UniversalMissionItem,
  UniversalQuickAction
} from "../dashboard/ux016-view-model";
import { buildMpaAssistantFromUniversalSections } from "../dashboard/ux016-assistant";
import type { OperationsCenterSnapshot } from "./operations-center";
import { getMissionControlQuickActions } from "./workspace-catalog";

function mapSeverity(
  severity: "critical" | "warning" | "info"
): UniversalAttentionItem["severity"] {
  if (severity === "critical") return "critical";
  if (severity === "warning") return "high";
  return "normal";
}

function platformHealthSummary(snapshot: OperationsCenterSnapshot): {
  label: string;
  failedCount: number;
} {
  const healthItems = snapshot.attention.filter((item) => item.category === "platform");
  const integrationCritical = snapshot.attention.filter(
    (item) => item.category === "integration" && item.severity === "critical"
  );
  const failedCount = healthItems.length + integrationCritical.length;
  if (failedCount === 0) {
    return { label: "Platform Health · All clear", failedCount: 0 };
  }
  return {
    label:
      failedCount === 1
        ? "Platform Health · 1 issue needs attention"
        : `Platform Health · ${failedCount} issues need attention`,
    failedCount
  };
}

function statusSummary(attentionCount: number, healthFailed: number): string {
  if (healthFailed > 0 && attentionCount > 0) {
    return `${attentionCount} item${attentionCount === 1 ? "" : "s"} need attention · platform health degraded`;
  }
  if (attentionCount > 0) {
    return attentionCount === 1
      ? "1 item needs attention"
      : `${attentionCount} items need attention`;
  }
  if (healthFailed > 0) {
    return "Platform health needs review";
  }
  return "Platform clear — ready for operator work";
}

function insightFromKpi(
  snapshot: OperationsCenterSnapshot,
  id: string,
  fallbackLabel: string
): UniversalInsightItem | null {
  const kpi = snapshot.kpis.find((item) => item.id === id);
  if (!kpi) return null;
  return {
    id: kpi.id,
    label: fallbackLabel || kpi.label,
    value: kpi.available ? kpi.value : "—",
    href: kpi.href
  };
}

function buildMission(snapshot: OperationsCenterSnapshot): UniversalMissionItem[] {
  const items: UniversalMissionItem[] = [];
  const byCategory = (category: string) =>
    snapshot.attention.filter((item) => item.category === category).length;

  const support = byCategory("support") + byCategory("notifications");
  if (support > 0) {
    items.push({
      id: "mission-support",
      label: "Support & notifications",
      count: support,
      href: "/communications/inbox"
    });
  }

  const onboarding = byCategory("onboarding");
  if (onboarding > 0) {
    items.push({
      id: "mission-onboarding",
      label: "Onboarding / migration",
      count: onboarding,
      href: "/migration"
    });
  }

  const maintenance = byCategory("maintenance") + byCategory("operations");
  if (maintenance > 0) {
    items.push({
      id: "mission-maintenance",
      label: "Open maintenance pressure",
      count: maintenance,
      href: "/maintenance"
    });
  }

  const platform = byCategory("platform") + byCategory("integration");
  if (platform > 0) {
    items.push({
      id: "mission-platform",
      label: "Platform & integrations",
      count: platform,
      href: "/master-admin/health"
    });
  }

  const orgs = snapshot.kpis.find((k) => k.id === "organizations");
  if (orgs?.available) {
    items.push({
      id: "mission-orgs",
      label: "Organizations in directory",
      count: Number.parseInt(orgs.value, 10) || 0,
      href: "/master-admin/impersonation"
    });
  }

  if (items.length === 0) {
    items.push({
      id: "mission-portals",
      label: "Workspace surfaces ready",
      count: 3,
      href: "/master-admin#workspace-launcher"
    });
  }

  return items.slice(0, 6);
}

function buildRecentActivity(snapshot: OperationsCenterSnapshot): UniversalActivityItem[] {
  return snapshot.attention.slice(0, 8).map((item) => ({
    id: `activity-${item.id}`,
    summary: item.title,
    meta: [item.severity, item.category, item.context].filter(Boolean).join(" · "),
    href: item.href
  }));
}

function buildInsights(snapshot: OperationsCenterSnapshot): UniversalInsightItem[] {
  const health = platformHealthSummary(snapshot);
  const ordered: Array<UniversalInsightItem | null> = [
    insightFromKpi(snapshot, "organizations", "Organizations"),
    insightFromKpi(snapshot, "users", "Users") ??
      insightFromKpi(snapshot, "property-managers", "Users"),
    insightFromKpi(snapshot, "properties", "Properties"),
    insightFromKpi(snapshot, "open-work-orders", "Open Work Orders") ??
      insightFromKpi(snapshot, "open-maintenance", "Open Work Orders"),
    insightFromKpi(snapshot, "leases", "Leases"),
    insightFromKpi(snapshot, "support", "Support"),
    insightFromKpi(snapshot, "billing", "Billing") ??
      insightFromKpi(snapshot, "revenue", "Billing"),
    insightFromKpi(snapshot, "integrations", "Integrations"),
    {
      id: "platform-health",
      label: "Platform Health",
      value: health.failedCount === 0 ? "Healthy" : String(health.failedCount),
      href: "/master-admin/health"
    }
  ];
  return ordered.filter((item): item is UniversalInsightItem => item != null).slice(0, 12);
}

function buildQuickActions(masterAdminOnlyShell: boolean): UniversalQuickAction[] {
  return getMissionControlQuickActions(masterAdminOnlyShell)
    .slice(0, 6)
    .map((action, index) => ({
      id: `qa-${index}-${action.href}`,
      label: action.label,
      href: action.href
    }));
}

export function buildMasterAdminUniversalDashboardViewModel(input: {
  snapshot: OperationsCenterSnapshot;
  timeGreeting: string;
  dateLabel: string;
  masterAdminOnlyShell?: boolean;
}): UniversalDashboardViewModel {
  const { snapshot, timeGreeting, dateLabel, masterAdminOnlyShell = false } = input;
  const health = platformHealthSummary(snapshot);
  const attention: UniversalAttentionItem[] = snapshot.attention.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.title,
    reason: item.context ?? `${item.severity} · ${item.category}`,
    href: item.href,
    actionLabel: "Open",
    severity: mapSeverity(item.severity)
  }));

  const mission = buildMission(snapshot);
  const recentActivity = buildRecentActivity(snapshot);
  const insights = buildInsights(snapshot);
  const assistant = buildMpaAssistantFromUniversalSections({
    attention,
    mission,
    recentActivity,
    insights
  });

  return {
    greeting: {
      surfaceLabel: "Mission Control",
      timeGreeting,
      userName: snapshot.greetingName,
      organizationName: snapshot.activeOrganizationName,
      placeLabel: health.label,
      dateLabel,
      statusSummary: statusSummary(attention.length, health.failedCount),
      supportingLine: "Here’s your operational briefing."
    },
    assistant,
    attention,
    mission,
    quickActions: buildQuickActions(masterAdminOnlyShell),
    recentActivity: assistant.operationalTimeline.length
      ? assistant.operationalTimeline
      : recentActivity,
    insights
  };
}
