import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createFacilityAssetInputSchema,
  updateFacilityAssetInputSchema,
  type CreateFacilityAssetInput,
  type FacilityAssetStatus,
  type FacilityAssetType,
  type UpdateFacilityAssetInput
} from "@mpa/shared";
import { writeMaintenanceAudit } from "../maintenance/events-audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export type FacilityAssetRow = {
  id: string;
  organization_id: string;
  property_id: string | null;
  property_property_id: string | null;
  name: string;
  asset_code: string;
  asset_type: FacilityAssetType;
  custom_type_label: string | null;
  status: FacilityAssetStatus;
  location_scope: string;
  building_label: string | null;
  floor_label: string | null;
  room_label: string | null;
  location_note: string | null;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  warranty_starts_on: string | null;
  warranty_ends_on: string | null;
  warranty_notes: string | null;
  vendor_id: string | null;
  scan_code: string | null;
  notes: string | null;
  replaced_asset_id: string | null;
  created_at: string;
  updated_at: string;
  property_properties?: { id: string; name: string } | null;
  vendor_vendors?: { id: string; name: string } | null;
};

const SELECT_ASSET = `
  id, organization_id, property_id, property_property_id, name, asset_code, asset_type,
  custom_type_label, status, location_scope, building_label, floor_label, room_label,
  location_note, manufacturer, model, serial_number, purchase_date, warranty_starts_on,
  warranty_ends_on, warranty_notes, vendor_id, scan_code, notes, replaced_asset_id,
  created_at, updated_at,
  property_properties ( id, name ),
  vendor_vendors ( id, name )
`;

function asSingle<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalizeAsset(row: Record<string, unknown>): FacilityAssetRow {
  return {
    ...(row as FacilityAssetRow),
    property_properties: asSingle(row["property_properties"] as FacilityAssetRow["property_properties"]),
    vendor_vendors: asSingle(row["vendor_vendors"] as FacilityAssetRow["vendor_vendors"])
  };
}

async function assertSite(supabase: Db, organizationId: string, propertyPropertyId: string) {
  const { data, error } = await supabase
    .from("property_properties")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", propertyPropertyId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Facility site not found for organization");
}

async function assertVendor(supabase: Db, organizationId: string, vendorId?: string) {
  if (!vendorId) return;
  const { data, error } = await supabase
    .from("vendor_vendors")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", vendorId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Vendor not found for organization");
}

