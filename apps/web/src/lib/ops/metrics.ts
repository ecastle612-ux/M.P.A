import { createServiceRoleServerClient } from "../auth/server";
import type { OpsDbClient } from "./types";

export type OutboxLagMetrics = {
  pendingCount: number;
  failedCount: number;
  deadCount: number;
  processingCount: number;
  oldestPendingAt: string | null;
  lagSeconds: number | null;
};

export async function getOutboxLagMetrics(client?: OpsDbClient): Promise<OutboxLagMetrics> {
  const db = client ?? (createServiceRoleServerClient() as unknown as OpsDbClient);

  const statuses = ["pending", "failed", "dead", "processing"] as const;
  const counts: Record<(typeof statuses)[number], number> = {
    pending: 0,
    failed: 0,
    dead: 0,
    processing: 0
  };

  for (const status of statuses) {
    const { count, error } = await db
      .from("event_domain_events")
      .select("event_id", { count: "exact", head: true })
      .eq("dispatch_status", status);
    if (error) throw new Error(error.message);
    counts[status] = count ?? 0;
  }

  const { data: oldest, error: oldestError } = await db
    .from("event_domain_events")
    .select("available_at, created_at")
    .in("dispatch_status", ["pending", "failed"])
    .order("available_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (oldestError) throw new Error(oldestError.message);

  const oldestPendingAt =
    (oldest as { available_at?: string; created_at?: string } | null)?.available_at ??
    (oldest as { created_at?: string } | null)?.created_at ??
    null;

  const lagSeconds = oldestPendingAt
    ? Math.max(0, Math.floor((Date.now() - new Date(oldestPendingAt).getTime()) / 1000))
    : null;

  return {
    pendingCount: counts.pending,
    failedCount: counts.failed,
    deadCount: counts.dead,
    processingCount: counts.processing,
    oldestPendingAt,
    lagSeconds
  };
}
