/**
 * AUTH-001 Slice E — secret-free OPS domain events for recovery outcomes.
 */
import { emitOpsDomainEvent } from "../../ops/emit";
import { createServiceRoleServerClient } from "../server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function serviceClient(): AnyClient {
  const client = createServiceRoleServerClient();
  if (!client) throw new Error("Recovery OPS events require SUPABASE_SERVICE_ROLE_KEY");
  return client;
}

export type RecoveryOpsEventType =
  | "auth.recovery.org_admin_completed"
  | "auth.recovery.subaccount_reset"
  | "auth.recovery.ownership_restored"
  | "auth.recovery.contact_updated"
  | "auth.recovery.contact_verified"
  | "auth.escalation.opened"
  | "auth.escalation.escalated"
  | "auth.escalation.resolved"
  | "auth.offboarding.completed"
  | "auth.organization.activated";

export async function emitRecoveryOpsEvent(input: {
  eventType: RecoveryOpsEventType;
  organizationId: string;
  subjectType: string;
  subjectId: string;
  actorUserId?: string | null | undefined;
  actorType?: "user" | "system" | undefined;
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
          actor_type: input.actorType ?? (input.actorUserId ? "user" : "system"),
          principal_id: input.actorUserId ?? null,
          label: "AUTH-001 recovery"
        },
        summary: input.summary,
        payload: input.payload ?? {},
        ...(input.correlationId ? { correlationId: input.correlationId } : {}),
        visibility: "staff_only",
        sensitivity: "privileged"
      },
      { dispatchNow: true }
    );
  } catch {
    // Best-effort timeline projection; privileged audit is the durable SoT.
  }
}
