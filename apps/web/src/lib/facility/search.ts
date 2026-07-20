import { createAuthServerComponentClient } from "../auth/server";
import { searchFacilityAssets } from "./asset-server";
import { formatAssetTypeLabel, formatLocationScopeLabel } from "./asset-contracts";
import { listFacilityRecords } from "./server";
import { listFacilityTimelineEvents } from "./timeline";
import type { FacilitySearchHit } from "./contracts";

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

async function resolveClient(client?: SupabaseClientType): Promise<SupabaseClientType> {
  return client ?? (await createAuthServerComponentClient());
}

function escapeIlike(value: string): string {
  return value.replace(/[%_,]/g, "\\$&");
}

function scoreText(query: string, fields: string[]): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  let score = 0;
  for (const field of fields) {
    const value = field.toLowerCase();
    if (value === q) score += 40;
    else if (value.startsWith(q)) score += 28;
    else if (value.includes(q)) score += 18;
  }
  return score;
}

/**
 * Unified Facility Search — keyword only (no AI).
 * Returns Assets, Facility Records, Timeline Events, Service Providers, Work Orders, Properties, Units.
 */
export async function searchFacilityMemory(
  organizationId: string,
  query: string,
  options: { limit?: number | undefined; propertyId?: string | undefined } = {},
  client?: SupabaseClientType
): Promise<FacilitySearchHit[]> {
  const supabase = await resolveClient(client);
  const trimmed = query.trim();
  if (!trimmed) return [];
  const limit = Math.min(Math.max(options.limit ?? 24, 1), 48);
  const escaped = escapeIlike(trimmed);
  const hits: FacilitySearchHit[] = [];
  const propertyId = options.propertyId;

  const [assets, records, timeline, vendors, workOrders, properties, units] = await Promise.all([
    searchFacilityAssets(
      organizationId,
      trimmed,
      propertyId ? { propertyId, limit: 12 } : { limit: 12 },
      supabase
    ),
    listFacilityRecords(
      organizationId,
      propertyId ? { search: trimmed, propertyId, limit: 12 } : { search: trimmed, limit: 12 },
      supabase
    ),
    listFacilityTimelineEvents(
      organizationId,
      propertyId ? { search: trimmed, propertyId, limit: 12 } : { search: trimmed, limit: 12 },
      supabase
    ),
    supabase
      .from("vendors")
      .select("id, business_name, primary_contact_name, services, status")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .or(
        `business_name.ilike.%${escaped}%,primary_contact_name.ilike.%${escaped}%,email.ilike.%${escaped}%`
      )
      .limit(8),
    supabase
      .from("maintenance_work_orders")
      .select("id, work_order_number, title, status, property_id, unit_id")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .or(`title.ilike.%${escaped}%,work_order_number.ilike.%${escaped}%,description.ilike.%${escaped}%`)
      .limit(8),
    supabase
      .from("properties")
      .select("id, name, city, state_region")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .or(`name.ilike.%${escaped}%,city.ilike.%${escaped}%,address_line_1.ilike.%${escaped}%`)
      .limit(6),
    supabase
      .from("units")
      .select("id, unit_number, property_id")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .ilike("unit_number", `%${escaped}%`)
      .limit(8)
  ]);

  for (const asset of assets) {
    hits.push({
      id: `facility-asset-${asset.id}`,
      kind: "facility_asset",
      title: `${asset.assetCode} · ${asset.name}`,
      subtitle: formatAssetTypeLabel(asset.assetType, asset.customTypeLabel),
      context: [
        asset.propertyName,
        asset.unitNumber ? `Unit ${asset.unitNumber}` : formatLocationScopeLabel(asset.locationScope),
        asset.status
      ]
        .filter(Boolean)
        .join(" · ") || null,
      href: `/facility/assets/${asset.id}`,
      occurredAt: asset.installDate,
      score:
        scoreText(trimmed, [
          asset.assetCode,
          asset.name,
          asset.assetType,
          asset.customTypeLabel ?? "",
          formatAssetTypeLabel(asset.assetType, asset.customTypeLabel),
          asset.manufacturer ?? "",
          asset.model ?? "",
          asset.serialNumber ?? ""
        ]) + 36
    });
  }

  for (const record of records) {
    hits.push({
      id: `facility-record-${record.id}`,
      kind: "facility_record",
      title: record.issue,
      subtitle: record.propertyName,
      context: [
        record.unitNumber ? `Unit ${record.unitNumber}` : null,
        record.serviceProviderDisplayName,
        record.workOrderNumber
      ]
        .filter(Boolean)
        .join(" · ") || null,
      href: `/facility/records/${record.id}`,
      occurredAt: record.completedAt,
      score: scoreText(trimmed, [
        record.issue,
        record.resolution,
        record.serviceProviderDisplayName ?? "",
        record.unitNumber ?? "",
        record.propertyName ?? ""
      ]) + 30
    });
  }

  for (const event of timeline) {
    hits.push({
      id: `timeline-${event.id}`,
      kind: "timeline_event",
      title: event.title,
      subtitle: event.propertyName ?? null,
      context: [
        event.unitNumber ? `Unit ${event.unitNumber}` : null,
        event.serviceProviderDisplayName,
        event.performedByLabel
      ]
        .filter(Boolean)
        .join(" · ") || event.summary,
      href: event.href ?? (event.facilityRecordId
        ? `/facility/records/${event.facilityRecordId}`
        : `/properties/${event.propertyId}`),
      occurredAt: event.occurredAt,
      score: scoreText(trimmed, [event.title, event.summary, event.serviceProviderDisplayName ?? ""]) + 24
    });
  }

  for (const vendor of (vendors.data ?? []) as Array<{
    id: string;
    business_name: string;
    primary_contact_name: string | null;
    services: string[] | null;
    status: string;
  }>) {
    hits.push({
      id: `provider-${vendor.id}`,
      kind: "service_provider",
      title: vendor.business_name,
      subtitle: vendor.primary_contact_name,
      context: vendor.services?.length ? vendor.services.join(", ") : "Service provider",
      href: `/vendors/${vendor.id}`,
      occurredAt: null,
      score: scoreText(trimmed, [vendor.business_name, vendor.primary_contact_name ?? ""]) + 32
    });
  }

  for (const wo of (workOrders.data ?? []) as Array<{
    id: string;
    work_order_number: string;
    title: string;
    status: string;
  }>) {
    hits.push({
      id: `work-order-${wo.id}`,
      kind: "work_order",
      title: `${wo.work_order_number} · ${wo.title}`,
      subtitle: wo.status.replaceAll("_", " "),
      context: "Linked work order",
      href: `/maintenance/${wo.id}`,
      occurredAt: null,
      score: scoreText(trimmed, [wo.work_order_number, wo.title]) + 20
    });
  }

  for (const property of (properties.data ?? []) as Array<{
    id: string;
    name: string;
    city: string;
    state_region: string;
  }>) {
    hits.push({
      id: `property-${property.id}`,
      kind: "property",
      title: property.name,
      subtitle: `${property.city}, ${property.state_region}`,
      context: "Property history",
      href: `/properties/${property.id}#repair-history`,
      occurredAt: null,
      score: scoreText(trimmed, [property.name, property.city]) + 26
    });
  }

  for (const unit of (units.data ?? []) as Array<{
    id: string;
    unit_number: string;
    property_id: string;
  }>) {
    hits.push({
      id: `unit-${unit.id}`,
      kind: "unit",
      title: `Unit ${unit.unit_number}`,
      subtitle: "Unit history",
      context: null,
      href: `/units/${unit.id}`,
      occurredAt: null,
      score: scoreText(trimmed, [unit.unit_number, `unit ${unit.unit_number}`]) + 34
    });
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}
