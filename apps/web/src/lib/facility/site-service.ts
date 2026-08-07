import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateFacilitySiteInput, UpdateFacilitySiteInput } from "@mpa/shared";
import { emitFacilityEvent, writeFacilityAudit, writeFacilityNotification } from "./events-audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export type FacilityLocation = {
  id: string;
  organization_id: string;
  site_id: string;
  parent_location_id: string | null;
  name: string;
  location_type: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type FacilitySite = {
  id: string;
  organization_id: string;
  name: string;
  timezone: string;
  status: string;
  property_id: string | null;
  address_line1: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
  activated_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  facility_locations?: FacilityLocation[];
  property_properties?: { id: string; name: string; status: string } | null;
};

function sitePayload(site: FacilitySite, locationCount: number) {
  return {
    name: site.name,
    status: site.status,
    timezone: site.timezone,
    propertyId: site.property_id,
    locationCount,
    source: "facility.sites"
  };
}

export async function listFacilitySites(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("facility_sites")
    .select(
      "*, facility_locations(id, name, location_type, status, parent_location_id, created_at), property_properties(id, name, status)"
    )
    .eq("organization_id", organizationId)
    .order("name");
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as FacilitySite[];
}

export async function getFacilitySite(supabase: Db, organizationId: string, siteId: string) {
  const { data, error } = await supabase
    .from("facility_sites")
    .select(
      "*, facility_locations(id, name, location_type, status, parent_location_id, created_at, updated_at), property_properties(id, name, status)"
    )
    .eq("organization_id", organizationId)
    .eq("id", siteId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return (data as FacilitySite | null) ?? null;
}

export async function getFacilitySiteForProperty(
  supabase: Db,
  organizationId: string,
  propertyId: string
) {
  const { data, error } = await supabase
    .from("facility_sites")
    .select("id, name, status, property_id")
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data as { id: string; name: string; status: string; property_id: string } | null;
}

export async function searchFacilitySites(supabase: Db, organizationId: string, query: string) {
  const normalized = query.trim();
  let request = supabase
    .from("facility_sites")
    .select("id, name, status, city, timezone")
    .eq("organization_id", organizationId)
    .neq("status", "archived")
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

export async function listFacilitySiteTimeline(
  supabase: Db,
  organizationId: string,
  siteId: string
) {
  const { data, error } = await supabase
    .from("event_domain_events")
    .select("id, event_type, payload, created_at, actor_id")
    .eq("organization_id", organizationId)
    .eq("aggregate_type", "facility_sites")
    .eq("aggregate_id", siteId)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

async function ensureRootLocation(
  supabase: Db,
  organizationId: string,
  siteId: string,
  name: string,
  locationType: string
) {
  const { data: existing } = await supabase
    .from("facility_locations")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("site_id", siteId)
    .eq("status", "active")
    .limit(1);

  if ((existing ?? []).length > 0) {
    return existing![0]!;
  }

  const { data, error } = await supabase
    .from("facility_locations")
    .insert({
      organization_id: organizationId,
      site_id: siteId,
      name,
      location_type: locationType,
      status: "active"
    })
    .select("*")
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data as FacilityLocation;
}

export async function activateFacilitySite(
  supabase: Db,
  organizationId: string,
  actorId: string,
  siteId: string
) {
  const site = await getFacilitySite(supabase, organizationId, siteId);
  if (!site) {
    throw new Error("Facility site not found");
  }
  if (site.status === "archived") {
    throw new Error("Archived sites cannot be activated");
  }
  if (site.status === "active") {
    return { site, alreadyActive: true as const };
  }

  const locations = site.facility_locations ?? [];
  if (!site.name?.trim() || !site.timezone?.trim()) {
    throw new Error("Name and timezone are required to activate");
  }
  if (locations.filter((row) => row.status === "active").length === 0) {
    throw new Error("At least one active location is required to activate");
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("facility_sites")
    .update({ status: "active", activated_at: now, updated_at: now })
    .eq("organization_id", organizationId)
    .eq("id", siteId)
    .select(
      "*, facility_locations(id, name, location_type, status, parent_location_id, created_at), property_properties(id, name, status)"
    )
    .single();
  if (error) {
    throw new Error(error.message);
  }

  const activeSite = updated as FacilitySite;
  const payload = sitePayload(activeSite, activeSite.facility_locations?.length ?? 0);

  await emitFacilityEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "facility.site.activated",
    aggregateType: "facility_sites",
    aggregateId: activeSite.id,
    payload
  });
  await writeFacilityAudit({
    supabase,
    organizationId,
    actorId,
    action: "facility.site.activated",
    entityType: "facility_sites",
    entityId: activeSite.id,
    payload
  });
  await writeFacilityNotification({
    supabase,
    organizationId,
    userId: actorId,
    siteId: activeSite.id,
    notificationKey: "facility.site.activated",
    title: "Facility site activated",
    body: `${activeSite.name} is active for Facility Operations.`,
    href: `/facility/sites/${activeSite.id}`
  });

  return {
    site: activeSite,
    alreadyActive: false as const,
    assistantRecommendation: "Your facility site is ready. Review Facility Overview."
  };
}

export async function createFacilitySite(
  supabase: Db,
  organizationId: string,
  actorId: string,
  input: CreateFacilitySiteInput
) {
  if (input.propertyId) {
    const { data: property, error: propertyError } = await supabase
      .from("property_properties")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("id", input.propertyId)
      .maybeSingle();
    if (propertyError) {
      throw new Error(propertyError.message);
    }
    if (!property) {
      throw new Error("Linked property not found in this organization");
    }
  }

  const { data: site, error } = await supabase
    .from("facility_sites")
    .insert({
      organization_id: organizationId,
      name: input.name,
      timezone: input.timezone,
      status: "draft",
      property_id: input.propertyId ?? null,
      address_line1: input.addressLine1 ?? null,
      city: input.city ?? null,
      region: input.region ?? null,
      postal_code: input.postalCode ?? null,
      country: input.country ?? null
    })
    .select("*")
    .single();
  if (error) {
    throw new Error(error.message);
  }

  const location = await ensureRootLocation(
    supabase,
    organizationId,
    site.id as string,
    input.rootLocationName,
    input.rootLocationType
  );

  const createdPayload = {
    name: site.name as string,
    status: "draft",
    timezone: site.timezone as string,
    propertyId: site.property_id as string | null,
    locationCount: 1,
    rootLocationId: location.id,
    source: "facility.sites"
  };

  await emitFacilityEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "facility.site.created",
    aggregateType: "facility_sites",
    aggregateId: site.id as string,
    payload: createdPayload
  });
  await writeFacilityAudit({
    supabase,
    organizationId,
    actorId,
    action: "facility.site.created",
    entityType: "facility_sites",
    entityId: site.id as string,
    payload: createdPayload
  });

  if (input.activate) {
    const activated = await activateFacilitySite(
      supabase,
      organizationId,
      actorId,
      site.id as string
    );
    return {
      site: activated.site,
      location,
      assistantRecommendation: activated.assistantRecommendation
    };
  }

  const full = await getFacilitySite(supabase, organizationId, site.id as string);
  return {
    site: full!,
    location,
    assistantRecommendation: "Activate your facility site."
  };
}

