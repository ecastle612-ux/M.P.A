import type { SupabaseClient } from "@supabase/supabase-js";
import {
  canTransitionFacilityAssetStatus,
  type CreateFacilityAssetCategoryInput,
  type CreateFacilityAssetInput,
  type FacilityAssetLifecycleInput,
  type FacilityAssetStatus,
  type RelocateFacilityAssetInput,
  type UpdateFacilityAssetInput
} from "@mpa/shared";
import { emitFacilityEvent, writeFacilityAudit, writeFacilityNotification } from "./events-audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export type FacilityAssetCategory = {
  id: string;
  organization_id: string;
  name: string;
  criticality_default: string;
  status: string;
};

export type FacilityAsset = {
  id: string;
  organization_id: string;
  site_id: string;
  location_id: string | null;
  parent_asset_id: string | null;
  category_id: string | null;
  name: string;
  asset_tag: string | null;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  criticality: string;
  status: string;
  installed_on: string | null;
  warranty_until: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  decommissioned_at: string | null;
  facility_sites?: {
    id: string;
    name: string;
    status: string;
    property_id: string | null;
    property_properties?: { id: string; name: string } | null;
  } | null;
  facility_locations?: { id: string; name: string; location_type: string } | null;
  facility_asset_categories?: { id: string; name: string } | null;
  facility_asset_systems?: Array<{
    system_id: string;
    facility_systems?: { id: string; name: string; status: string; system_type: string } | null;
  }>;
};

export type FacilityAssetLocationHistoryRow = {
  id: string;
  organization_id: string;
  asset_id: string;
  site_id: string;
  from_location_id: string | null;
  to_location_id: string | null;
  reason: string | null;
  relocated_by: string | null;
  relocated_at: string;
  created_at: string;
  from_location?: { id: string; name: string } | null;
  to_location?: { id: string; name: string } | null;
};

const DEFAULT_CATEGORIES: Array<{ name: string; criticalityDefault: string }> = [
  { name: "HVAC Equipment", criticalityDefault: "high" },
  { name: "Electrical", criticalityDefault: "high" },
  { name: "Fire & Life Safety", criticalityDefault: "critical" },
  { name: "Plumbing", criticalityDefault: "medium" },
  { name: "Vertical Transport", criticalityDefault: "high" },
  { name: "General Equipment", criticalityDefault: "medium" }
];

const ASSET_SELECT =
  "*, facility_sites(id, name, status, property_id, property_properties(id, name)), facility_locations(id, name, location_type), facility_asset_categories(id, name), facility_asset_systems(system_id, facility_systems(id, name, status, system_type))";

export async function ensureDefaultAssetCategories(supabase: Db, organizationId: string) {
  const { data: existing, error } = await supabase
    .from("facility_asset_categories")
    .select("id, name")
    .eq("organization_id", organizationId)
    .eq("status", "active");
  if (error) {
    throw new Error(error.message);
  }
  if ((existing ?? []).length > 0) {
    return existing as FacilityAssetCategory[];
  }

  const { data, error: insertError } = await supabase
    .from("facility_asset_categories")
    .insert(
      DEFAULT_CATEGORIES.map((category) => ({
        organization_id: organizationId,
        name: category.name,
        criticality_default: category.criticalityDefault,
        status: "active"
      }))
    )
    .select("*");
  if (insertError) {
    throw new Error(insertError.message);
  }
  return (data ?? []) as FacilityAssetCategory[];
}

export async function listFacilityAssetCategories(supabase: Db, organizationId: string) {
  await ensureDefaultAssetCategories(supabase, organizationId);
  const { data, error } = await supabase
    .from("facility_asset_categories")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("name");
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as FacilityAssetCategory[];
}

