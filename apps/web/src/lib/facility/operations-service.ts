import type { SupabaseClient } from "@supabase/supabase-js";
import {
  defaultPriorityFromCriticality,
  type CreateFacilityWorkOrderInput,
  type WorkOrderPriority
} from "@mpa/shared";
import {
  closeFacilityWorkOrder,
  getWorkOrder,
  listTechnicians,
  listVendors,
  listWorkOrderUpdates,
  listWorkOrders,
  type WorkOrderRow
} from "../maintenance/maintenance-service";
import { emitFacilityEvent, writeFacilityAudit, writeFacilityNotification } from "./events-audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

const OPEN_STATUSES = ["submitted", "triaged", "assigned", "in_progress", "completed"] as const;

async function notifyFacilityManagers(
  supabase: Db,
  organizationId: string,
  args: {
    siteId: string;
    workOrderId: string;
    key: string;
    title: string;
    body: string;
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
        href: `/facility/operations?workOrderId=${args.workOrderId}`
      })
    )
  );
}

export async function listFacilityWorkOrders(supabase: Db, organizationId: string) {
  return listWorkOrders(supabase, organizationId, { productContext: "facility" });
}

export async function getFacilityWorkOrder(
  supabase: Db,
  organizationId: string,
  workOrderId: string
) {
  const workOrder = await getWorkOrder(supabase, organizationId, workOrderId);
  if (!workOrder || workOrder.product_context !== "facility") {
    return null;
  }
  return workOrder;
}

export async function listFacilityWorkOrderUpdates(
  supabase: Db,
  organizationId: string,
  workOrderId: string
) {
  return listWorkOrderUpdates(supabase, organizationId, workOrderId);
}

export async function listFacilityExecutionSupport(supabase: Db, organizationId: string) {
  const [technicians, vendors] = await Promise.all([
    listTechnicians(supabase, organizationId),
    listVendors(supabase, organizationId)
  ]);
  return { technicians, vendors };
}

export async function createFacilityWorkOrder(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: CreateFacilityWorkOrderInput
) {
  const { data: site, error: siteError } = await supabase
    .from("facility_sites")
    .select("id, name, status, property_id")
    .eq("organization_id", organizationId)
    .eq("id", input.siteId)
    .maybeSingle();
  if (siteError) {
    throw new Error(siteError.message);
  }
  if (!site) {
    throw new Error("Facility site not found");
  }
  if (site.status !== "active") {
    throw new Error("Activate the facility site before creating corrective work");
  }

  let assetCriticality: string | null = null;
  if (input.assetId) {
    const { data: asset, error: assetError } = await supabase
      .from("facility_assets")
      .select("id, site_id, name, criticality, status")
      .eq("organization_id", organizationId)
      .eq("id", input.assetId)
      .maybeSingle();
    if (assetError) {
      throw new Error(assetError.message);
    }
    if (!asset) {
      throw new Error("Asset not found");
    }
    if (asset.site_id !== input.siteId) {
      throw new Error("Asset must belong to the selected facility site");
    }
    assetCriticality = asset.criticality;
  }

  let systemCriticality: string | null = null;
  if (input.systemId) {
    const { data: system, error: systemError } = await supabase
      .from("facility_systems")
      .select("id, site_id, name, criticality, status")
      .eq("organization_id", organizationId)
      .eq("id", input.systemId)
      .maybeSingle();
    if (systemError) {
      throw new Error(systemError.message);
    }
    if (!system) {
      throw new Error("Building system not found");
    }
    if (system.site_id !== input.siteId) {
      throw new Error("Building system must belong to the selected facility site");
    }
    systemCriticality = system.criticality;
  }

  const priority: WorkOrderPriority =
    input.priority ??
    defaultPriorityFromCriticality(assetCriticality ?? systemCriticality ?? "medium");

  const { data: workOrder, error } = await supabase
    .from("maintenance_work_orders")
    .insert({
      organization_id: organizationId,
      property_id: site.property_id ?? null,
      unit_id: null,
      resident_id: null,
      requested_by_user_id: actorUserId,
      product_context: "facility",
      work_kind: "facility_corrective",
      source: "facility_ops",
      site_id: input.siteId,
      asset_id: input.assetId ?? null,
      system_id: input.systemId ?? null,
      title: input.title,
      description: input.description,
      category: input.category,
      priority,
      status: "submitted",
      assignee_type: "unassigned"
    })
    .select(
      `
      *,
      property_properties ( id, name ),
      facility_sites ( id, name ),
      facility_assets ( id, name, criticality ),
      facility_systems ( id, name, criticality ),
      vendor_vendors ( id, name, email, user_id )
    `
    )
    .single();
  if (error) {
    throw new Error(error.message);
  }

  const row = workOrder as WorkOrderRow;

  const { error: updateError } = await supabase.from("maintenance_work_order_updates").insert({
    organization_id: organizationId,
    work_order_id: row.id,
    actor_user_id: actorUserId,
    actor_role: "manager",
    body: `Facility corrective work opened: ${input.title}`,
    status_from: null,
    status_to: "submitted"
  });
  if (updateError) {
    throw new Error(updateError.message);
  }

  const payload = {
    product_context: "facility",
    work_kind: "facility_corrective",
    source: "facility_ops",
    site_id: input.siteId,
    asset_id: input.assetId ?? null,
    system_id: input.systemId ?? null,
    title: input.title,
    priority,
    category: input.category,
    siteName: site.name
  };

  await emitFacilityEvent({
    supabase,
    organizationId,
    actorId: actorUserId,
    eventType: "work_order.created",
    aggregateType: "maintenance_work_orders",
    aggregateId: row.id,
    payload
  });
  await emitFacilityEvent({
    supabase,
    organizationId,
    actorId: actorUserId,
    eventType: "work_order.created",
    aggregateType: "facility_sites",
    aggregateId: input.siteId,
    payload: { ...payload, workOrderId: row.id }
  });
  if (input.assetId) {
    await emitFacilityEvent({
      supabase,
      organizationId,
      actorId: actorUserId,
      eventType: "work_order.created",
      aggregateType: "facility_assets",
      aggregateId: input.assetId,
      payload: { ...payload, workOrderId: row.id }
    });
  }
  if (input.systemId) {
    await emitFacilityEvent({
      supabase,
      organizationId,
      actorId: actorUserId,
      eventType: "work_order.created",
      aggregateType: "facility_systems",
      aggregateId: input.systemId,
      payload: { ...payload, workOrderId: row.id }
    });
  }
  await writeFacilityAudit({
    supabase,
    organizationId,
    actorId: actorUserId,
    action: "work_order.created",
    entityType: "maintenance_work_orders",
    entityId: row.id,
    payload
  });

  const notificationKey =
    priority === "emergency" ? "facility.work_order.emergency" : "facility.work_order.created";
  await notifyFacilityManagers(supabase, organizationId, {
    siteId: input.siteId,
    workOrderId: row.id,
    key: notificationKey,
    title: priority === "emergency" ? "Emergency facility work opened" : "Facility work opened",
    body: `${input.title} · ${site.name}`
  });

  return row;
}

