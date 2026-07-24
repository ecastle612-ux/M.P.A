/**
 * FIN-003 — shared Connect audit insert (Phase E R-D4 reuse of audit framework).
 */
import type { Json } from "@mpa/supabase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function writeConnectAudit(
  organizationId: string,
  entityType: string,
  entityId: string | null,
  eventType: string,
  summary: string,
  actorUserId: string | null | undefined,
  payload: Record<string, unknown>,
  client: AnyClient
): Promise<void> {
  await client.from("connect_audit_events").insert({
    organization_id: organizationId,
    entity_type: entityType,
    entity_id: entityId,
    event_type: eventType,
    summary,
    actor_user_id: actorUserId ?? null,
    payload: payload as Json
  });
}