export async function createFacilityAssetCategory(
  supabase: Db,
  organizationId: string,
  actorId: string,
  input: CreateFacilityAssetCategoryInput
) {
  const { data, error } = await supabase
    .from("facility_asset_categories")
    .insert({
      organization_id: organizationId,
      name: input.name,
      criticality_default: input.criticalityDefault,
      status: "active"
    })
    .select("*")
    .single();
  if (error) {
    throw new Error(error.message);
  }
  await writeFacilityAudit({
    supabase,
    organizationId,
    actorId,
    action: "facility.asset.updated",
    entityType: "facility_asset_categories",
    entityId: data.id as string,
    payload: { name: input.name, criticalityDefault: input.criticalityDefault }
  });
  return data as FacilityAssetCategory;
}

async function assertActiveSite(supabase: Db, organizationId: string, siteId: string) {
  const { data, error } = await supabase
    .from("facility_sites")
    .select("id, status, property_id")
    .eq("organization_id", organizationId)
    .eq("id", siteId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error("Facility site not found");
  }
  if (data.status !== "active") {
    throw new Error("Assets require an active facility site");
  }
  return data as { id: string; status: string; property_id: string | null };
}

async function assertLocationOnSite(
  supabase: Db,
  organizationId: string,
  siteId: string,
  locationId: string | null | undefined
) {
  if (!locationId) {
    return;
  }
  const { data, error } = await supabase
    .from("facility_locations")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("site_id", siteId)
    .eq("id", locationId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error("Location must belong to the selected site");
  }
}

async function assertParentAsset(
  supabase: Db,
  organizationId: string,
  siteId: string,
  parentAssetId: string | null | undefined,
  selfId?: string
) {
  if (!parentAssetId) {
    return;
  }
  if (selfId && parentAssetId === selfId) {
    throw new Error("An asset cannot be its own parent");
  }
  const { data, error } = await supabase
    .from("facility_assets")
    .select("id, site_id, status")
    .eq("organization_id", organizationId)
    .eq("id", parentAssetId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error("Parent asset not found");
  }
  if (data.site_id !== siteId) {
    throw new Error("Parent asset must belong to the same site");
  }
  if (data.status === "decommissioned") {
    throw new Error("Cannot attach under a decommissioned asset");
  }
}

async function replaceAssetSystems(
  supabase: Db,
  organizationId: string,
  assetId: string,
  systemIds: string[]
) {
  const { error: deleteError } = await supabase
    .from("facility_asset_systems")
    .delete()
    .eq("organization_id", organizationId)
    .eq("asset_id", assetId);
  if (deleteError) {
    throw new Error(deleteError.message);
  }
  if (systemIds.length === 0) {
    return;
  }
  const { error } = await supabase.from("facility_asset_systems").insert(
    systemIds.map((systemId) => ({
      organization_id: organizationId,
      asset_id: assetId,
      system_id: systemId
    }))
  );
  if (error) {
    throw new Error(error.message);
  }
}

export async function listFacilityAssets(
  supabase: Db,
  organizationId: string,
  filters?: { siteId?: string; status?: string }
) {
  let request = supabase
    .from("facility_assets")
    .select(ASSET_SELECT)
    .eq("organization_id", organizationId)
    .order("name");
  if (filters?.siteId) {
    request = request.eq("site_id", filters.siteId);
  }
  if (filters?.status) {
    request = request.eq("status", filters.status);
  }
  const { data, error } = await request;
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as FacilityAsset[];
}

