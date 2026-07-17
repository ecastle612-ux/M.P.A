import { createAuthServerComponentClient } from "../auth/server";
import type { Json } from "@mpa/supabase";
import type { CommunityEventRecord, CommunityEventType, CreateCommunityEventInput } from "./contracts";

type CommunityEventRow = {
  id: string;
  organization_id: string;
  property_id: string | null;
  title: string;
  event_type: CommunityEventType;
  starts_at: string;
  ends_at: string | null;
  body: string;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
};

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

const EVENT_SELECT =
  "id, organization_id, property_id, title, event_type, starts_at, ends_at, body, metadata, created_at, updated_at";

function toCommunityEventRecord(row: CommunityEventRow): CommunityEventRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    propertyId: row.property_id,
    title: row.title,
    eventType: row.event_type,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    body: row.body,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function resolveClient(client?: SupabaseClientType): Promise<SupabaseClientType> {
  return client ?? (await createAuthServerComponentClient());
}

export type CommunityEventListOptions = {
  propertyId?: string;
  upcomingOnly?: boolean;
  limit?: number;
};

export async function getCommunityEventsForOrganization(
  organizationId: string,
  options: CommunityEventListOptions = {},
  client?: SupabaseClientType
): Promise<CommunityEventRecord[]> {
  const supabase = await resolveClient(client);
  let query = supabase
    .from("community_events")
    .select(EVENT_SELECT)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("starts_at", { ascending: true });

  if (options.propertyId) query = query.eq("property_id", options.propertyId);
  if (options.upcomingOnly) query = query.gte("starts_at", new Date().toISOString());
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as CommunityEventRow[]).map(toCommunityEventRecord);
}

export async function createCommunityEvent(
  organizationId: string,
  userId: string,
  input: CreateCommunityEventInput,
  client?: SupabaseClientType
): Promise<CommunityEventRecord> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("community_events")
    .insert({
      organization_id: organizationId,
      property_id: input.propertyId ?? null,
      title: input.title,
      event_type: input.eventType ?? "event",
      starts_at: input.startsAt,
      ends_at: input.endsAt ?? null,
      body: input.body ?? "",
      created_by: userId,
      updated_by: userId
    })
    .select(EVENT_SELECT)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Community event creation failed");
  return toCommunityEventRecord(data as CommunityEventRow);
}
