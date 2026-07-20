import { createAuthServerComponentClient } from "../auth/server";
import type { Json } from "@mpa/supabase";
import {
  ASSET_TYPE_CODE_PREFIX,
  type CreateFacilityAssetInput,
  type FacilityAsset,
  type FacilityAssetListItem,
  type FacilityAssetLocationScope,
  type FacilityAssetStatus,
  type ListFacilityAssetsOptions
} from "./asset-contracts";
import { appendFacilityTimelineEvent } from "./timeline";

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

type FacilityAssetRow = {
  id: string;
  organization_id: string;
  property_id: string;
  building_id: string | null;
  unit_id: string | null;
  location_scope: FacilityAssetLocationScope;
  asset_code: string;
  name: string;
  asset_type: string;
  custom_type_label: string | null;
  install_date: string | null;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  expected_life_years: number | string | null;
  warranty_placeholder: string | null;
  status: FacilityAssetStatus;
  location_note: string | null;
  notes: string | null;
  metadata: Json | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type FacilityAssetRelationRow = FacilityAssetRow & {
  properties: { name: string } | null;
  units: { unit_number: string } | null;
};

const ASSET_SELECT =
  "id, organization_id, property_id, building_id, unit_id, location_scope, asset_code, name, asset_type, custom_type_label, install_date, manufacturer, model, serial_number, expected_life_years, warranty_placeholder, status, location_note, notes, metadata, created_by, updated_by, created_at, updated_at, deleted_at, properties(name), units(unit_number)";

async function resolveClient(client?: SupabaseClientType): Promise<SupabaseClientType> {
  return client ?? (await createAuthServerComponentClient());
}

function toMetadata(value: Json | null): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function toFacilityAsset(row: FacilityAssetRow): FacilityAsset {
  const life =
    row.expected_life_years === null || row.expected_life_years === undefined
      ? null
      : Number(row.expected_life_years);
  return {
    id: row.id,
    organizationId: row.organization_id,
    propertyId: row.property_id,
    buildingId: row.building_id,
    unitId: row.unit_id,
    locationScope: row.location_scope,
    assetCode: row.asset_code,
    name: row.name,
    assetType: row.asset_type,
    customTypeLabel: row.custom_type_label,
    installDate: row.install_date,
    manufacturer: row.manufacturer,
    model: row.model,
    serialNumber: row.serial_number,
    expectedLifeYears: Number.isFinite(life) ? life : null,
    warrantyPlaceholder: row.warranty_placeholder,
    status: row.status,
    locationNote: row.location_note,
    notes: row.notes,
    metadata: toMetadata(row.metadata),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at
  };
}

async function attachRepairStats(
  organizationId: string,
  assets: FacilityAssetListItem[],
  client: SupabaseClientType
): Promise<FacilityAssetListItem[]> {
  if (assets.length === 0) return assets;
  const assetIds = assets.map((asset) => asset.id);
  const { data, error } = await client
    .from("facility_records")
    .select("id, asset_id, issue, completed_at")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .in("asset_id", assetIds)
    .order("completed_at", { ascending: false });

  if (error) throw new Error(error.message);

  const stats = new Map<
    string,
    { repairCount: number; lastRepairAt: string | null; lastRepairIssue: string | null; lastRepairId: string | null }
  >();

  for (const row of data ?? []) {
    const assetId = row.asset_id as string | null;
    if (!assetId) continue;
    const current = stats.get(assetId);
    if (!current) {
      stats.set(assetId, {
        repairCount: 1,
        lastRepairAt: row.completed_at,
        lastRepairIssue: row.issue,
        lastRepairId: row.id
      });
    } else {
      current.repairCount += 1;
    }
  }

  return assets.map((asset) => {
    const repair = stats.get(asset.id);
    return {
      ...asset,
      repairCount: repair?.repairCount ?? 0,
      lastRepairAt: repair?.lastRepairAt ?? null,
      lastRepairIssue: repair?.lastRepairIssue ?? null,
      lastRepairId: repair?.lastRepairId ?? null
    };
  });
}

async function generateAssetCode(
  organizationId: string,
  assetType: string,
  client: SupabaseClientType
): Promise<string> {
  const prefix = ASSET_TYPE_CODE_PREFIX[assetType] ?? "AST";
  const { count, error } = await client
    .from("facility_assets")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("asset_type", assetType);

  if (error) throw new Error(error.message);
  const next = (count ?? 0) + 1;
  let candidate = `${prefix}-${String(next).padStart(3, "0")}`;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data } = await client
      .from("facility_assets")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("asset_code", candidate)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `${prefix}-${String(next + attempt + 1).padStart(3, "0")}`;
  }
  return `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

export async function listFacilityAssets(
  organizationId: string,
  filters: ListFacilityAssetsOptions = {},
  client?: SupabaseClientType
): Promise<FacilityAssetListItem[]> {
  const supabase = await resolveClient(client);
  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 300);

  let query = supabase
    .from("facility_assets")
    .select(ASSET_SELECT)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("asset_code", { ascending: true })
    .limit(limit);

  if (filters.propertyId) query = query.eq("property_id", filters.propertyId);
  if (filters.unitId) query = query.eq("unit_id", filters.unitId);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.search?.trim()) {
    const q = filters.search.trim().replace(/[%_,]/g, "\\$&");
    query = query.or(
      `asset_code.ilike.%${q}%,name.ilike.%${q}%,asset_type.ilike.%${q}%,custom_type_label.ilike.%${q}%,manufacturer.ilike.%${q}%,model.ilike.%${q}%,serial_number.ilike.%${q}%,location_note.ilike.%${q}%`
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const items = ((data ?? []) as FacilityAssetRelationRow[]).map((row) => ({
    ...toFacilityAsset(row),
    propertyName: row.properties?.name ?? null,
    unitNumber: row.units?.unit_number ?? null,
    repairCount: 0,
    lastRepairAt: null,
    lastRepairIssue: null,
    lastRepairId: null
  }));

  return attachRepairStats(organizationId, items, supabase);
}

export async function getFacilityAssetForOrganization(
  organizationId: string,
  assetId: string,
  client?: SupabaseClientType
): Promise<FacilityAssetListItem | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("facility_assets")
    .select(ASSET_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", assetId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as FacilityAssetRelationRow;
  const [enriched] = await attachRepairStats(
    organizationId,
    [
      {
        ...toFacilityAsset(row),
        propertyName: row.properties?.name ?? null,
        unitNumber: row.units?.unit_number ?? null,
        repairCount: 0,
        lastRepairAt: null,
        lastRepairIssue: null,
        lastRepairId: null
      }
    ],
    supabase
  );
  return enriched ?? null;
}

export async function createFacilityAsset(
  organizationId: string,
  userId: string,
  input: CreateFacilityAssetInput,
  client?: SupabaseClientType
): Promise<FacilityAssetListItem> {
  const supabase = await resolveClient(client);
  const assetCode =
    input.assetCode?.trim().toUpperCase() ||
    (await generateAssetCode(organizationId, input.assetType, supabase));

  const { data, error } = await supabase
    .from("facility_assets")
    .insert({
      organization_id: organizationId,
      property_id: input.propertyId,
      building_id: input.buildingId ?? null,
      unit_id: input.locationScope === "unit" ? input.unitId ?? null : null,
      location_scope: input.locationScope,
      asset_code: assetCode,
      name: input.name,
      asset_type: input.assetType,
      custom_type_label: input.customTypeLabel ?? null,
      install_date: input.installDate ?? null,
      manufacturer: input.manufacturer ?? null,
      model: input.model ?? null,
      serial_number: input.serialNumber ?? null,
      expected_life_years: input.expectedLifeYears ?? null,
      warranty_placeholder: input.warrantyPlaceholder ?? null,
      status: input.status ?? "active",
      location_note: input.locationNote ?? null,
      notes: input.notes ?? null,
      created_by: userId,
      updated_by: userId
    })
    .select(ASSET_SELECT)
    .single();

  if (error || !data) throw new Error(error?.message ?? "Asset creation failed");

  const row = data as FacilityAssetRelationRow;
  const asset = toFacilityAsset(row);

  await appendFacilityTimelineEvent(
    organizationId,
    {
      propertyId: asset.propertyId,
      unitId: asset.unitId,
      buildingId: asset.buildingId,
      eventType: "facility.asset_installed",
      title: `Asset registered · ${asset.assetCode}`,
      summary: `${asset.name} (${asset.assetType.replaceAll("_", " ")}) added to facility registry.`,
      actorUserId: userId,
      sourceEntityType: "facility_asset",
      sourceEntityId: asset.id,
      assetId: asset.id,
      href: `/facility/assets/${asset.id}`,
      payload: {
        assetId: asset.id,
        assetCode: asset.assetCode,
        assetType: asset.assetType
      }
    },
    supabase
  );

  const [enriched] = await attachRepairStats(
    organizationId,
    [
      {
        ...asset,
        propertyName: row.properties?.name ?? null,
        unitNumber: row.units?.unit_number ?? null,
        repairCount: 0,
        lastRepairAt: null,
        lastRepairIssue: null,
        lastRepairId: null
      }
    ],
    supabase
  );

  if (!enriched) throw new Error("Asset enrichment failed");
  return enriched;
}

export async function linkFacilityRecordToAsset(
  organizationId: string,
  recordId: string,
  assetId: string | null,
  userId: string,
  client?: SupabaseClientType
): Promise<void> {
  const supabase = await resolveClient(client);

  if (assetId) {
    const asset = await getFacilityAssetForOrganization(organizationId, assetId, supabase);
    if (!asset) throw new Error("Asset not found");
  }

  const { data, error } = await supabase
    .from("facility_records")
    .update({ asset_id: assetId, updated_by: userId })
    .eq("organization_id", organizationId)
    .eq("id", recordId)
    .eq("status", "active")
    .select("id, property_id, unit_id, issue")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Facility record not found");

  if (assetId) {
    await appendFacilityTimelineEvent(
      organizationId,
      {
        propertyId: data.property_id,
        unitId: data.unit_id,
        eventType: "facility.service_visit",
        title: "Repair linked to asset",
        summary: `Facility record linked to asset for ongoing history: ${data.issue}`,
        actorUserId: userId,
        sourceEntityType: "facility_record",
        sourceEntityId: recordId,
        facilityRecordId: recordId,
        href: `/facility/assets/${assetId}`,
        payload: { assetId, facilityRecordId: recordId }
      },
      supabase
    );
    await supabase
      .from("facility_timeline_events")
      .update({ asset_id: assetId })
      .eq("organization_id", organizationId)
      .eq("facility_record_id", recordId)
      .is("asset_id", null);
  }
}

export async function searchFacilityAssets(
  organizationId: string,
  query: string,
  options: { propertyId?: string | undefined; limit?: number | undefined } = {},
  client?: SupabaseClientType
): Promise<FacilityAssetListItem[]> {
  return listFacilityAssets(
    organizationId,
    {
      propertyId: options.propertyId,
      search: query,
      limit: options.limit ?? 12
    },
    client
  );
}