export async function getFacilityAsset(supabase: Db, organizationId: string, assetId: string) {
  const { data, error } = await supabase
    .from("facility_assets")
    .select(ASSET_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", assetId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return (data as FacilityAsset | null) ?? null;
}

export async function searchFacilityAssets(supabase: Db, organizationId: string, query: string) {
  const normalized = query.trim();
  let request = supabase
    .from("facility_assets")
    .select("id, name, asset_tag, status, criticality, site_id")
    .eq("organization_id", organizationId)
    .neq("status", "decommissioned")
    .order("name")
    .limit(20);
  if (normalized) {
    request = request.or(
      `name.ilike.%${normalized}%,asset_tag.ilike.%${normalized}%,serial_number.ilike.%${normalized}%`
    );
  }
  const { data, error } = await request;
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function listFacilityAssetTimeline(
  supabase: Db,
  organizationId: string,
  assetId: string
) {
  const { data, error } = await supabase
    .from("event_domain_events")
    .select("id, event_type, payload, created_at, actor_id")
    .eq("organization_id", organizationId)
    .eq("aggregate_type", "facility_assets")
    .eq("aggregate_id", assetId)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function listFacilityAssetLocationHistory(
  supabase: Db,
  organizationId: string,
  assetId: string
) {
  const { data, error } = await supabase
    .from("facility_asset_location_history")
    .select(
      "id, organization_id, asset_id, site_id, from_location_id, to_location_id, reason, relocated_by, relocated_at, created_at"
    )
    .eq("organization_id", organizationId)
    .eq("asset_id", assetId)
    .order("relocated_at", { ascending: false })
    .limit(100);
  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as FacilityAssetLocationHistoryRow[];
  const locationIds = Array.from(
    new Set(
      rows
        .flatMap((row) => [row.from_location_id, row.to_location_id])
        .filter((id): id is string => Boolean(id))
    )
  );
  if (locationIds.length === 0) {
    return rows;
  }

  const { data: locations, error: locationError } = await supabase
    .from("facility_locations")
    .select("id, name")
    .eq("organization_id", organizationId)
    .in("id", locationIds);
  if (locationError) {
    throw new Error(locationError.message);
  }
  const byId = new Map(
    (locations ?? []).map((location) => [location.id as string, location as { id: string; name: string }])
  );
  return rows.map((row) => ({
    ...row,
    from_location: row.from_location_id ? (byId.get(row.from_location_id) ?? null) : null,
    to_location: row.to_location_id ? (byId.get(row.to_location_id) ?? null) : null
  }));
}

export async function listFacilitySiteLocations(
  supabase: Db,
  organizationId: string,
  siteId: string
) {
  const { data, error } = await supabase
    .from("facility_locations")
    .select("id, name, location_type, status")
    .eq("organization_id", organizationId)
    .eq("site_id", siteId)
    .eq("status", "active")
    .order("name");
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function createFacilityAsset(
  supabase: Db,
  organizationId: string,
  actorId: string,
  input: CreateFacilityAssetInput
) {
  await assertActiveSite(supabase, organizationId, input.siteId);
  await assertLocationOnSite(supabase, organizationId, input.siteId, input.locationId);
  await assertParentAsset(supabase, organizationId, input.siteId, input.parentAssetId);

  const { data: asset, error } = await supabase
    .from("facility_assets")
    .insert({
      organization_id: organizationId,
      site_id: input.siteId,
      location_id: input.locationId ?? null,
      parent_asset_id: input.parentAssetId ?? null,
      category_id: input.categoryId ?? null,
      name: input.name,
      asset_tag: input.assetTag ?? null,
      manufacturer: input.manufacturer ?? null,
      model: input.model ?? null,
      serial_number: input.serialNumber ?? null,
      criticality: input.criticality,
      status: input.status,
      installed_on: input.installedOn ?? null,
      warranty_until: input.warrantyUntil ?? null,
      notes: input.notes ?? null
    })
    .select("*")
    .single();
  if (error) {
    throw new Error(error.message);
  }

  await replaceAssetSystems(supabase, organizationId, asset.id as string, input.systemIds ?? []);

  const payload = {
    name: asset.name,
    status: asset.status,
    criticality: asset.criticality,
    siteId: asset.site_id,
    source: "facility.assets"
  };

  await emitFacilityEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "facility.asset.created",
    aggregateType: "facility_assets",
    aggregateId: asset.id as string,
    payload
  });
  await writeFacilityAudit({
    supabase,
    organizationId,
    actorId,
    action: "facility.asset.created",
    entityType: "facility_assets",
    entityId: asset.id as string,
    payload
  });

  if (asset.status === "active") {
    await emitFacilityEvent({
      supabase,
      organizationId,
      actorId,
      eventType: "facility.asset.activated",
      aggregateType: "facility_assets",
      aggregateId: asset.id as string,
      payload: { name: asset.name, status: "active" }
    });
    await writeFacilityAudit({
      supabase,
      organizationId,
      actorId,
      action: "facility.asset.activated",
      entityType: "facility_assets",
      entityId: asset.id as string,
      payload: { name: asset.name, status: "active" }
    });
  }

  const full = await getFacilityAsset(supabase, organizationId, asset.id as string);
  return {
    asset: full!,
    assistantRecommendation:
      asset.status === "active"
        ? "Asset is active in the registry. Link systems when relevant."
        : "Asset intake saved. Activate when ready for operations."
  };
}

export async function updateFacilityAsset(
  supabase: Db,
  organizationId: string,
  actorId: string,
  assetId: string,
  input: UpdateFacilityAssetInput
) {
  const existing = await getFacilityAsset(supabase, organizationId, assetId);
  if (!existing) {
    throw new Error("Asset not found");
  }
  if (existing.status === "decommissioned") {
    throw new Error("Decommissioned assets cannot be updated");
  }

  if (input.locationId !== undefined && input.locationId !== existing.location_id) {
    throw new Error("Use the asset relocate workflow to change location (preserves history)");
  }
  await assertParentAsset(
    supabase,
    organizationId,
    existing.site_id,
    input.parentAssetId === undefined ? existing.parent_asset_id : input.parentAssetId,
    assetId
  );

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.parentAssetId !== undefined) patch["parent_asset_id"] = input.parentAssetId;
  if (input.categoryId !== undefined) patch["category_id"] = input.categoryId;
  if (input.name !== undefined) patch["name"] = input.name;
  if (input.assetTag !== undefined) patch["asset_tag"] = input.assetTag;
  if (input.manufacturer !== undefined) patch["manufacturer"] = input.manufacturer;
  if (input.model !== undefined) patch["model"] = input.model;
  if (input.serialNumber !== undefined) patch["serial_number"] = input.serialNumber;
  if (input.criticality !== undefined) patch["criticality"] = input.criticality;
  if (input.installedOn !== undefined) patch["installed_on"] = input.installedOn;
  if (input.warrantyUntil !== undefined) patch["warranty_until"] = input.warrantyUntil;
  if (input.notes !== undefined) patch["notes"] = input.notes;

  const { error } = await supabase
    .from("facility_assets")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", assetId);
  if (error) {
    throw new Error(error.message);
  }

  if (input.systemIds) {
    await replaceAssetSystems(supabase, organizationId, assetId, input.systemIds);
  }

  await emitFacilityEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "facility.asset.updated",
    aggregateType: "facility_assets",
    aggregateId: assetId,
    payload: patch
  });
  await writeFacilityAudit({
    supabase,
    organizationId,
    actorId,
    action: "facility.asset.updated",
    entityType: "facility_assets",
    entityId: assetId,
    payload: patch
  });

  return getFacilityAsset(supabase, organizationId, assetId);
}

