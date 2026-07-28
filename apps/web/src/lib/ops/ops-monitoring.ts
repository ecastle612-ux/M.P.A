/**
 * OPS-001 Slice D — Operational monitoring (API/query plane).
 * Workflow failures · automation failures · queue health · latency · execution status.
 * No Command Center homepage.
 */

import { createServiceRoleServerClient } from "../auth/server";
import { getOutboxLagMetrics, type OutboxLagMetrics } from "./metrics";
import type { OpsDbClient } from "./types";

export type OpsMonitoringSnapshot = {
  organizationId: string;
  observedAt: string;
  queue: OutboxLagMetrics & { orgPending: number; orgFailed: number; orgDead: number };
  workflows: {
    active: number;
    failed7d: number;
    completed7d: number;
  };
  automation: {
    succeeded7d: number;
    failed7d: number;
    awaitingApproval: number;
    recentFailures: Array<{
      fireId: string;
      ruleId: string;
      errorMessage: string | null;
      createdAt: string;
    }>;
  };
  aiDirector: {
    pending: number;
    rejected7d: number;
    applied7d: number;
  };
  latency: {
    oldestPendingEventAt: string | null;
    lagSeconds: number | null;
    avgAutomationFireAgeSeconds: number | null;
  };
  executionStatus: "healthy" | "degraded" | "critical";
};

function serviceClient(): OpsDbClient {
  return createServiceRoleServerClient() as unknown as OpsDbClient;
}

async function countOrg(
  client: OpsDbClient,
  table: string,
  organizationId: string,
  extra?: (q: unknown) => unknown
): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = client
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId);
  if (extra) query = extra(query);
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getOpsMonitoringSnapshot(
  organizationId: string,
  client?: OpsDbClient
): Promise<OpsMonitoringSnapshot> {
  const db = client ?? serviceClient();
  const windowStart = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
  const globalQueue = await getOutboxLagMetrics(db);

  const orgPending = await countOrg(db, "event_domain_events", organizationId, (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any).eq("dispatch_status", "pending")
  );
  const orgFailed = await countOrg(db, "event_domain_events", organizationId, (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any).eq("dispatch_status", "failed")
  );
  const orgDead = await countOrg(db, "event_domain_events", organizationId, (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any).eq("dispatch_status", "dead")
  );

  const workflowsActive = await countOrg(db, "ops_workflow_instances", organizationId, (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any).eq("status", "active")
  );
  const workflowsFailed = await countOrg(db, "ops_workflow_instances", organizationId, (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any).in("status", ["failed", "canceled"]).gte("updated_at", windowStart)
  );
  const workflowsCompleted = await countOrg(db, "ops_workflow_instances", organizationId, (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any).eq("status", "completed").gte("updated_at", windowStart)
  );

  const autoSucceeded = await countOrg(db, "ops_automation_fires", organizationId, (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any).eq("status", "succeeded").gte("created_at", windowStart)
  );
  const autoFailed = await countOrg(db, "ops_automation_fires", organizationId, (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any).eq("status", "failed").gte("created_at", windowStart)
  );
  const autoAwaiting = await countOrg(db, "ops_automation_fires", organizationId, (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any).eq("status", "awaiting_approval")
  );

  const { data: failureRows } = await db
    .from("ops_automation_fires")
    .select("fire_id, rule_id, error_message, created_at")
    .eq("organization_id", organizationId)
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(10);

  const aiPending = await countOrg(db, "ops_ai_recommendations", organizationId, (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any).eq("status", "pending")
  );
  const aiRejected = await countOrg(db, "ops_ai_recommendations", organizationId, (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any).eq("status", "rejected").gte("approved_at", windowStart)
  );
  const aiApplied = await countOrg(db, "ops_ai_recommendations", organizationId, (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any).eq("status", "applied").gte("applied_at", windowStart)
  );

  const { data: recentFires } = await db
    .from("ops_automation_fires")
    .select("created_at, completed_at")
    .eq("organization_id", organizationId)
    .not("completed_at", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);

  let avgAutomationFireAgeSeconds: number | null = null;
  if (recentFires && recentFires.length > 0) {
    const ages = (recentFires as Array<{ created_at: string; completed_at: string }>)
      .map((r) => {
        const start = new Date(r.created_at).getTime();
        const end = new Date(r.completed_at).getTime();
        return Math.max(0, (end - start) / 1000);
      })
      .filter((n) => Number.isFinite(n));
    if (ages.length > 0) {
      avgAutomationFireAgeSeconds =
        Math.round((ages.reduce((a, b) => a + b, 0) / ages.length) * 10) / 10;
    }
  }

  let executionStatus: OpsMonitoringSnapshot["executionStatus"] = "healthy";
  if (
    orgDead > 0 ||
    (globalQueue.lagSeconds != null && globalQueue.lagSeconds > 900) ||
    autoFailed > 20
  ) {
    executionStatus = "critical";
  } else if (
    orgFailed > 0 ||
    workflowsFailed > 0 ||
    autoFailed > 0 ||
    (globalQueue.lagSeconds != null && globalQueue.lagSeconds > 180)
  ) {
    executionStatus = "degraded";
  }

  return {
    organizationId,
    observedAt: new Date().toISOString(),
    queue: {
      ...globalQueue,
      orgPending,
      orgFailed,
      orgDead
    },
    workflows: {
      active: workflowsActive,
      failed7d: workflowsFailed,
      completed7d: workflowsCompleted
    },
    automation: {
      succeeded7d: autoSucceeded,
      failed7d: autoFailed,
      awaitingApproval: autoAwaiting,
      recentFailures: (
        (failureRows ?? []) as Array<{
          fire_id: string;
          rule_id: string;
          error_message: string | null;
          created_at: string;
        }>
      ).map((r) => ({
        fireId: r.fire_id,
        ruleId: r.rule_id,
        errorMessage: r.error_message,
        createdAt: r.created_at
      }))
    },
    aiDirector: {
      pending: aiPending,
      rejected7d: aiRejected,
      applied7d: aiApplied
    },
    latency: {
      oldestPendingEventAt: globalQueue.oldestPendingAt,
      lagSeconds: globalQueue.lagSeconds,
      avgAutomationFireAgeSeconds
    },
    executionStatus
  };
}
