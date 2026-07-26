import { createServiceRoleServerClient } from "../auth/server";
import { projectDomainEventRow } from "./timeline-projector";
import type { OpsDbClient } from "./types";

const MAX_ATTEMPTS = 8;
const RETRY_BASE_MS = 30_000;

type DomainEventRow = {
  event_id: string;
  event_type: string;
  event_version: number;
  occurred_at: string;
  organization_id: string | null;
  actor: Record<string, unknown>;
  subject: Record<string, unknown>;
  correlation_id: string;
  causation_id: string | null;
  payload: Record<string, unknown>;
  visibility: "ops" | "tenant" | "staff_only";
  sensitivity: "normal" | "restricted" | "privileged";
  attempts: number;
};

export type DispatchBatchResult = {
  claimed: number;
  processed: number;
  failed: number;
};

function serviceClient(): OpsDbClient {
  return createServiceRoleServerClient() as unknown as OpsDbClient;
}

async function markProcessed(client: OpsDbClient, eventId: string): Promise<void> {
  const { error } = await client
    .from("event_domain_events")
    .update({
      dispatch_status: "processed",
      processed_at: new Date().toISOString(),
      last_error: null,
      claimed_at: null,
      claimed_by: null
    })
    .eq("event_id", eventId);
  if (error) throw new Error(error.message);
}

async function markFailed(client: OpsDbClient, eventId: string, attempts: number, message: string): Promise<void> {
  const dead = attempts >= MAX_ATTEMPTS;
  const availableAt = new Date(Date.now() + RETRY_BASE_MS * Math.min(attempts, 6)).toISOString();
  const { error } = await client
    .from("event_domain_events")
    .update({
      dispatch_status: dead ? "dead" : "failed",
      last_error: message.slice(0, 2000),
      available_at: dead ? new Date().toISOString() : availableAt,
      claimed_at: null,
      claimed_by: null
    })
    .eq("event_id", eventId);
  if (error) throw new Error(error.message);
}

async function runConsumers(client: OpsDbClient, row: DomainEventRow): Promise<void> {
  await projectDomainEventRow(client, row as unknown as Parameters<typeof projectDomainEventRow>[1]);
  // Dynamic import avoids emit → dispatcher → notification-center → emit cycle.
  const { consumeEventForNotificationCenter } = await import("./notification-center");
  await consumeEventForNotificationCenter(client, {
    event_id: row.event_id,
    event_type: row.event_type,
    organization_id: row.organization_id,
    subject: row.subject as { type?: string; id?: string },
    payload: row.payload,
    visibility: row.visibility
  });
  // OPS-001 Slice C — Task / Workflow orchestration consumer.
  const { consumeEventForWorkflowOrchestration } = await import("./workflow-engine");
  await consumeEventForWorkflowOrchestration(client, {
    event_id: row.event_id,
    event_type: row.event_type,
    organization_id: row.organization_id,
    subject: row.subject as { type?: string; id?: string },
    payload: row.payload,
    correlation_id: row.correlation_id
  });
}

/**
 * Process a single outbox event through registered consumers
 * (TimelineProjector + Notification Center + Workflow Orchestration). Always uses service role.
 */
export async function processOutboxEvent(eventId: string): Promise<"processed" | "failed"> {
  const client = serviceClient();
  const { data, error } = await client
    .from("event_domain_events")
    .select(
      "event_id, event_type, event_version, occurred_at, organization_id, actor, subject, correlation_id, causation_id, payload, visibility, sensitivity, attempts, dispatch_status"
    )
    .eq("event_id", eventId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Outbox event not found");
  }

  const row = data as DomainEventRow & { dispatch_status: string };
  if (row.dispatch_status === "processed") return "processed";

  const nextAttempts = (row.attempts ?? 0) + 1;

  try {
    await client
      .from("event_domain_events")
      .update({
        dispatch_status: "processing",
        claimed_at: new Date().toISOString(),
        claimed_by: "inline",
        attempts: nextAttempts
      })
      .eq("event_id", eventId);

    await runConsumers(client, row);
    await markProcessed(client, eventId);
    return "processed";
  } catch (err) {
    const message = err instanceof Error ? err.message : "Dispatch failed";
    await markFailed(client, eventId, nextAttempts, message);
    return "failed";
  }
}

/**
 * Claim and dispatch a batch of pending/failed outbox events (service role).
 */
export async function dispatchPendingEvents(limit = 25): Promise<DispatchBatchResult> {
  const client = serviceClient();
  const { data, error } = await client.rpc("ops_claim_domain_events", {
    p_limit: limit,
    p_claimer: "ops-dispatcher"
  });

  if (error) {
    throw new Error(error.message ?? "Failed to claim domain events");
  }

  const rows = (data ?? []) as DomainEventRow[];
  let processed = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      await runConsumers(client, row);
      await markProcessed(client, row.event_id);
      processed += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Dispatch failed";
      await markFailed(client, row.event_id, row.attempts, message);
      failed += 1;
    }
  }

  return { claimed: rows.length, processed, failed };
}
