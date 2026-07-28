/**
 * OPS-001 Slice D — Operational Analytics.
 * Materialize org-scoped KPIs from OPS substrate (events / tasks / automation / AI).
 * No parallel metrics bus; no customer BI redesign.
 */

import { createServiceRoleServerClient } from "../auth/server";
import { emitOpsDomainEvent } from "./emit";
import type { OpsDbClient } from "./types";

export type KpiKey =
  | "tasks.open"
  | "tasks.completed_7d"
  | "tasks.aging_gt_72h"
  | "workflows.active"
  | "workflows.failed_7d"
  | "workflows.completed_7d"
  | "automation.fires_7d"
  | "automation.failed_7d"
  | "automation.success_rate_7d"
  | "ai.recommendations_pending"
  | "ai.recommendations_applied_7d"
  | "sla.overdue_tasks"
  | "queue.pending_events"
  | "notify.delivered_7d"
  | "notify.failed_7d";

export type KpiSnapshot = {
  snapshotId: string;
  organizationId: string;
  windowStart: string;
  windowEnd: string;
  kpiKey: string;
  kpiValue: number;
  unit: string | null;
  meta: Record<string, unknown>;
  computedAt: string;
};

function serviceClient(): OpsDbClient {
  return createServiceRoleServerClient() as unknown as OpsDbClient;
}

function mapSnapshot(row: Record<string, unknown>): KpiSnapshot {
  return {
    snapshotId: String(row["snapshot_id"]),
    organizationId: String(row["organization_id"]),
    windowStart: String(row["window_start"]),
    windowEnd: String(row["window_end"]),
    kpiKey: String(row["kpi_key"]),
    kpiValue: Number(row["kpi_value"] ?? 0),
    unit: typeof row["unit"] === "string" ? row["unit"] : null,
    meta: (row["meta"] as Record<string, unknown>) ?? {},
    computedAt: String(row["computed_at"])
  };
}

async function countExact(
  client: OpsDbClient,
  table: string,
  filters: (q: ReturnType<OpsDbClient["from"]>) => ReturnType<OpsDbClient["from"]>
): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = client.from(table).select("*", { count: "exact", head: true });
  query = filters(query);
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function upsertKpi(
  client: OpsDbClient,
  input: {
    organizationId: string;
    windowStart: string;
    windowEnd: string;
    kpiKey: KpiKey;
    kpiValue: number;
    unit?: string | null;
    meta?: Record<string, unknown>;
  }
): Promise<void> {
  const { error } = await client.from("ops_kpi_snapshots").upsert(
    {
      organization_id: input.organizationId,
      window_start: input.windowStart,
      window_end: input.windowEnd,
      kpi_key: input.kpiKey,
      kpi_value: input.kpiValue,
      unit: input.unit ?? "count",
      meta: input.meta ?? {},
      computed_at: new Date().toISOString()
    },
    { onConflict: "organization_id,kpi_key,window_start,window_end" }
  );
  if (error) throw new Error(error.message);
}

