import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isHighSafetySeverity,
  type CloseSafetyIncidentInput,
  type CreateSafetyIncidentInput,
  type SafetyIncidentStatus,
  type SafetySeverity,
  type SpawnSafetyWorkOrderInput,
  type TriageSafetyIncidentInput
} from "@mpa/shared";
import { emitFacilityEvent, writeFacilityAudit, writeFacilityNotification } from "./events-audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

const SELECT_INCIDENT = `
  *,
  facility_sites ( id, name, property_id ),
  facility_assets ( id, name ),
  facility_systems ( id, name )
`;

const OPEN_WORK_ORDER_STATUSES = ["submitted", "triaged", "assigned", "in_progress", "completed"];

export type SafetyIncidentRow = {
  id: string;
  organization_id: string;
  site_id: string;
  asset_id: string | null;
  system_id: string | null;
  incident_type: string;
  severity: SafetySeverity;
  status: SafetyIncidentStatus;
  title: string;
  description: string;
  closed_summary: string | null;
  reported_by_user_id: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  facility_sites?: { id: string; name: string; property_id: string | null } | null;
  facility_assets?: { id: string; name: string } | null;
  facility_systems?: { id: string; name: string } | null;
  workOrderIds?: string[];
};

function severityToPriority(severity: SafetySeverity): string {
  switch (severity) {
    case "critical":
      return "urgent";
    case "high":
      return "high";
    case "low":
      return "low";
    default:
      return "normal";
  }
}

async function recordSafety(
  supabase: Db,
  args: {
    organizationId: string;
    actorId: string | null;
    aggregateId: string;
    eventType: string;
    payload?: Record<string, unknown>;
  }
) {
  const payload = args.payload ?? {};
  await emitFacilityEvent({
    supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    eventType: args.eventType,
    aggregateType: "facility_safety_incidents",
    aggregateId: args.aggregateId,
    payload
  });
  await writeFacilityAudit({
    supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    action: args.eventType,
    entityType: "facility_safety_incidents",
    entityId: args.aggregateId,
    payload
  });
}

async function notifyManagers(
  supabase: Db,
  organizationId: string,
  args: {
    siteId: string | null;
    key: string;
    title: string;
    body: string;
    href: string;
  }
) {
  const { data: memberships } = await supabase
    .from("organization_memberships")
    .select("user_id, roles")
    .eq("organization_id", organizationId)
    .eq("status", "active");
  const managerIds = (memberships ?? [])
    .filter(
      (row) =>
        Array.isArray(row.roles) &&
        (row.roles.includes("organization_admin") || row.roles.includes("property_manager"))
    )
    .map((row) => row.user_id as string);
  await Promise.all(
    managerIds.map((userId) =>
      writeFacilityNotification({
        supabase,
        organizationId,
        userId,
        siteId: args.siteId,
        notificationKey: args.key,
        title: args.title,
        body: args.body,
        href: args.href
      })
    )
  );
}

async function loadIncidentWorkOrderIds(
  supabase: Db,
  organizationId: string,
  incidentId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("facility_safety_incident_work_orders")
    .select("work_order_id")
    .eq("organization_id", organizationId)
    .eq("incident_id", incidentId);
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => row.work_order_id as string);
}

