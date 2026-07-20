import { createAuthServerComponentClient } from "../auth/server";
import type { Json } from "@mpa/supabase";
import type {
  AppendTimelineEventInput,
  FacilityTimelineEvent,
  TimelineListOptions
} from "./contracts";
import { eventMatchesFilter } from "./contracts";

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

type FacilityTimelineRow = {
  id: string;
  organization_id: string;
  property_id: string;
  unit_id: string | null;
  building_id: string | null;
  event_type: string;
  occurred_at: string;
  title: string;
  summary: string;
  actor_user_id: string | null;
  performed_by_label: string | null;
  service_provider_display_name: string | null;
  source_entity_type: string;
  source_entity_id: string;
  facility_record_id: string | null;
  work_order_id: string | null;
  legacy_vendor_id: string | null;
  asset_id: string | null;
  href: string | null;
  document_ids: string[] | null;
  payload: Json | null;
  created_at: string;
  properties?: { name: string } | null;
  units?: { unit_number: string } | null;
};

const TIMELINE_SELECT =
  "id, organization_id, property_id, unit_id, building_id, event_type, occurred_at, title, summary, actor_user_id, performed_by_label, service_provider_display_name, source_entity_type, source_entity_id, facility_record_id, work_order_id, legacy_vendor_id, asset_id, href, document_ids, payload, created_at, properties(name), units(unit_number)";

async function resolveClient(client?: SupabaseClientType): Promise<SupabaseClientType> {
  return client ?? (await createAuthServerComponentClient());
}

function toMetadata(value: Json | null): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function escapeIlike(value: string): string {
  return value.replace(/[%_,]/g, "\\$&");
}

export function toTimelineEvent(row: FacilityTimelineRow): FacilityTimelineEvent {
  return {
    id: row.id,
    organizationId: row.organization_id,
    propertyId: row.property_id,
    unitId: row.unit_id,
    buildingId: row.building_id,
    eventType: row.event_type,
    occurredAt: row.occurred_at,
    title: row.title,
    summary: row.summary,
    actorUserId: row.actor_user_id,
    performedByLabel: row.performed_by_label,
    serviceProviderDisplayName: row.service_provider_display_name,
    sourceEntityType: row.source_entity_type,
    sourceEntityId: row.source_entity_id,
    facilityRecordId: row.facility_record_id,
    workOrderId: row.work_order_id,
    legacyVendorId: row.legacy_vendor_id,
    assetId: row.asset_id,
    href: row.href,
    documentIds: row.document_ids ?? [],
    payload: toMetadata(row.payload),
    createdAt: row.created_at,
    propertyName: row.properties?.name ?? null,
    unitNumber: row.units?.unit_number ?? null
  };
}

/**
 * Append-only, idempotent timeline ingest.
 * Unique on (organization, source_entity_type, source_entity_id, event_type).
 */
export async function appendFacilityTimelineEvent(
  organizationId: string,
  input: AppendTimelineEventInput,
  client?: SupabaseClientType
): Promise<FacilityTimelineEvent | null> {
  const supabase = await resolveClient(client);
  const occurredAt = input.occurredAt ?? new Date().toISOString();

  const { data, error } = await supabase
    .from("facility_timeline_events")
    .upsert(
      {
        organization_id: organizationId,
        property_id: input.propertyId,
        unit_id: input.unitId ?? null,
        building_id: input.buildingId ?? null,
        event_type: input.eventType,
        occurred_at: occurredAt,
        title: input.title,
        summary: input.summary,
        actor_user_id: input.actorUserId ?? null,
        performed_by_label: input.performedByLabel ?? null,
        service_provider_display_name: input.serviceProviderDisplayName ?? null,
        source_entity_type: input.sourceEntityType,
        source_entity_id: input.sourceEntityId,
        facility_record_id: input.facilityRecordId ?? null,
        work_order_id: input.workOrderId ?? null,
        legacy_vendor_id: input.legacyVendorId ?? null,
        asset_id: input.assetId ?? null,
        href: input.href ?? null,
        document_ids: input.documentIds ?? [],
        payload: (input.payload ?? {}) as Json
      },
      {
        onConflict: "organization_id,source_entity_type,source_entity_id,event_type",
        ignoreDuplicates: true
      }
    )
    .select(TIMELINE_SELECT)
    .maybeSingle();

  if (error) {
    // Concurrent duplicate insert — treat as success (idempotent).
    if (error.code === "23505") return null;
    throw new Error(error.message);
  }
  if (!data) return null;
  return toTimelineEvent(data as unknown as FacilityTimelineRow);
}

export async function listFacilityTimelineEvents(
  organizationId: string,
  options: TimelineListOptions = {},
  client?: SupabaseClientType
): Promise<FacilityTimelineEvent[]> {
  const supabase = await resolveClient(client);
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);

  let query = supabase
    .from("facility_timeline_events")
    .select(TIMELINE_SELECT)
    .eq("organization_id", organizationId)
    .order("occurred_at", { ascending: false })
    .limit(limit * 3);

  if (options.propertyId) query = query.eq("property_id", options.propertyId);
  if (options.vendorId) query = query.eq("legacy_vendor_id", options.vendorId);

  if (options.unitId) {
    if (options.includePropertyWide) {
      query = query.or(`unit_id.eq.${options.unitId},unit_id.is.null`);
    } else {
      query = query.eq("unit_id", options.unitId);
    }
  }

  const trimmed = options.search?.trim();
  if (trimmed) {
    const escaped = escapeIlike(trimmed);
    query = query.or(
      `title.ilike.%${escaped}%,summary.ilike.%${escaped}%,performed_by_label.ilike.%${escaped}%,service_provider_display_name.ilike.%${escaped}%`
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let events = ((data ?? []) as unknown as FacilityTimelineRow[]).map(toTimelineEvent);
  const filter = options.filter ?? "all";
  if (filter !== "all") {
    events = events.filter((event) => eventMatchesFilter(event.eventType, filter));
  }
  return events.slice(0, limit);
}
