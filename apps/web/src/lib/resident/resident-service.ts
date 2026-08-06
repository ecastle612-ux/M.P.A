import type { SupabaseClient } from "@supabase/supabase-js";
import {
  RESIDENT_PORTAL_STATUS_LABELS,
  RESIDENT_STATUS_LABELS,
  buildResidentReadyAssistantCopy,
  residentDisplayName,
  type CreateResidentInput,
  type ResidentPortalStatus,
  type ResidentStatus
} from "@mpa/shared";
import { emitResidentEvent, writeResidentAudit } from "./events-audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export type PortfolioResident = {
  id: string;
  organization_id: string;
  property_id: string;
  unit_id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
  phone: string | null;
  status: ResidentStatus;
  portal_status: ResidentPortalStatus;
  user_id: string | null;
  lease_id: string | null;
  created_at: string;
  updated_at: string;
  property_properties?: { id: string; name: string } | null;
  property_units?: { id: string; unit_label: string; status: string } | null;
};

function statusLabel(status: string): string {
  if (status in RESIDENT_STATUS_LABELS) {
    return RESIDENT_STATUS_LABELS[status as ResidentStatus];
  }
  return status;
}

function portalLabel(status: string): string {
  if (status in RESIDENT_PORTAL_STATUS_LABELS) {
    return RESIDENT_PORTAL_STATUS_LABELS[status as ResidentPortalStatus];
  }
  return status;
}

export async function getResidentReadiness(supabase: Db, organizationId: string) {
  const { count, error } = await supabase
    .from("pm_residents")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);
  if (error) {
    throw new Error(error.message);
  }
  const residentCount = count ?? 0;
  return {
    residentCount,
    residentReady: residentCount > 0
  };
}

export async function createResident(
  supabase: Db,
  organizationId: string,
  actorId: string,
  input: CreateResidentInput
) {
  const { data: property, error: propertyError } = await supabase
    .from("property_properties")
    .select("id, name, status")
    .eq("organization_id", organizationId)
    .eq("id", input.propertyId)
    .maybeSingle();
  if (propertyError) {
    throw new Error(propertyError.message);
  }
  if (!property) {
    throw new Error("Property not found in this organization.");
  }

  const { data: unit, error: unitError } = await supabase
    .from("property_units")
    .select("id, unit_label, status, property_id")
    .eq("organization_id", organizationId)
    .eq("id", input.unitId)
    .maybeSingle();
  if (unitError) {
    throw new Error(unitError.message);
  }
  if (!unit || unit.property_id !== input.propertyId) {
    throw new Error("Unit must belong to the selected property.");
  }

  const displayName = residentDisplayName(input.firstName, input.lastName);
  const status: ResidentStatus = "pending_lease";
  const portalStatus: ResidentPortalStatus = "pending_activation";

  const { data: resident, error } = await supabase
    .from("pm_residents")
    .insert({
      organization_id: organizationId,
      property_id: input.propertyId,
      unit_id: input.unitId,
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      display_name: displayName,
      email: input.email.trim().toLowerCase(),
      status,
      portal_status: portalStatus,
      created_by: actorId
    })
    .select(
      "*, property_properties(id, name), property_units(id, unit_label, status)"
    )
    .single();
  if (error) {
    if (error.code === "23505") {
      throw new Error("A resident with this email already exists in the organization.");
    }
    throw new Error(error.message);
  }

  const typed = resident as PortfolioResident;
  const basePayload = {
    displayName,
    email: typed.email,
    status,
    portalStatus,
    propertyId: input.propertyId,
    propertyName: property.name,
    unitId: input.unitId,
    unitLabel: unit.unit_label,
    source: "pm.residents"
  };

  const eventSpecs = [
    {
      eventType: "resident.created",
      payload: basePayload
    },
    {
      eventType: "resident.property_assigned",
      payload: {
        propertyId: input.propertyId,
        propertyName: property.name,
        displayName
      }
    },
    {
      eventType: "resident.unit_assigned",
      payload: {
        unitId: input.unitId,
        unitLabel: unit.unit_label,
        propertyId: input.propertyId,
        displayName
      }
    },
    {
      eventType: "resident.portal_provisioned",
      payload: {
        portalStatus,
        portalStatusLabel: portalLabel(portalStatus),
        displayName,
        note: "Lease not yet signed — portal Pending Activation"
      }
    }
  ] as const;

  for (const spec of eventSpecs) {
    await emitResidentEvent({
      supabase,
      organizationId,
      actorId,
      eventType: spec.eventType,
      aggregateType: "pm_residents",
      aggregateId: typed.id,
      payload: spec.payload
    });
    await writeResidentAudit({
      supabase,
      organizationId,
      actorId,
      action: spec.eventType,
      entityType: "pm_residents",
      entityId: typed.id,
      payload: spec.payload
    });
  }

  // Property timeline also records assignment so the property Command Center stays current.
  await emitResidentEvent({
    supabase,
    organizationId,
    actorId,
    eventType: "resident.property_assigned",
    aggregateType: "property_properties",
    aggregateId: input.propertyId,
    payload: {
      residentId: typed.id,
      displayName,
      unitLabel: unit.unit_label
    }
  });

  return {
    resident: typed,
    assistantRecommendation: buildResidentReadyAssistantCopy(displayName),
    readyMessage: "My first resident has been added."
  };
}

