import type { SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = SupabaseClient<any>;

export async function emitFacilityEvent(args: {
  supabase: AnySupabase;
  organizationId: string;
  actorId: string | null;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload?: Record<string, unknown>;
}) {
  const { error } = await args.supabase.from("event_domain_events").insert({
    event_type: args.eventType,
    aggregate_type: args.aggregateType,
    aggregate_id: args.aggregateId,
    organization_id: args.organizationId,
    actor_id: args.actorId,
    payload: args.payload ?? {}
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function writeFacilityAudit(args: {
  supabase: AnySupabase;
  organizationId: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  payload?: Record<string, unknown>;
}) {
  const { error } = await args.supabase.from("audit_events").insert({
    organization_id: args.organizationId,
    actor_id: args.actorId,
    action: args.action,
    entity_type: args.entityType,
    entity_id: args.entityId ?? null,
    payload: args.payload ?? {}
  });
  if (error) {
    throw new Error(error.message);
  }
}

export async function writeFacilityNotification(args: {
  supabase: AnySupabase;
  organizationId: string;
  userId: string | null | undefined;
  siteId?: string | null;
  notificationKey: string;
  title: string;
  body: string;
  href?: string;
}) {
  if (!args.userId) {
    return;
  }
  const { error } = await args.supabase.from("facility_notifications").insert({
    organization_id: args.organizationId,
    user_id: args.userId,
    site_id: args.siteId ?? null,
    notification_key: args.notificationKey,
    title: args.title,
    body: args.body,
    href: args.href ?? null
  });
  if (error) {
    throw new Error(error.message);
  }
}