export async function listFacilityAssets(
  supabase: Db,
  organizationId: string,
  options?: { technicianUserId?: string | null }
) {
  let query = supabase
    .from("facility_assets")
    .select(SELECT_ASSET)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("name");

  if (options?.technicianUserId) {
    const { data: assigned, error } = await supabase
      .from("maintenance_work_orders")
      .select("facility_asset_id")
      .eq("organization_id", organizationId)
      .eq("work_surface", "facility")
      .eq("technician_user_id", options.technicianUserId)
      .not("facility_asset_id", "is", null);
    if (error) throw new Error(error.message);
    const ids = [
      ...new Set(
        (assigned ?? [])
          .map((row) => row.facility_asset_id as string | null)
          .filter((id): id is string => Boolean(id))
      )
    ];
    if (ids.length === 0) return [];
    query = query.in("id", ids);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(normalizeAsset);
}

export async function getFacilityAsset(supabase: Db, organizationId: string, assetId: string) {
  const { data, error } = await supabase
    .from("facility_assets")
    .select(SELECT_ASSET)
    .eq("organization_id", organizationId)
    .eq("id", assetId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizeAsset(data as Record<string, unknown>) : null;
}

export async function createFacilityAsset(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  raw: CreateFacilityAssetInput
) {
  const input = createFacilityAssetInputSchema.parse(raw);
  await assertSite(supabase, organizationId, input.propertyPropertyId);
  await assertVendor(supabase, organizationId, input.vendorId);

  const { data, error } = await supabase
    .from("facility_assets")
    .insert({
      organization_id: organizationId,
      property_property_id: input.propertyPropertyId,
      name: input.name,
      asset_code: input.assetCode,
      asset_type: input.assetType,
      custom_type_label: input.customTypeLabel ?? null,
      location_scope: input.locationScope,
      building_label: input.buildingLabel ?? null,
      floor_label: input.floorLabel ?? null,
      room_label: input.roomLabel ?? null,
      location_note: input.locationNote ?? null,
      manufacturer: input.manufacturer ?? null,
      model: input.model ?? null,
      serial_number: input.serialNumber ?? null,
      purchase_date: input.purchaseDate ?? null,
      warranty_starts_on: input.warrantyStartsOn ?? null,
      warranty_ends_on: input.warrantyEndsOn ?? null,
      warranty_notes: input.warrantyNotes ?? null,
      vendor_id: input.vendorId ?? null,
      scan_code: input.scanCode ?? null,
      notes: input.notes ?? null,
      replaced_asset_id: input.replacedAssetId ?? null,
      status: "active",
      created_by: actorUserId,
      updated_by: actorUserId
    })
    .select(SELECT_ASSET)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create asset");

  await writeMaintenanceAudit({
    supabase,
    organizationId,
    actorId: actorUserId,
    action: "facility_asset.created",
    entityType: "facility_assets",
    entityId: data.id,
    payload: { assetCode: input.assetCode, name: input.name }
  });
  return normalizeAsset(data as Record<string, unknown>);
}

export async function updateFacilityAsset(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  assetId: string,
  raw: UpdateFacilityAssetInput
) {
  const input = updateFacilityAssetInputSchema.parse(raw);
  const existing = await getFacilityAsset(supabase, organizationId, assetId);
  if (!existing) throw new Error("Asset not found");
  if (input.propertyPropertyId) {
    await assertSite(supabase, organizationId, input.propertyPropertyId);
  }
  await assertVendor(supabase, organizationId, input.vendorId);

  const patch: {
    updated_by: string;
    updated_at: string;
    name?: string;
    asset_type?: FacilityAssetType;
    custom_type_label?: string | null;
    asset_code?: string;
    property_property_id?: string;
    location_scope?: string;
    building_label?: string | null;
    floor_label?: string | null;
    room_label?: string | null;
    location_note?: string | null;
    manufacturer?: string | null;
    model?: string | null;
    serial_number?: string | null;
    purchase_date?: string | null;
    warranty_starts_on?: string | null;
    warranty_ends_on?: string | null;
    warranty_notes?: string | null;
    vendor_id?: string | null;
    scan_code?: string | null;
    notes?: string | null;
    replaced_asset_id?: string | null;
    status?: FacilityAssetStatus;
  } = {
    updated_by: actorUserId,
    updated_at: new Date().toISOString()
  };
  if (input.name) patch.name = input.name;
  if (input.assetType) patch.asset_type = input.assetType;
  if (input.customTypeLabel !== undefined) patch.custom_type_label = input.customTypeLabel ?? null;
  if (input.assetCode) patch.asset_code = input.assetCode;
  if (input.propertyPropertyId) {
    patch.property_property_id = input.propertyPropertyId;
  }
  if (input.locationScope) patch.location_scope = input.locationScope;
  if (input.buildingLabel !== undefined) patch.building_label = input.buildingLabel ?? null;
  if (input.floorLabel !== undefined) patch.floor_label = input.floorLabel ?? null;
  if (input.roomLabel !== undefined) patch.room_label = input.roomLabel ?? null;
  if (input.locationNote !== undefined) patch.location_note = input.locationNote ?? null;
  if (input.manufacturer !== undefined) patch.manufacturer = input.manufacturer ?? null;
  if (input.model !== undefined) patch.model = input.model ?? null;
  if (input.serialNumber !== undefined) patch.serial_number = input.serialNumber ?? null;
  if (input.purchaseDate !== undefined) patch.purchase_date = input.purchaseDate ?? null;
  if (input.warrantyStartsOn !== undefined) patch.warranty_starts_on = input.warrantyStartsOn ?? null;
  if (input.warrantyEndsOn !== undefined) patch.warranty_ends_on = input.warrantyEndsOn ?? null;
  if (input.warrantyNotes !== undefined) patch.warranty_notes = input.warrantyNotes ?? null;
  if (input.vendorId !== undefined) patch.vendor_id = input.vendorId ?? null;
  if (input.scanCode !== undefined) patch.scan_code = input.scanCode ?? null;
  if (input.notes !== undefined) patch.notes = input.notes ?? null;
  if (input.replacedAssetId !== undefined) patch.replaced_asset_id = input.replacedAssetId ?? null;
  if (input.status) patch.status = input.status;

  const { data, error } = await supabase
    .from("facility_assets")
    .update(patch)
    .eq("id", assetId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .select(SELECT_ASSET)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to update asset");

  await writeMaintenanceAudit({
    supabase,
    organizationId,
    actorId: actorUserId,
    action: input.status && input.status !== existing.status
      ? "facility_asset.lifecycle_changed"
      : "facility_asset.updated",
    entityType: "facility_assets",
    entityId: assetId,
    payload: { status: input.status ?? existing.status }
  });
  return normalizeAsset(data as Record<string, unknown>);
}

export async function listAssetWorkHistory(
  supabase: Db,
  organizationId: string,
  assetId: string
) {
  const { data, error } = await supabase
    .from("maintenance_work_orders")
    .select(
      "id, title, status, priority, category, facility_asset_label, created_at, completed_at, cancelled_at"
    )
    .eq("organization_id", organizationId)
    .eq("facility_asset_id", assetId)
    .eq("work_surface", "facility")
    .in("status", ["completed", "closed", "cancelled"])
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}
