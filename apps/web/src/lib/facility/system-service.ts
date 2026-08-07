import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateFacilitySystemInput, UpdateFacilitySystemInput } from "@mpa/shared";
import { emitFacilityEvent, writeFacilityAudit, writeFacilityNotification } from "./events-audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export type FacilitySystem = {
  id: string;
  organization_id: string;
  site_id: string;
  name: string;
  system_type: string;
  status: string;
  criticality: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  facility_sites?: {
    id: string;
    name: string;
    status: string;
    property_id: string | null;
    property_properties?: { id: string; name: string } | null;
  } | null;
  facility_asset_systems?: Array<{
    asset_id: string;
    facility_assets?: {
      id: string;
      name: string;
      status: string;
      criticality: string;
      asset_tag: string | null;
    } | null;
  }>;
};

const SYSTEM_SELECT =
  "*, facility_sites(id, name, status, property_id, property_properties(id, name)), facility_asset_systems(asset_id, facility_assets(id, name, status, criticality, asset_tag))";

async function assertActiveSite(supabase: Db, organizationId: string, siteId: string) {
  const { data, error } = await supabase
    .from("facility_sites")
    .select("id, status")
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
    throw new Error("Building systems require an active facility site");
  }
}

async function replaceSystemAssets(
  supabase: Db,
  organizationId: string,
  systemId: string,
  assetIds: string[]
) {
  const { error: deleteError } = await supabase
    .from("facility_asset_systems")
    .delete()
    .eq("organization_id", organizationId)
    .eq("system_id", systemId);
  if (deleteError) {
    throw new Error(deleteError.message);
  }
  if (assetIds.length === 0) {
    return;
  }
  const { error } = await supabase.from("facility_asset_systems").insert(
    assetIds.map((assetId) => ({
      organization_id: organizationId,
      asset_id: assetId,
      system_id: systemId
    }))
  );
  if (error) {
    throw new Error(error.message);
  }
}

export async function listFacilitySystems(
  supabase: Db,
  organizationId: string,
  filters?: { siteId?: string; status?: string }
) {
  let request = supabase
    .from("facility_systems")
    .select(SYSTEM_SELECT)
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
  return (data ?? []) as FacilitySystem[];
}

export async function getFacilitySystem(supabase: Db, organizationId: string, systemId: string) {
  const { data, error } = await supabase
    .from("facility_systems")
    .select(SYSTEM_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", systemId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return (data as FacilitySystem | null) ?? null;
}

export async function searchFacilitySystems(supabase: Db, organizationId: string, query: string) {
  const normalized = query.trim();
  let request = supabase
    .from("facility_systems")
    .select("id, name, system_type, status, criticality, site_id")
    .eq("organization_id", organizationId)
    .neq("status", "decommissioned")
    .order("name")
    .limit(20);
  if (normalized) {
    request = request.ilike("name", `%${normalized}%`);
  }
  const { data, error } = await request;
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function listFacilitySystemTimeline(
  supabase: Db,
  organizationId: string,
  systemId: string
) {
  const { data, error } = await supabase
    .from("event_domain_events")
    .select("id, event_type, payload, created_at, actor_id")
    .eq("organization_id", organizationId)
    .eq("aggregate_type", "facility_systems")
    .eq("aggregate_id", systemId)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function createFacilitySystem(
  supabase: Db,
  organizationId: string,
  actorId: string,
  input: CreateFacilitySystemInput
) {
  await assertActiveSite(supabase, organizationId, input.siteId);

  const { data: system, error } = await supabase
    .from("facility_systems")
    .insert({
      organization_id: organizationId,
      site_id: input.siteId,
      name: input.name,
      system_type: input.systemType,
      status: input.status,
      criticality: input.criticality,
      notes: input.notes ?? null
    })
    .select("*")
    .single();
  if (error) {
    throw new Error(error.message);
  }

  await replaceSystemAssets(supabase, organizationId, system.id as string, input.assetIds ?? []);

  const payload = {
    name: system.name,
    status: system.status,
    systemType: system.system_type,
    siteId: system.site_id,
    source: "facility.systems"
  };

  await emitFacilityEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "facility.system.created",
    aggregateType: "facility_systems",
    aggregateId: system.id as string,
    payload
  });
  await writeFacilityAudit({
    supabase,
    organizationId,
    actorId,
    action: "facility.system.created",
    entityType: "facility_systems",
    entityId: system.id as string,
    payload
  });

  if (system.status === "down") {
    await writeFacilityNotification({
      supabase,
      organizationId,
      userId: actorId,
      siteId: system.site_id as string,
      notificationKey: "facility.system.down",
      title: "Building system down",
      body: `${system.name as string} is marked down.`,
      href: `/facility/building-systems/${system.id as string}`
    });
  }

  const full = await getFacilitySystem(supabase, organizationId, system.id as string);
  return {
    system: full!,
    assistantRecommendation:
      system.status === "down"
        ? "System is down — restore status when service returns."
        : "Building system registered. Link assets that participate in this system."
  };
}

export async function updateFacilitySystem(
  supabase: Db,
  organizationId: string,
  actorId: string,
  systemId: string,
  input: UpdateFacilitySystemInput
) {
  const existing = await getFacilitySystem(supabase, organizationId, systemId);
  if (!existing) {
    throw new Error("Building system not found");
  }
  if (existing.status === "decommissioned" && input.status && input.status !== "decommissioned") {
    throw new Error("Decommissioned systems cannot be restored in E.2");
  }

  const previousStatus = existing.status;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) patch["name"] = input.name;
  if (input.systemType !== undefined) patch["system_type"] = input.systemType;
  if (input.status !== undefined) patch["status"] = input.status;
  if (input.criticality !== undefined) patch["criticality"] = input.criticality;
  if (input.notes !== undefined) patch["notes"] = input.notes;

  const { error } = await supabase
    .from("facility_systems")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", systemId);
  if (error) {
    throw new Error(error.message);
  }

  if (input.assetIds) {
    await replaceSystemAssets(supabase, organizationId, systemId, input.assetIds);
  }

  const statusChanged = input.status !== undefined && input.status !== previousStatus;
  const eventType =
    input.status === "decommissioned"
      ? "facility.system.decommissioned"
      : statusChanged
        ? "facility.system.status_changed"
        : "facility.system.updated";

  await emitFacilityEvent({
    supabase,
    organizationId,
    actorId,
    eventType,
    aggregateType: "facility_systems",
    aggregateId: systemId,
    payload: { ...patch, previousStatus }
  });
  await writeFacilityAudit({
    supabase,
    organizationId,
    actorId,
    action: eventType,
    entityType: "facility_systems",
    entityId: systemId,
    payload: { ...patch, previousStatus }
  });

  if (input.status === "down" && previousStatus !== "down") {
    await writeFacilityNotification({
      supabase,
      organizationId,
      userId: actorId,
      siteId: existing.site_id,
      notificationKey: "facility.system.down",
      title: "Building system down",
      body: `${existing.name} is marked down.`,
      href: `/facility/building-systems/${systemId}`
    });
  }

  return getFacilitySystem(supabase, organizationId, systemId);
}

export function buildSystemAssistantRecommendation(system: FacilitySystem): string {
  if (system.status === "down") {
    return "System is down — restore when service returns.";
  }
  if (system.status === "degraded") {
    return "System is degraded — monitor and plan corrective work.";
  }
  if (system.status === "decommissioned") {
    return "This building system is decommissioned.";
  }
  const linked = system.facility_asset_systems ?? [];
  if (linked.length === 0) {
    return "System is active. Link assets that participate in this system.";
  }
  return "Building system is active.";
}