export async function updateFacilitySite(
  supabase: Db,
  organizationId: string,
  actorId: string,
  siteId: string,
  input: UpdateFacilitySiteInput
) {
  const existing = await getFacilitySite(supabase, organizationId, siteId);
  if (!existing) {
    throw new Error("Facility site not found");
  }
  if (existing.status === "archived") {
    throw new Error("Archived sites cannot be updated");
  }

  if (input.propertyId) {
    const { data: property, error: propertyError } = await supabase
      .from("property_properties")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("id", input.propertyId)
      .maybeSingle();
    if (propertyError) {
      throw new Error(propertyError.message);
    }
    if (!property) {
      throw new Error("Linked property not found in this organization");
    }
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };
  if (input.name !== undefined) patch["name"] = input.name;
  if (input.timezone !== undefined) patch["timezone"] = input.timezone;
  if (input.addressLine1 !== undefined) patch["address_line1"] = input.addressLine1;
  if (input.city !== undefined) patch["city"] = input.city;
  if (input.region !== undefined) patch["region"] = input.region;
  if (input.postalCode !== undefined) patch["postal_code"] = input.postalCode;
  if (input.country !== undefined) patch["country"] = input.country;
  if (input.propertyId !== undefined) patch["property_id"] = input.propertyId;

  const { error } = await supabase
    .from("facility_sites")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", siteId);
  if (error) {
    throw new Error(error.message);
  }

  const site = await getFacilitySite(supabase, organizationId, siteId);
  await writeFacilityAudit({
    supabase,
    organizationId,
    actorId,
    action: "facility.site.updated",
    entityType: "facility_sites",
    entityId: siteId,
    payload: patch
  });
  return site;
}

export async function archiveFacilitySite(
  supabase: Db,
  organizationId: string,
  actorId: string,
  siteId: string
) {
  const existing = await getFacilitySite(supabase, organizationId, siteId);
  if (!existing) {
    throw new Error("Facility site not found");
  }
  if (existing.status === "archived") {
    return existing;
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("facility_sites")
    .update({ status: "archived", archived_at: now, updated_at: now })
    .eq("organization_id", organizationId)
    .eq("id", siteId);
  if (error) {
    throw new Error(error.message);
  }

  const site = await getFacilitySite(supabase, organizationId, siteId);
  const payload = sitePayload(site!, site?.facility_locations?.length ?? 0);
  await emitFacilityEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "facility.site.archived",
    aggregateType: "facility_sites",
    aggregateId: siteId,
    payload
  });
  await writeFacilityAudit({
    supabase,
    organizationId,
    actorId,
    action: "facility.site.archived",
    entityType: "facility_sites",
    entityId: siteId,
    payload
  });
  return site;
}
