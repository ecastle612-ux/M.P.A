import { buildEnvelope, type EmitOpsEventInput, type OpsEventEnvelope } from "./envelope";
import { processOutboxEvent } from "./dispatcher";
import type { OpsDbClient } from "./types";

/**
 * Insert outbox row (pending). Caller should use the same Supabase client as the domain write.
 * Optionally runs immediate dispatch so TimelineProjector updates without waiting for cron.
 */
export async function emitOpsDomainEvent(
  client: OpsDbClient,
  input: EmitOpsEventInput,
  options?: { dispatchNow?: boolean }
): Promise<OpsEventEnvelope> {
  const envelope = buildEnvelope(input);

  const { error } = await client.from("event_domain_events").insert({
    event_id: envelope.eventId,
    event_type: envelope.eventType,
    event_version: envelope.eventVersion,
    occurred_at: envelope.occurredAt,
    organization_id: envelope.organizationId,
    actor: envelope.actor,
    subject: envelope.subject,
    correlation_id: envelope.correlationId,
    causation_id: envelope.causationId,
    payload: envelope.payload,
    visibility: envelope.visibility,
    sensitivity: envelope.sensitivity,
    dispatch_status: "pending"
  });

  if (error) {
    throw new Error(error.message ?? "Failed to write domain event outbox");
  }

  if (options?.dispatchNow !== false) {
    // Projection + status updates require service role (not the caller/member client).
    await processOutboxEvent(envelope.eventId);
  }

  return envelope;
}

export type RecordMaintenanceActivityWithOutboxInput = {
  organizationId: string;
  workOrderId: string;
  legacyEventType: string;
  summary: string;
  details: Record<string, unknown>;
  actorUserId: string | null;
  emit: EmitOpsEventInput;
};

/**
 * OA-02: insert legacy maintenance_activity_events + event_domain_events in one Postgres TX
 * via `ops_record_maintenance_activity_with_outbox`, then optionally dispatch.
 */
export async function recordMaintenanceActivityWithOutbox(
  client: OpsDbClient,
  input: RecordMaintenanceActivityWithOutboxInput,
  options?: { dispatchNow?: boolean }
): Promise<OpsEventEnvelope> {
  const envelope = buildEnvelope(input.emit);

  const { data, error } = await client.rpc("ops_record_maintenance_activity_with_outbox", {
    p_organization_id: input.organizationId,
    p_work_order_id: input.workOrderId,
    p_legacy_event_type: input.legacyEventType,
    p_summary: input.summary,
    p_details: input.details,
    p_actor_user_id: input.actorUserId,
    p_catalog_event_type: envelope.eventType,
    p_event_id: envelope.eventId,
    p_event_version: envelope.eventVersion,
    p_occurred_at: envelope.occurredAt,
    p_actor: envelope.actor,
    p_subject: envelope.subject,
    p_correlation_id: envelope.correlationId,
    p_causation_id: envelope.causationId,
    p_payload: envelope.payload,
    p_visibility: envelope.visibility,
    p_sensitivity: envelope.sensitivity
  });

  if (error) {
    throw new Error(error.message ?? "Failed same-TX activity + outbox write");
  }

  if (options?.dispatchNow !== false) {
    await processOutboxEvent(envelope.eventId);
  }

  // data is the event_id returned by the RPC (matches envelope.eventId when p_event_id is set).
  void data;
  return envelope;
}