async function loadOpenLinkedWorkOrders(
  supabase: Db,
  organizationId: string,
  incidentId: string
) {
  const workOrderIds = await loadIncidentWorkOrderIds(supabase, organizationId, incidentId);
  if (workOrderIds.length === 0) {
    return [];
  }
  const { data, error } = await supabase
    .from("maintenance_work_orders")
    .select("id, title, status")
    .eq("organization_id", organizationId)
    .in("id", workOrderIds)
    .in("status", OPEN_WORK_ORDER_STATUSES);
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function listSafetyIncidents(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("facility_safety_incidents")
    .select(SELECT_INCIDENT)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as SafetyIncidentRow[];
}

export async function getSafetyIncident(
  supabase: Db,
  organizationId: string,
  incidentId: string
): Promise<SafetyIncidentRow | null> {
  const { data, error } = await supabase
    .from("facility_safety_incidents")
    .select(SELECT_INCIDENT)
    .eq("organization_id", organizationId)
    .eq("id", incidentId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }
  const workOrderIds = await loadIncidentWorkOrderIds(supabase, organizationId, incidentId);
  return { ...(data as SafetyIncidentRow), workOrderIds };
}

export async function createSafetyIncident(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: CreateSafetyIncidentInput
) {
  const { data: site, error: siteError } = await supabase
    .from("facility_sites")
    .select("id, status")
    .eq("organization_id", organizationId)
    .eq("id", input.siteId)
    .maybeSingle();
  if (siteError) {
    throw new Error(siteError.message);
  }
  if (!site || site.status !== "active") {
    throw new Error("Active facility site required for safety incidents");
  }

  if (input.assetId) {
    const { data: asset, error } = await supabase
      .from("facility_assets")
      .select("id, site_id")
      .eq("organization_id", organizationId)
      .eq("id", input.assetId)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    if (!asset || asset.site_id !== input.siteId) {
      throw new Error("Asset must belong to the selected facility site");
    }
  }
  if (input.systemId) {
    const { data: system, error } = await supabase
      .from("facility_systems")
      .select("id, site_id")
      .eq("organization_id", organizationId)
      .eq("id", input.systemId)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    if (!system || system.site_id !== input.siteId) {
      throw new Error("Building system must belong to the selected facility site");
    }
  }

  const { data, error } = await supabase
    .from("facility_safety_incidents")
    .insert({
      organization_id: organizationId,
      site_id: input.siteId,
      asset_id: input.assetId ?? null,
      system_id: input.systemId ?? null,
      incident_type: input.incidentType,
      severity: input.severity,
      status: "reported",
      title: input.title,
      description: input.description,
      reported_by_user_id: actorUserId
    })
    .select(SELECT_INCIDENT)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  const incident = data as SafetyIncidentRow;
  await recordSafety(supabase, {
    organizationId,
    actorId: actorUserId,
    aggregateId: incident.id,
    eventType: "facility.safety.incident_reported",
    payload: {
      title: incident.title,
      severity: incident.severity,
      incident_type: incident.incident_type,
      site_id: incident.site_id
    }
  });

  if (isHighSafetySeverity(incident.severity)) {
    await notifyManagers(supabase, organizationId, {
      siteId: incident.site_id,
      key: "facility.safety.incident_reported",
      title: `${incident.severity.toUpperCase()} safety incident`,
      body: incident.title,
      href: `/facility/safety?incidentId=${incident.id}`
    });
  }

  return { ...incident, workOrderIds: [] as string[] };
}

export async function triageSafetyIncident(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: TriageSafetyIncidentInput
) {
  const existing = await getSafetyIncident(supabase, organizationId, input.incidentId);
  if (!existing) {
    throw new Error("Safety incident not found");
  }
  if (existing.status === "closed") {
    throw new Error("Closed incidents cannot be triaged");
  }

  const { data, error } = await supabase
    .from("facility_safety_incidents")
    .update({
      severity: input.severity,
      status: "triaged",
      updated_at: new Date().toISOString()
    })
    .eq("organization_id", organizationId)
    .eq("id", input.incidentId)
    .select(SELECT_INCIDENT)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  const incident = data as SafetyIncidentRow;
  await recordSafety(supabase, {
    organizationId,
    actorId: actorUserId,
    aggregateId: incident.id,
    eventType: "facility.safety.incident_triaged",
    payload: {
      severity: incident.severity,
      notes: input.notes ?? null,
      site_id: incident.site_id
    }
  });

  const workOrderIds = await loadIncidentWorkOrderIds(supabase, organizationId, incident.id);
  return { ...incident, workOrderIds };
}

export async function spawnSafetyWorkOrder(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: SpawnSafetyWorkOrderInput
) {
  const incident = await getSafetyIncident(supabase, organizationId, input.incidentId);
  if (!incident) {
    throw new Error("Safety incident not found");
  }
  if (incident.status === "closed") {
    throw new Error("Cannot spawn work orders for closed incidents");
  }

  const propertyId = incident.facility_sites?.property_id ?? null;
  const priority = input.priority ?? severityToPriority(incident.severity);

  const { data: workOrder, error } = await supabase
    .from("maintenance_work_orders")
    .insert({
      organization_id: organizationId,
      property_id: propertyId,
      requested_by_user_id: actorUserId,
      product_context: "facility",
      work_kind: "facility_safety_corrective",
      source: "facility_safety",
      site_id: incident.site_id,
      asset_id: incident.asset_id,
      system_id: incident.system_id,
      title: input.title,
      description: input.description,
      category: input.category,
      priority,
      status: "submitted",
      assignee_type: "unassigned"
    })
    .select("id, title, status, priority, product_context, work_kind, source")
    .single();
  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("maintenance_work_order_updates").insert({
    organization_id: organizationId,
    work_order_id: workOrder.id,
    actor_user_id: actorUserId,
    actor_role: "system",
    body: `Spawned from safety incident ${incident.id}`,
    status_from: null,
    status_to: "submitted"
  });

  const { error: linkError } = await supabase.from("facility_safety_incident_work_orders").insert({
    organization_id: organizationId,
    incident_id: incident.id,
    work_order_id: workOrder.id
  });
  if (linkError) {
    throw new Error(linkError.message);
  }

  const { data: updatedIncident, error: incidentError } = await supabase
    .from("facility_safety_incidents")
    .update({
      status: "actions_open",
      updated_at: new Date().toISOString()
    })
    .eq("organization_id", organizationId)
    .eq("id", incident.id)
    .select(SELECT_INCIDENT)
    .single();
  if (incidentError) {
    throw new Error(incidentError.message);
  }

  await emitFacilityEvent({
    supabase,
    organizationId,
    actorId: actorUserId,
    eventType: "work_order.created",
    aggregateType: "maintenance_work_orders",
    aggregateId: workOrder.id as string,
    payload: {
      product_context: "facility",
      work_kind: "facility_safety_corrective",
      source: "facility_safety",
      incident_id: incident.id,
      title: workOrder.title,
      site_id: incident.site_id
    }
  });

  await recordSafety(supabase, {
    organizationId,
    actorId: actorUserId,
    aggregateId: incident.id,
    eventType: "facility.safety.actions_open",
    payload: {
      work_order_id: workOrder.id,
      title: workOrder.title,
      site_id: incident.site_id
    }
  });

  const workOrderIds = await loadIncidentWorkOrderIds(supabase, organizationId, incident.id);
  return {
    incident: updatedIncident as SafetyIncidentRow,
    workOrder: workOrder as { id: string; title: string; status: string },
    workOrderIds
  };
}

export async function closeSafetyIncident(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: CloseSafetyIncidentInput
) {
  const existing = await getSafetyIncident(supabase, organizationId, input.incidentId);
  if (!existing) {
    throw new Error("Safety incident not found");
  }
  if (existing.status === "closed") {
    throw new Error("Incident is already closed");
  }
  if (!input.closedSummary?.trim()) {
    throw new Error("Closed summary is required");
  }

  const openWorkOrders = await loadOpenLinkedWorkOrders(supabase, organizationId, input.incidentId);
  if (openWorkOrders.length > 0 && !input.deferOpenWorkOrders) {
    throw new Error(
      "Open linked work orders remain — close them first or set deferOpenWorkOrders=true"
    );
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("facility_safety_incidents")
    .update({
      status: "closed",
      closed_summary: input.closedSummary,
      closed_at: now,
      updated_at: now
    })
    .eq("organization_id", organizationId)
    .eq("id", input.incidentId)
    .select(SELECT_INCIDENT)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  const incident = data as SafetyIncidentRow;
  await recordSafety(supabase, {
    organizationId,
    actorId: actorUserId,
    aggregateId: incident.id,
    eventType: "facility.safety.incident_closed",
    payload: {
      closed_summary: input.closedSummary,
      deferred_open_work_orders: input.deferOpenWorkOrders,
      open_work_order_count: openWorkOrders.length,
      site_id: incident.site_id
    }
  });

  const workOrderIds = await loadIncidentWorkOrderIds(supabase, organizationId, incident.id);
  return { ...incident, workOrderIds };
}

export async function searchSafety(supabase: Db, organizationId: string, query: string) {
  const q = query.trim();
  if (q.length < 2) {
    return [];
  }
  const { data, error } = await supabase
    .from("facility_safety_incidents")
    .select("id, title, status, severity, incident_type")
    .eq("organization_id", organizationId)
    .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => ({
    id: row.id as string,
    label: `${row.title as string} · ${row.severity as string}`,
    href: `/facility/safety?incidentId=${row.id as string}`,
    group: "Safety"
  }));
}

export function summarizeSafety(incidents: readonly SafetyIncidentRow[]) {
  const open = incidents.filter((incident) => incident.status !== "closed");
  const highSeverity = open.filter((incident) => isHighSafetySeverity(incident.severity));
  const actionsOpen = open.filter((incident) => incident.status === "actions_open");
  return {
    total: incidents.length,
    openCount: open.length,
    highSeverityCount: highSeverity.length,
    actionsOpenCount: actionsOpen.length,
    firstOpenIncidentId: open[0]?.id ?? null
  };
}

export function buildSafetyAssistant(summary: {
  highSeverityCount: number;
  actionsOpenCount: number;
  openCount: number;
}) {
  if (summary.highSeverityCount > 0) {
    return "Triage high-severity safety incidents and spawn corrective work immediately.";
  }
  if (summary.actionsOpenCount > 0) {
    return "Track open safety corrective work orders through completion, then close incidents.";
  }
  if (summary.openCount > 0) {
    return "Review reported safety incidents and triage severity.";
  }
  return "Safety reporting is clear. Encourage near-miss reporting before incidents escalate.";
}
