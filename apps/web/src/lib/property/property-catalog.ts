import type { SupabaseClient } from "@supabase/supabase-js";
import {
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

/**
 * Property catalog mutations/queries with no finance or journey orchestration deps.
 * Used by billing compatibility paths and command-center composition.
 */
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
