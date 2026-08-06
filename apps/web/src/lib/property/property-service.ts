import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildMissionControlNextAction,
  buildPropertyReadyAssistantCopy,
  unitLabelsForCount,
  type CreatePortfolioPropertyInput
} from "@mpa/shared";
import { emitPropertyEvent, writePropertyAudit } from "./events-audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export type PortfolioProperty = {
  id: string;
  organization_id: string;
  name: string;
  address_line1: string | null;
  city: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  property_units?: Array<{
    id: string;
    unit_label: string;
    status: string;
  }>;
};

export async function createPortfolioProperty(
  supabase: Db,
  organizationId: string,
  actorId: string,
  input: CreatePortfolioPropertyInput
) {
  const { data: property, error } = await supabase
    .from("property_properties")
    .insert({
      organization_id: organizationId,
      name: input.name,
      status: "active"
    })
    .select("*")
    .single();
  if (error) {
    throw new Error(error.message);
  }

  const labels = unitLabelsForCount(input.unitCount);
  const { data: units, error: unitError } = await supabase
    .from("property_units")
    .insert(
      labels.map((unit_label) => ({
        organization_id: organizationId,
        property_id: property.id,
        unit_label,
        status: "available"
      }))
    )
    .select("*");
  if (unitError) {
    throw new Error(unitError.message);
  }

  const payload = {
    name: property.name,
    status: property.status,
    unitCount: labels.length,
    unitLabels: labels,
    source: "pm.properties"
  };

  await emitPropertyEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "property.created",
    aggregateType: "property_properties",
    aggregateId: property.id,
    payload
  });

  await emitPropertyEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "property.activated",
    aggregateType: "property_properties",
    aggregateId: property.id,
    payload: { name: property.name, status: "active" }
  });

  await writePropertyAudit({
    supabase,
    organizationId,
    actorId,
    action: "property.created",
    entityType: "property_properties",
    entityId: property.id,
    payload
  });

  await writePropertyAudit({
    supabase,
    organizationId,
    actorId,
    action: "property.activated",
    entityType: "property_properties",
    entityId: property.id,
    payload: { name: property.name, status: "active" }
  });

  return {
    property: property as PortfolioProperty,
    units: units ?? [],
    assistantRecommendation: buildPropertyReadyAssistantCopy(property.name)
  };
}

export async function listPortfolioProperties(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("property_properties")
    .select("*, property_units(id, unit_label, status)")
    .eq("organization_id", organizationId)
    .order("name");
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as PortfolioProperty[];
}

export async function getPortfolioProperty(
  supabase: Db,
  organizationId: string,
  propertyId: string
) {
  const { data, error } = await supabase
    .from("property_properties")
    .select("*, property_units(id, unit_label, status)")
    .eq("organization_id", organizationId)
    .eq("id", propertyId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return (data as PortfolioProperty | null) ?? null;
}

export async function searchPortfolioProperties(
  supabase: Db,
  organizationId: string,
  query: string
) {
  const normalized = query.trim();
  let request = supabase
    .from("property_properties")
    .select("id, name, status, city")
    .eq("organization_id", organizationId)
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

export async function listPropertyTimeline(
  supabase: Db,
  organizationId: string,
  propertyId: string
) {
  const { data, error } = await supabase
    .from("event_domain_events")
    .select("id, event_type, payload, created_at, actor_id")
    .eq("organization_id", organizationId)
    .eq("aggregate_type", "property_properties")
    .eq("aggregate_id", propertyId)
    .order("created_at", { ascending: false })
    .limit(25);
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function getMissionControlState(
  supabase: Db,
  organizationId: string,
  setupComplete: boolean
) {
  const properties = await listPortfolioProperties(supabase, organizationId);
  const first = properties[0] ?? null;
  const { getTeamReadiness } = await import("../team/invitation-service");
  const team = await getTeamReadiness(supabase, organizationId);
  const nextAction = buildMissionControlNextAction({
    setupComplete,
    propertyCount: properties.length,
    firstPropertyId: first?.id ?? null,
    teamReady: team.teamReady
  });

  return {
    propertyCount: properties.length,
    properties: properties.slice(0, 5).map((property) => ({
      id: property.id,
      name: property.name,
      status: property.status,
      unitCount: property.property_units?.length ?? 0
    })),
    teamReady: team.teamReady,
    activeMemberCount: team.activeMemberCount,
    acceptedInviteCount: team.acceptedInviteCount,
    nextAction,
    assistantRecommendation: nextAction.assistantRecommendation
  };
}

export async function getPropertyCommandCenter(
  supabase: Db,
  organizationId: string,
  propertyId: string
) {
  const property = await getPortfolioProperty(supabase, organizationId, propertyId);
  if (!property) {
    return null;
  }

  const timeline = await listPropertyTimeline(supabase, organizationId, propertyId);
  const units = property.property_units ?? [];

  return {
    property: {
      id: property.id,
      name: property.name,
      status: property.status,
      addressLine1: property.address_line1,
      city: property.city,
      createdAt: property.created_at,
      unitCount: units.length,
      unitsAvailable: units.filter((unit) => unit.status === "available").length,
      unitsOccupied: units.filter((unit) => unit.status === "occupied").length
    },
    units,
    timeline: timeline.map((event) => ({
      id: event.id as string,
      title:
        event.event_type === "property.created"
          ? "Property created"
          : event.event_type === "property.activated"
            ? "Property activated"
            : String(event.event_type),
      detail:
        typeof (event.payload as { name?: string } | null)?.name === "string"
          ? `${(event.payload as { name: string }).name} is ready for operations.`
          : "Property lifecycle event",
      occurredAt: event.created_at as string,
      kind: event.event_type as string
    })),
    assistantRecommendation: buildPropertyReadyAssistantCopy(property.name),
    readyMessage: "My property is ready.",
    nextJourney: {
      title: "Invite your team",
      href: "/settings/team",
      detail: "Bring teammates into this organization."
    }
  };
}