export async function relocateFacilityAsset(
  supabase: Db,
  organizationId: string,
  actorId: string,
  assetId: string,
  input: RelocateFacilityAssetInput
) {
  const existing = await getFacilityAsset(supabase, organizationId, assetId);
  if (!existing) {
    throw new Error("Asset not found");
  }
  if (existing.status === "decommissioned") {
    throw new Error("Decommissioned assets cannot be relocated");
  }

  const nextLocationId = input.locationId;
  if (nextLocationId === existing.location_id) {
    return {
      asset: existing,
      locationHistory: await listFacilityAssetLocationHistory(supabase, organizationId, assetId),
      unchanged: true as const
    };
  }

  await assertLocationOnSite(supabase, organizationId, existing.site_id, nextLocationId);

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("facility_assets")
    .update({
      location_id: nextLocationId,
      updated_at: now
    })
    .eq("organization_id", organizationId)
    .eq("id", assetId);
  if (error) {
    throw new Error(error.message);
  }

  const { data: historyRow, error: historyError } = await supabase
    .from("facility_asset_location_history")
    .insert({
      organization_id: organizationId,
      asset_id: assetId,
      site_id: existing.site_id,
      from_location_id: existing.location_id,
      to_location_id: nextLocationId,
      reason: input.reason?.trim() || null,
      relocated_by: actorId,
      relocated_at: now
    })
    .select("*")
    .single();
  if (historyError) {
    throw new Error(historyError.message);
  }

  const payload = {
    name: existing.name,
    siteId: existing.site_id,
    fromLocationId: existing.location_id,
    toLocationId: nextLocationId,
    reason: input.reason?.trim() || null,
    historyId: historyRow.id as string,
    source: "facility.assets.relocate"
  };

  await emitFacilityEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "facility.asset.relocated",
    aggregateType: "facility_assets",
    aggregateId: assetId,
    payload
  });
  await writeFacilityAudit({
    supabase,
    organizationId,
    actorId,
    action: "facility.asset.relocated",
    entityType: "facility_assets",
    entityId: assetId,
    payload
  });

  const asset = await getFacilityAsset(supabase, organizationId, assetId);
  const locationHistory = await listFacilityAssetLocationHistory(
    supabase,
    organizationId,
    assetId
  );
  return { asset: asset!, locationHistory, unchanged: false as const };
}

