/**
 * STD-001 remediation — map migration jobs/metrics → Universal Dashboard Framework.
 * Presentation only. Immediate Attention prioritizes blockers first.
 */

import type { MigrationJobRecord } from "./contracts";
import type { MigrationDashboardMetrics } from "./server";
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

/** Actual MigrationJobStatus values that block go-live. */
const BLOCKER_STATUSES = new Set(["failed", "rolled_back"]);

/** Jobs still in-flight (not completed / cancelled / failed terminal). */
const ACTIVE_STATUSES = new Set([
  "draft",
  "source_selected",
  "files_uploaded",
  "mapped",
  "preview_ready",
  "importing"
]);

function isBlockerJob(job: MigrationJobRecord): boolean {
  const status = job.status.toLowerCase();
  if (BLOCKER_STATUSES.has(status)) return true;
  if ((job.progressErrors ?? 0) > 0 && status !== "completed") return true;
  return false;
}

export function buildMigrationUniversalDashboardViewModel(input: {
  jobs: MigrationJobRecord[];
  metrics: MigrationDashboardMetrics;
  canCreate: boolean;
  userName?: string | null;
  organizationName?: string | null;
  timeGreeting?: string;
  dateLabel?: string;
}): UniversalDashboardViewModel {
  const { jobs, metrics, canCreate } = input;
  const blockerJobs = jobs.filter(isBlockerJob);
  const activeJobs = jobs.filter((job) => ACTIVE_STATUSES.has(job.status.toLowerCase()));
  const rollbackJobs = jobs.filter(
    (job) => Boolean(job.rolledBackAt) || job.status.toLowerCase() === "rolled_back"
  );

  const attention: UniversalAttentionItem[] = [];
  // Blockers first
  for (const job of blockerJobs.slice(0, 3)) {
    attention.push({
      id: `mig-block-${job.id}`,
      title: `Migration blocker — ${job.name}`,
      reason: `${job.status.replaceAll("_", " ")}${job.progressErrors ? ` · ${job.progressErrors} error(s)` : ""}`,
      href: `/migration/${job.id}`,
      actionLabel: "Resolve",
      severity: "critical"
    });
  }
  if (metrics.recentErrors > 0 && attention.length < 5) {
    attention.push({
      id: "mig-import-errors",
      title: "Failed imports / validation issues",
      reason: `${metrics.recentErrors} recent import error${metrics.recentErrors === 1 ? "" : "s"}`,
      href: "/migration",
      actionLabel: "Review errors",
      severity: "critical"
    });
  }
  if (metrics.pendingReview > 0 && attention.length < 5) {
    attention.push({
      id: "mig-pending-review",
      title: "Outstanding mapping / review tasks",
      reason: `${metrics.pendingReview} item${metrics.pendingReview === 1 ? "" : "s"} pending review`,
      href: metrics.pendingReviewSample[0]?.href ?? "/migration",
      actionLabel: "Map data",
      severity: "high"
    });
  }
  for (const sample of metrics.pendingReviewSample.slice(0, 2)) {
    if (attention.length >= 5) break;
    attention.push({
      id: `mig-review-${sample.id}`,
      title: sample.title,
      reason: `Pending review · ${sample.itemType}`,
      href: sample.href,
      actionLabel: "Open",
      severity: "high"
    });
  }

  const mission: UniversalMissionItem[] = [];
  if (metrics.activeJobs > 0) {
    mission.push({
      id: "mission-active",
      label: "organizations / jobs migrating",
      count: metrics.activeJobs,
      href: "/migration"
    });
  }
  if (metrics.pendingReview > 0) {
    mission.push({
      id: "mission-mapping",
      label: "outstanding mapping tasks",
      count: metrics.pendingReview,
      href: "/migration"
    });
  }
  if (metrics.recentErrors > 0) {
    mission.push({
      id: "mission-failed",
      label: "failed imports",
      count: metrics.recentErrors,
      href: "/migration"
    });
  }
  if (metrics.completedJobs > 0) {
    mission.push({
      id: "mission-completed",
      label: "recent completions",
      count: metrics.completedJobs,
      href: "/migration"
    });
  }
  if (rollbackJobs.length > 0) {
    mission.push({
      id: "mission-rollback",
      label: "rollback status items",
      count: rollbackJobs.length,
      href: "/migration"
    });
  }

  const waitingOnMe: AssistantWaitingItem[] = [];
  if (metrics.pendingReview > 0) {
    waitingOnMe.push({
      id: "me-mapping",
      label: "Mapping / validation decisions",
      detail: `${metrics.pendingReview} review task(s)`,
      href: "/migration"
    });
  }
  if (blockerJobs.length > 0) {
    waitingOnMe.push({
      id: "me-blockers",
      label: "Blocker resolution",
      detail: `${blockerJobs.length} blocked job(s)`,
      href: `/migration/${blockerJobs[0]!.id}`
    });
  }

  const waitingOnOthers: AssistantWaitingItem[] = [];
  if (activeJobs.length > 0) {
    waitingOnOthers.push({
      id: "others-import",
      label: "Waiting for import progress",
      detail: `${activeJobs.length} job(s) in flight`,
      href: "/migration"
    });
  }
  if (metrics.averageCompletionPct > 0 && metrics.averageCompletionPct < 100 && metrics.activeJobs > 0) {
    waitingOnOthers.push({
      id: "others-completion",
      label: "Waiting for migration completion",
      detail: `Avg completion ${metrics.averageCompletionPct}%`,
      href: "/migration"
    });
  }

  const quickActions: UniversalQuickAction[] = [
    { id: "qa-bulk", label: "Bulk resident ops", href: "/residents/bulk" },
    { id: "qa-properties", label: "Properties", href: "/properties" },
    { id: "qa-activity", label: "Activity", href: "/activity" }
  ];
  if (canCreate) {
    quickActions.unshift({ id: "qa-start", label: "Start new migration", href: "/migration/new" });
  }

  const recentActivity: UniversalActivityItem[] = metrics.recentActivity.slice(0, 10).map((entry) => ({
    id: entry.id,
    summary: entry.summary,
    meta: `${entry.eventType} · ${entry.jobNumber} · ${new Date(entry.createdAt).toLocaleString()}`,
    href: entry.href
  }));
  if (recentActivity.length === 0) {
    for (const item of metrics.recentImports.slice(0, 5)) {
      recentActivity.push({
        id: `import-${item.id}`,
        summary: `Migration ${item.status.replaceAll("_", " ")} — ${item.name}`,
        meta: `${item.jobNumber} · ${item.completionPct}%`,
        href: item.href
      });
    }
  }

  const insights: UniversalInsightItem[] = [
    {
      id: "insight-active",
      label: "Active jobs",
      value: String(metrics.activeJobs),
      href: "/migration"
    },
    {
      id: "insight-completed",
      label: "Completed",
      value: String(metrics.completedJobs),
      href: "/migration"
    },
    {
      id: "insight-errors",
      label: "Import errors",
      value: String(metrics.recentErrors),
      href: "/migration"
    },
    {
      id: "insight-avg",
      label: "Avg completion",
      value: `${metrics.averageCompletionPct}%`,
      href: "/migration"
    },
    {
      id: "insight-health",
      label: "Migration health",
      value: blockerJobs.length + metrics.recentErrors > 0 ? "Needs attention" : "Healthy",
      href: "/migration"
    },
    {
      id: "insight-rollback",
      label: "Rollback status",
      value: String(rollbackJobs.length),
      href: "/migration"
    }
  ];

  return assembleUniversalHome({
    surfaceLabel: "Migration Operations",
    timeGreeting: input.timeGreeting ?? timeGreetingFromNow(),
    userName: input.userName ?? null,
    organizationName: input.organizationName ?? null,
    placeLabel:
      blockerJobs.length + metrics.recentErrors > 0
        ? "Migration health · Blockers present"
        : "Migration health · On track",
    dateLabel: input.dateLabel ?? dateLabelFromNow(),
    supportingLine: "Here’s your migration operational briefing.",
    attention: attention.slice(0, 5),
    mission,
    quickActions: quickActions.slice(0, 6),
    recentActivity,
    insights,
    waitingOnMe,
    waitingOnOthers
  });
}