export async function listResidents(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("pm_residents")
    .select("*, property_properties(id, name), property_units(id, unit_label, status)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as PortfolioResident[];
}

export async function listResidentsForProperty(
  supabase: Db,
  organizationId: string,
  propertyId: string
) {
  const { data, error } = await supabase
    .from("pm_residents")
    .select("id, display_name, email, status, portal_status, unit_id, property_units(id, unit_label)")
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .order("display_name");
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function getResident(
  supabase: Db,
  organizationId: string,
  residentId: string
) {
  const { data, error } = await supabase
    .from("pm_residents")
    .select("*, property_properties(id, name), property_units(id, unit_label, status)")
    .eq("organization_id", organizationId)
    .eq("id", residentId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return (data as PortfolioResident | null) ?? null;
}

export async function searchResidents(supabase: Db, organizationId: string, query: string) {
  const normalized = query.trim();
  let request = supabase
    .from("pm_residents")
    .select("id, display_name, email, status, property_properties(name)")
    .eq("organization_id", organizationId)
    .order("display_name")
    .limit(20);

  if (normalized) {
    request = request.or(
      `display_name.ilike.%${normalized}%,email.ilike.%${normalized}%,first_name.ilike.%${normalized}%,last_name.ilike.%${normalized}%`
    );
  }

  const { data, error } = await request;
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function listResidentTimeline(
  supabase: Db,
  organizationId: string,
  residentId: string
) {
  const { data, error } = await supabase
    .from("event_domain_events")
    .select("id, event_type, payload, created_at, actor_id")
    .eq("organization_id", organizationId)
    .eq("aggregate_type", "pm_residents")
    .eq("aggregate_id", residentId)
    .order("created_at", { ascending: false })
    .limit(25);
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

function timelineTitle(eventType: string): string {
  switch (eventType) {
    case "resident.created":
      return "Resident created";
    case "resident.property_assigned":
      return "Property assigned";
    case "resident.unit_assigned":
      return "Unit assigned";
    case "resident.portal_provisioned":
      return "Resident portal provisioned";
    default:
      return eventType;
  }
}

function timelineDetail(eventType: string, payload: Record<string, unknown> | null): string {
  if (eventType === "resident.portal_provisioned") {
    return "Portal Pending Activation — lease not yet signed.";
  }
  if (eventType === "resident.property_assigned" && typeof payload?.["propertyName"] === "string") {
    return `Assigned to ${payload["propertyName"]}.`;
  }
  if (eventType === "resident.unit_assigned" && typeof payload?.["unitLabel"] === "string") {
    return `Assigned to unit ${payload["unitLabel"]}.`;
  }
  if (typeof payload?.["displayName"] === "string") {
    return `${payload["displayName"]} is on the operational record.`;
  }
  return "Resident lifecycle event";
}

export async function getResidentCommandCenter(
  supabase: Db,
  organizationId: string,
  residentId: string
) {
  const resident = await getResident(supabase, organizationId, residentId);
  if (!resident) {
    return null;
  }

  const timeline = await listResidentTimeline(supabase, organizationId, residentId);
  const propertyName = resident.property_properties?.name ?? "Property";
  const unitLabel = resident.property_units?.unit_label ?? "—";

  return {
    resident: {
      id: resident.id,
      displayName: resident.display_name,
      firstName: resident.first_name,
      lastName: resident.last_name,
      email: resident.email,
      status: resident.status,
      statusLabel: statusLabel(resident.status),
      portalStatus: resident.portal_status,
      portalStatusLabel: portalLabel(resident.portal_status),
      propertyId: resident.property_id,
      propertyName,
      unitId: resident.unit_id,
      unitLabel,
      leaseId: resident.lease_id,
      createdAt: resident.created_at
    },
    timeline: timeline.map((event) => ({
      id: event.id as string,
      title: timelineTitle(String(event.event_type)),
      detail: timelineDetail(
        String(event.event_type),
        (event.payload as Record<string, unknown> | null) ?? null
      ),
      occurredAt: event.created_at as string,
      kind: event.event_type as string
    })),
    assistantRecommendation: buildResidentReadyAssistantCopy(resident.display_name),
    readyMessage: "My first resident has been added.",
    nextJourney: {
      title: "Create your first lease",
      href: "/pm/leasing?new=1",
      detail: "Continue the resident lifecycle with a lease."
    },
    integrations: {
      propertyCommandCenter: `/pm/properties/${resident.property_id}`,
      residentDirectory: "/pm/residents",
      financialOperations: "/pm/financial-operations",
      maintenance: "/pm/maintenance"
    }
  };
}