export async function transitionFacilityAssetStatus(
  supabase: Db,
  organizationId: string,
  actorId: string,
  assetId: string,
  input: FacilityAssetLifecycleInput
) {
  const existing = await getFacilityAsset(supabase, organizationId, assetId);
  if (!existing) {
    throw new Error("Asset not found");
  }
  const from = existing.status as FacilityAssetStatus;
  const to = input.status;
  if (!canTransitionFacilityAssetStatus(from, to)) {
    throw new Error(`Cannot transition asset from ${from} to ${to}`);
  }
  if (from === to) {
    return { asset: existing, alreadyInStatus: true as const };
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status: to,
    updated_at: now,
    decommissioned_at: to === "decommissioned" ? now : null
  };

  const { error } = await supabase
    .from("facility_assets")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", assetId);
  if (error) {
    throw new Error(error.message);
  }

  const eventType =
    to === "active" && from === "intake"
      ? "facility.asset.activated"
      : to === "active" && from === "in_repair"
        ? "facility.asset.returned_active"
        : to === "in_repair"
          ? "facility.asset.in_repair"
          : to === "decommissioned"
            ? "facility.asset.decommissioned"
            : "facility.asset.updated";

  const payload = { name: existing.name, from, to, criticality: existing.criticality };
  await emitFacilityEvent({
    supabase,
    organizationId,
    actorId,
    eventType,
    aggregateType: "facility_assets",
    aggregateId: assetId,
    payload
  });
  await writeFacilityAudit({
    supabase,
    organizationId,
    actorId,
    action: eventType,
    entityType: "facility_assets",
    entityId: assetId,
    payload
  });

  if (to === "decommissioned" && existing.criticality === "critical") {
    await writeFacilityNotification({
      supabase,
      organizationId,
      userId: actorId,
      siteId: existing.site_id,
      notificationKey: "facility.asset.decommissioned",
      title: "Critical asset decommissioned",
      body: `${existing.name} was decommissioned.`,
      href: `/facility/assets/${assetId}`
    });
  }

  const asset = await getFacilityAsset(supabase, organizationId, assetId);
  return {
    asset: asset!,
    alreadyInStatus: false as const,
    assistantRecommendation:
      to === "active"
        ? "Asset is active in the registry."
        : to === "in_repair"
          ? "Asset marked in repair. Restore when ready."
          : to === "decommissioned"
            ? "Asset decommissioned."
            : "Asset lifecycle updated."
  };
}

export function buildAssetAssistantRecommendation(asset: FacilityAsset): string {
  if (asset.status === "intake") {
    return "Activate this asset when intake details are complete.";
  }
  if (asset.status === "in_repair") {
    return asset.criticality === "critical"
      ? "Critical asset is in repair — prioritize restoration."
      : "Asset is in repair. Return to active when complete.";
  }
  if (asset.status === "decommissioned") {
    return "This asset is decommissioned and read-only.";
  }
  const systems = asset.facility_asset_systems ?? [];
  if (systems.length === 0) {
    return "Asset is active. Link a building system when it belongs to one.";
  }
  return "Asset is active in the registry.";
}