export async function closeFacilityOperationsWorkOrder(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  workOrderId: string,
  note?: string
) {
  const closed = await closeFacilityWorkOrder(
    supabase,
    organizationId,
    actorUserId,
    workOrderId,
    note
  );

  await writeFacilityNotification({
    supabase,
    organizationId,
    userId: closed.requested_by_user_id,
    siteId: closed.site_id,
    notificationKey: "facility.work_order.closed",
    title: "Facility work closed",
    body: closed.title,
    href: `/facility/operations?workOrderId=${closed.id}`
  });

  return closed;
}

export async function searchFacilityWorkOrders(
  supabase: Db,
  organizationId: string,
  query: string
) {
  const q = query.trim();
  if (q.length < 2) {
    return [];
  }
  const { data, error } = await supabase
    .from("maintenance_work_orders")
    .select("id, title, status, priority, site_id")
    .eq("organization_id", organizationId)
    .eq("product_context", "facility")
    .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
    .order("submitted_at", { ascending: false })
    .limit(20);
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => ({
    id: row.id as string,
    label: `${row.title as string} · ${row.status as string}`,
    href: `/facility/operations?workOrderId=${row.id as string}`,
    group: "Facility Operations"
  }));
}

export async function listFacilityWorkOrderTimeline(
  supabase: Db,
  organizationId: string,
  workOrderId: string
) {
  const { data, error } = await supabase
    .from("event_domain_events")
    .select("id, event_type, payload, created_at, aggregate_type")
    .eq("organization_id", organizationId)
    .eq("aggregate_type", "maintenance_work_orders")
    .eq("aggregate_id", workOrderId)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export function buildFacilityOperationsAssistant(workOrders: readonly WorkOrderRow[]) {
  const open = workOrders.filter((wo) =>
    (OPEN_STATUSES as readonly string[]).includes(wo.status)
  );
  const emergency = open.filter((wo) => wo.priority === "emergency");
  if (emergency.length > 0) {
    return "Assign and resolve emergency facility work orders.";
  }
  if (open.length > 0) {
    return "Review the Facility Operations queue and hand off to Maintenance.";
  }
  return "Facility Operations is ready. Open corrective work when assets or systems need attention.";
}

export function summarizeFacilityWorkOrders(workOrders: readonly WorkOrderRow[]) {
  const open = workOrders.filter((wo) =>
    (OPEN_STATUSES as readonly string[]).includes(wo.status)
  );
  return {
    total: workOrders.length,
    openCount: open.length,
    emergencyCount: open.filter((wo) => wo.priority === "emergency").length,
    firstOpenId: open[0]?.id ?? null
  };
}
