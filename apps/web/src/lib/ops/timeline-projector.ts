import { categoryForEventType } from "./catalog";
import { actorLabel, type OpsEventEnvelope } from "./envelope";
import type { OpsDbClient } from "./types";

export const TIMELINE_CONSUMER = "timeline_projector";

type DomainEventRow = {
  event_id: string;
  event_type: string;
  event_version: number;
  occurred_at: string;
  organization_id: string | null;
  actor: OpsEventEnvelope["actor"];
  subject: OpsEventEnvelope["subject"];
  correlation_id: string;
  causation_id: string | null;
  payload: Record<string, unknown>;
  visibility: OpsEventEnvelope["visibility"];
  sensitivity: OpsEventEnvelope["sensitivity"];
};

function rowToEnvelope(row: DomainEventRow): OpsEventEnvelope {
  return {
    eventId: row.event_id,
    eventType: row.event_type,
    eventVersion: row.event_version,
    occurredAt: row.occurred_at,
    organizationId: row.organization_id ?? "",
    actor: row.actor ?? { actor_type: "system" },
    subject: row.subject ?? { type: "unknown", id: row.event_id },
    correlationId: row.correlation_id,
    causationId: row.causation_id,
    payload: row.payload ?? {},
    visibility: row.visibility,
    sensitivity: row.sensitivity
  };
}

function summaryFor(envelope: OpsEventEnvelope): string {
  const fromPayload = envelope.payload["summary"];
  if (typeof fromPayload === "string" && fromPayload.trim()) return fromPayload.trim();
  return envelope.eventType.replace(/\./g, " ");
}

/**
 * Project a domain event into ops_activity_timeline. Idempotent on (org, event_id) + consumer receipt.
 */
export async function projectEventToTimeline(
  client: OpsDbClient,
  envelope: OpsEventEnvelope
): Promise<"projected" | "skipped"> {
  if (!envelope.organizationId) return "skipped";
  if (envelope.visibility === "staff_only") return "skipped";

  const { data: existingReceipt } = await client
    .from("ops_event_consumer_receipts")
    .select("event_id")
    .eq("event_id", envelope.eventId)
    .eq("consumer_name", TIMELINE_CONSUMER)
    .maybeSingle();

  if (existingReceipt) return "skipped";

  const propertyId =
    typeof envelope.payload["propertyId"] === "string"
      ? envelope.payload["propertyId"]
      : typeof envelope.payload["property_id"] === "string"
        ? envelope.payload["property_id"]
        : null;
  const unitId =
    typeof envelope.payload["unitId"] === "string"
      ? envelope.payload["unitId"]
      : typeof envelope.payload["unit_id"] === "string"
        ? envelope.payload["unit_id"]
        : null;
  const href = typeof envelope.payload["href"] === "string" ? envelope.payload["href"] : null;

  const { error: upsertError } = await client.from("ops_activity_timeline").upsert(
    {
      organization_id: envelope.organizationId,
      event_id: envelope.eventId,
      event_type: envelope.eventType,
      occurred_at: envelope.occurredAt,
      actor_label: actorLabel(envelope.actor),
      summary: summaryFor(envelope),
      category: categoryForEventType(envelope.eventType),
      visibility: envelope.visibility,
      subject_type: envelope.subject.type,
      subject_id: envelope.subject.id,
      property_id: propertyId,
      unit_id: unitId,
      href,
      payload: envelope.payload
    },
    { onConflict: "organization_id,event_id" }
  );

  if (upsertError) {
    throw new Error(upsertError.message ?? "Timeline project failed");
  }

  const { error: receiptError } = await client.from("ops_event_consumer_receipts").upsert(
    {
      event_id: envelope.eventId,
      consumer_name: TIMELINE_CONSUMER
    },
    { onConflict: "event_id,consumer_name" }
  );

  if (receiptError) {
    throw new Error(receiptError.message ?? "Timeline receipt failed");
  }

  return "projected";
}

export async function projectDomainEventRow(
  client: OpsDbClient,
  row: DomainEventRow
): Promise<"projected" | "skipped"> {
  return projectEventToTimeline(client, rowToEnvelope(row));
}
