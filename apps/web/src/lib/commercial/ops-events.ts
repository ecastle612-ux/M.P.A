/**
 * COM-001 Slice A — secret-free OPS domain events for commercial outcomes.
 */
import { emitOpsDomainEvent } from "../ops/emit";
import { createServiceRoleServerClient } from "../auth/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function serviceClient(): AnyClient {
  const client = createServiceRoleServerClient();
  if (!client) throw new Error("Commercial OPS events require SUPABASE_SERVICE_ROLE_KEY");
  return client;
}

export type CommercialOpsEventType =
  | "commercial.opportunity.created"
  | "commercial.opportunity.stage_changed"
  | "commercial.activation.requested"
  | "commercial.activation.completed"
  | "commercial.activation.failed"
  | "commercial.implementation.score_updated"
  | "commercial.implementation.milestone_updated"
  | "commercial.trial.status_changed"
  | "commercial.trial.reminder_due"
  | "commercial.trial.convert_started"
  | "commercial.health.score_updated"
  | "commercial.discovery.impressed"
  | "commercial.discovery.accepted"
  | "commercial.discovery.dismissed"
  | "commercial.discovery.snoozed"
  | "commercial.timeline.entry_appended"
  | "commercial.offboarding.stage_changed"
  | "commercial.offboarding.export_ready"
  | "commercial.offboarding.frozen"
  | "commercial.offboarding.archived"
  | "commercial.offboarding.recovered"
  | "commercial.cs_motion.scheduled"
  | "commercial.cs_motion.due"
  | "commercial.cs_motion.completed"
  | "commercial.renewal.alert_due"
  | "commercial.dashboard.opened"
  | "commercial.engagement.created"
  | "commercial.engagement.status_changed";

export async function emitCommercialOpsEvent(input: {
  eventType: CommercialOpsEventType;
  /** Null before org↔opportunity link; set after AUTH provision. */
  organizationId: string | null;
  subjectType: string;
  subjectId: string;
  actorUserId?: string | null | undefined;
  summary: string;
  payload?: Record<string, unknown> | undefined;
  correlationId?: string | undefined;
}): Promise<void> {
  const admin = serviceClient();
  try {
    await emitOpsDomainEvent(
      admin,
      {
        eventType: input.eventType,
        organizationId: input.organizationId,
        subject: { type: input.subjectType, id: input.subjectId },
        actor: {
          actor_type: input.actorUserId ? "user" : "system",
          principal_id: input.actorUserId ?? null,
          label: "COM-001 commercial"
        },
        summary: input.summary,
        payload: input.payload ?? {},
        ...(input.correlationId ? { correlationId: input.correlationId } : {}),
        visibility: "staff_only",
        sensitivity: "normal"
      },
      { dispatchNow: true }
    );
  } catch {
    // Best-effort; commercial ledger remains SoT.
  }
}