export async function materializeOrgKpis(
  organizationId: string,
  client?: OpsDbClient
): Promise<{ organizationId: string; kpiCount: number }> {
  const db = client ?? serviceClient();
  const windowEnd = new Date();
  const windowStart = new Date(windowEnd.getTime() - 7 * 24 * 3600_000);
  const windowStartIso = windowStart.toISOString();
  const windowEndIso = windowEnd.toISOString();
  const agingCutoff = new Date(Date.now() - 72 * 3600_000).toISOString();

  const openTasks = await countExact(db, "ops_tasks", (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any).eq("organization_id", organizationId).in("status", ["open", "in_progress", "blocked"])
  );

  const completed7d = await countExact(db, "ops_tasks", (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any)
      .eq("organization_id", organizationId)
      .eq("status", "done")
      .gte("updated_at", windowStartIso)
  );

  const aging = await countExact(db, "ops_tasks", (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any)
      .eq("organization_id", organizationId)
      .in("status", ["open", "in_progress", "blocked"])
      .lt("created_at", agingCutoff)
  );

  const overdueSla = await countExact(db, "ops_tasks", (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any)
      .eq("organization_id", organizationId)
      .in("status", ["open", "in_progress", "blocked"])
      .lt("due_at", windowEndIso)
  );

  const workflowsActive = await countExact(db, "ops_workflow_instances", (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any).eq("organization_id", organizationId).eq("status", "active")
  );

  const workflowsCompleted = await countExact(db, "ops_workflow_instances", (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any)
      .eq("organization_id", organizationId)
      .eq("status", "completed")
      .gte("updated_at", windowStartIso)
  );

  const workflowsFailed = await countExact(db, "ops_workflow_instances", (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any)
      .eq("organization_id", organizationId)
      .in("status", ["failed", "canceled"])
      .gte("updated_at", windowStartIso)
  );

  const autoFires = await countExact(db, "ops_automation_fires", (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any).eq("organization_id", organizationId).gte("created_at", windowStartIso)
  );

  const autoFailed = await countExact(db, "ops_automation_fires", (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any)
      .eq("organization_id", organizationId)
      .eq("status", "failed")
      .gte("created_at", windowStartIso)
  );

  const autoSucceeded = await countExact(db, "ops_automation_fires", (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any)
      .eq("organization_id", organizationId)
      .eq("status", "succeeded")
      .gte("created_at", windowStartIso)
  );

  const successRate =
    autoFires === 0 ? 100 : Math.round((autoSucceeded / autoFires) * 1000) / 10;

  const aiPending = await countExact(db, "ops_ai_recommendations", (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any).eq("organization_id", organizationId).eq("status", "pending")
  );

  const aiApplied = await countExact(db, "ops_ai_recommendations", (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any)
      .eq("organization_id", organizationId)
      .eq("status", "applied")
      .gte("applied_at", windowStartIso)
  );

  const queuePending = await countExact(db, "event_domain_events", (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any)
      .eq("organization_id", organizationId)
      .in("dispatch_status", ["pending", "failed"])
  );

  const notifyDelivered = await countExact(db, "event_domain_events", (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any)
      .eq("organization_id", organizationId)
      .eq("event_type", "ops.notification.delivered")
      .gte("occurred_at", windowStartIso)
  );

  const notifyFailed = await countExact(db, "event_domain_events", (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any)
      .eq("organization_id", organizationId)
      .eq("event_type", "ops.notification.failed")
      .gte("occurred_at", windowStartIso)
  );

  const kpis: Array<{ key: KpiKey; value: number; unit?: string }> = [
    { key: "tasks.open", value: openTasks },
    { key: "tasks.completed_7d", value: completed7d },
    { key: "tasks.aging_gt_72h", value: aging },
    { key: "sla.overdue_tasks", value: overdueSla },
    { key: "workflows.active", value: workflowsActive },
    { key: "workflows.completed_7d", value: workflowsCompleted },
    { key: "workflows.failed_7d", value: workflowsFailed },
    { key: "automation.fires_7d", value: autoFires },
    { key: "automation.failed_7d", value: autoFailed },
    { key: "automation.success_rate_7d", value: successRate, unit: "percent" },
    { key: "ai.recommendations_pending", value: aiPending },
    { key: "ai.recommendations_applied_7d", value: aiApplied },
    { key: "queue.pending_events", value: queuePending },
    { key: "notify.delivered_7d", value: notifyDelivered },
    { key: "notify.failed_7d", value: notifyFailed }
  ];

  for (const kpi of kpis) {
    await upsertKpi(db, {
      organizationId,
      windowStart: windowStartIso,
      windowEnd: windowEndIso,
      kpiKey: kpi.key,
      kpiValue: kpi.value,
      unit: kpi.unit ?? "count",
      meta: { windowDays: 7 }
    });
  }

  await emitOpsDomainEvent(db, {
    eventType: "ops.kpi.materialized",
    organizationId,
    subject: { type: "organization", id: organizationId },
    actor: { actor_type: "system" },
    summary: `Operational KPIs materialized (${kpis.length})`,
    payload: {
      summary: `Operational KPIs materialized (${kpis.length})`,
      kpiCount: kpis.length,
      windowStart: windowStartIso,
      windowEnd: windowEndIso
    }
  });

  return { organizationId, kpiCount: kpis.length };
}

export async function materializeAllOrgKpis(client?: OpsDbClient): Promise<{
  orgs: number;
  kpiTotal: number;
}> {
  const db = client ?? serviceClient();
  const { data, error } = await db
    .from("organization_memberships")
    .select("organization_id")
    .eq("status", "active")
    .limit(5000);
  if (error) throw new Error(error.message);

  const orgIds = [
    ...new Set(
      ((data ?? []) as Array<{ organization_id: string }>).map((r) => r.organization_id)
    )
  ];

  let kpiTotal = 0;
  for (const orgId of orgIds) {
    const result = await materializeOrgKpis(orgId, db);
    kpiTotal += result.kpiCount;
  }
  return { orgs: orgIds.length, kpiTotal };
}

export async function listKpiSnapshots(input: {
  organizationId: string;
  kpiKeys?: string[];
  limit?: number;
}): Promise<KpiSnapshot[]> {
  const db = serviceClient();
  let query = db
    .from("ops_kpi_snapshots")
    .select("*")
    .eq("organization_id", input.organizationId)
    .order("computed_at", { ascending: false })
    .limit(input.limit ?? 200);

  if (input.kpiKeys?.length) {
    query = query.in("kpi_key", input.kpiKeys);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(mapSnapshot);
}

export async function getOperationalAnalyticsSummary(organizationId: string): Promise<{
  organizationId: string;
  kpis: Record<string, number>;
  computedAt: string | null;
}> {
  const snapshots = await listKpiSnapshots({ organizationId, limit: 50 });
  const latestByKey = new Map<string, KpiSnapshot>();
  for (const snap of snapshots) {
    if (!latestByKey.has(snap.kpiKey)) latestByKey.set(snap.kpiKey, snap);
  }
  const kpis: Record<string, number> = {};
  let computedAt: string | null = null;
  for (const [key, snap] of latestByKey) {
    kpis[key] = snap.kpiValue;
    if (!computedAt || snap.computedAt > computedAt) computedAt = snap.computedAt;
  }
  return { organizationId, kpis, computedAt };
}
