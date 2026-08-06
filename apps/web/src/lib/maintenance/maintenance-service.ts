import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildMaintenanceReadyAssistantCopy,
  type AssignWorkOrderInput,
  type ConfirmWorkOrderInput,
  type CreateVendorDirectoryInput,
  type CreateWorkOrderInput,
  type ProgressWorkOrderInput,
  type TriageWorkOrderInput,
  type WorkOrderPriority,
  type WorkOrderStatus
} from "@mpa/shared";
import { emitMaintenanceEvent, writeMaintenanceAudit } from "./events-audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export type WorkOrderRow = {
  id: string;
  organization_id: string;
  property_id: string;
  unit_id: string | null;
  resident_id: string | null;
  requested_by_user_id: string | null;
  title: string;
  description: string;
  category: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  assignee_type: "unassigned" | "technician" | "vendor";
  technician_user_id: string | null;
  vendor_id: string | null;
  submitted_at: string;
  triaged_at: string | null;
  assigned_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  resident_confirmed_at: string | null;
  closed_at: string | null;
  created_at: string;
  property_properties?: { id: string; name: string } | null;
  property_units?: { id: string; unit_label: string } | null;
  pm_residents?: { id: string; display_name: string; email: string; user_id: string | null } | null;
  vendor_vendors?: { id: string; name: string; email: string | null; user_id: string | null } | null;
};

async function record(args: {
  supabase: Db;
  organizationId: string;
  actorId: string | null;
  workOrderId: string;
  eventType: string;
  payload?: Record<string, unknown>;
  alsoPropertyId?: string | null;
  alsoResidentId?: string | null;
}) {
  const payload = args.payload ?? {};
  await emitMaintenanceEvent({
    supabase: args.supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    eventType: args.eventType,
    aggregateType: "maintenance_work_orders",
    aggregateId: args.workOrderId,
    payload
  });
  if (args.alsoPropertyId) {
    await emitMaintenanceEvent({
      supabase: args.supabase,
      organizationId: args.organizationId,
      actorId: args.actorId,
      eventType: args.eventType,
      aggregateType: "property_properties",
      aggregateId: args.alsoPropertyId,
      payload: { ...payload, workOrderId: args.workOrderId }
    });
  }
  if (args.alsoResidentId) {
    await emitMaintenanceEvent({
      supabase: args.supabase,
      organizationId: args.organizationId,
      actorId: args.actorId,
      eventType: args.eventType,
      aggregateType: "pm_residents",
      aggregateId: args.alsoResidentId,
      payload: { ...payload, workOrderId: args.workOrderId }
    });
  }
  await writeMaintenanceAudit({
    supabase: args.supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    action: args.eventType,
    entityType: "maintenance_work_orders",
    entityId: args.workOrderId,
    payload
  });
}

async function addUpdate(
  supabase: Db,
  args: {
    organizationId: string;
    workOrderId: string;
    actorUserId: string | null;
    actorRole: "resident" | "manager" | "technician" | "vendor" | "system";
    body: string;
    statusFrom?: string | null;
    statusTo?: string | null;
  }
) {
  const { error } = await supabase.from("maintenance_work_order_updates").insert({
    organization_id: args.organizationId,
    work_order_id: args.workOrderId,
    actor_user_id: args.actorUserId,
    actor_role: args.actorRole,
    body: args.body,
    status_from: args.statusFrom ?? null,
    status_to: args.statusTo ?? null
  });
  if (error) {
    throw new Error(error.message);
  }
}

async function notify(
  supabase: Db,
  args: {
    organizationId: string;
    userId: string | null | undefined;
    workOrderId: string;
    key: string;
    title: string;
    body: string;
    href: string;
  }
) {
  if (!args.userId) {
    return;
  }
  await supabase.from("maintenance_notifications").insert({
    organization_id: args.organizationId,
    user_id: args.userId,
    work_order_id: args.workOrderId,
    notification_key: args.key,
    title: args.title,
    body: args.body,
    href: args.href
  });
}

const SELECT_WO = `
  *,
  property_properties ( id, name ),
  property_units ( id, unit_label ),
  pm_residents ( id, display_name, email, user_id ),
  vendor_vendors ( id, name, email, user_id )
`;

export async function getMaintenanceReadiness(supabase: Db, organizationId: string) {
  const { count, error } = await supabase
    .from("maintenance_work_orders")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "closed");
  if (error) {
    throw new Error(error.message);
  }
  const closedCount = count ?? 0;
  return {
    closedCount,
    maintenanceReady: closedCount > 0
  };
}

export async function listWorkOrders(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("maintenance_work_orders")
    .select(SELECT_WO)
    .eq("organization_id", organizationId)
    .order("submitted_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as WorkOrderRow[];
}

export async function getWorkOrder(supabase: Db, organizationId: string, workOrderId: string) {
  const { data, error } = await supabase
    .from("maintenance_work_orders")
    .select(SELECT_WO)
    .eq("organization_id", organizationId)
    .eq("id", workOrderId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return (data as WorkOrderRow | null) ?? null;
}

export async function listWorkOrderUpdates(supabase: Db, organizationId: string, workOrderId: string) {
  const { data, error } = await supabase
    .from("maintenance_work_order_updates")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("work_order_id", workOrderId)
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function listTechnicians(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("organization_memberships")
    .select("user_id, roles")
    .eq("organization_id", organizationId)
    .eq("status", "active");
  if (error) {
    throw new Error(error.message);
  }
  const techRows = (data ?? []).filter(
    (row) =>
      Array.isArray(row.roles) &&
      (row.roles.includes("maintenance_technician") ||
        row.roles.includes("property_manager") ||
        row.roles.includes("organization_admin"))
  );
  const techIds = techRows.map((row) => row.user_id as string);
  if (techIds.length === 0) {
    return [];
  }
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("user_id, display_name, contact_email")
    .in("user_id", techIds);
  const profileById = new Map(
    (profiles ?? []).map((row) => [
      row.user_id as string,
      row as { display_name?: string | null; contact_email?: string | null }
    ])
  );
  return techRows.map((row) => {
    const userId = row.user_id as string;
    const profile = profileById.get(userId);
    const isTech = Array.isArray(row.roles) && row.roles.includes("maintenance_technician");
    const baseName = profile?.display_name ?? profile?.contact_email ?? "Team member";
    return {
      userId,
      displayName: isTech ? baseName : `${baseName} (manager)`,
      email: profile?.contact_email ?? null
    };
  });
}

export async function listVendors(supabase: Db, organizationId: string) {
  const { data, error } = await supabase
    .from("vendor_vendors")
    .select("id, name, email, phone, status, user_id")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("name", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function createVendorDirectory(
  supabase: Db,
  organizationId: string,
  input: CreateVendorDirectoryInput
) {
  const { data, error } = await supabase
    .from("vendor_vendors")
    .insert({
      organization_id: organizationId,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      user_id: input.userId ?? null,
      status: "active"
    })
    .select("*")
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function createResidentWorkOrder(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: CreateWorkOrderInput
) {
  const { data: resident, error: residentError } = await supabase
    .from("pm_residents")
    .select("id, property_id, unit_id, display_name, portal_status, status")
    .eq("organization_id", organizationId)
    .eq("user_id", actorUserId)
    .eq("portal_status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (residentError) {
    throw new Error(residentError.message);
  }
  if (!resident) {
    throw new Error("Active resident portal profile required to submit maintenance.");
  }

  const { data: workOrder, error } = await supabase
    .from("maintenance_work_orders")
    .insert({
      organization_id: organizationId,
      property_id: resident.property_id,
      unit_id: resident.unit_id,
      resident_id: resident.id,
      requested_by_user_id: actorUserId,
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      status: "submitted",
      assignee_type: "unassigned"
    })
    .select(SELECT_WO)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  await addUpdate(supabase, {
    organizationId,
    workOrderId: workOrder.id,
    actorUserId,
    actorRole: "resident",
    body: `Request submitted: ${input.title}`,
    statusFrom: null,
    statusTo: "submitted"
  });
  await record({
    supabase,
    organizationId,
    actorId: actorUserId,
    workOrderId: workOrder.id,
    eventType: "work_order.created",
    alsoPropertyId: resident.property_id,
    alsoResidentId: resident.id,
    payload: {
      title: input.title,
      priority: input.priority,
      category: input.category,
      residentName: resident.display_name
    }
  });

  return workOrder as WorkOrderRow;
}

export async function triageWorkOrder(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: TriageWorkOrderInput
) {
  const existing = await getWorkOrder(supabase, organizationId, input.workOrderId);
  if (!existing) {
    throw new Error("Work order not found");
  }
  if (["closed", "cancelled"].includes(existing.status)) {
    throw new Error("Closed work orders cannot be triaged");
  }

  const nextStatus: WorkOrderStatus =
    existing.status === "submitted" ? "triaged" : (existing.status as WorkOrderStatus);

  const { data, error } = await supabase
    .from("maintenance_work_orders")
    .update({
      priority: input.priority,
      status: nextStatus,
      triaged_at: existing.triaged_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", input.workOrderId)
    .eq("organization_id", organizationId)
    .select(SELECT_WO)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  await addUpdate(supabase, {
    organizationId,
    workOrderId: input.workOrderId,
    actorUserId,
    actorRole: "manager",
    body: `Prioritized as ${input.priority}`,
    statusFrom: existing.status,
    statusTo: nextStatus
  });
  await record({
    supabase,
    organizationId,
    actorId: actorUserId,
    workOrderId: input.workOrderId,
    eventType: "work_order.triaged",
    alsoPropertyId: existing.property_id,
    alsoResidentId: existing.resident_id,
    payload: { priority: input.priority, status: nextStatus }
  });

  const residentUserId =
    (Array.isArray(existing.pm_residents)
      ? existing.pm_residents[0]?.user_id
      : existing.pm_residents?.user_id) ?? existing.requested_by_user_id;
  await notify(supabase, {
    organizationId,
    userId: residentUserId,
    workOrderId: input.workOrderId,
    key: "work_order.triaged",
    title: "Maintenance request reviewed",
    body: `Your request was prioritized as ${input.priority}.`,
    href: "/portal/tenant/maintenance"
  });

  return data as WorkOrderRow;
}

export async function assignWorkOrder(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: AssignWorkOrderInput
) {
  const existing = await getWorkOrder(supabase, organizationId, input.workOrderId);
  if (!existing) {
    throw new Error("Work order not found");
  }
  if (["closed", "cancelled", "completed"].includes(existing.status)) {
    throw new Error("Cannot assign a completed or closed work order");
  }

  let technicianUserId: string | null = null;
  let vendorId: string | null = null;
  if (input.assigneeType === "technician") {
    if (!input.technicianUserId) {
      throw new Error("technicianUserId is required");
    }
    technicianUserId = input.technicianUserId;
  } else {
    if (!input.vendorId) {
      throw new Error("vendorId is required");
    }
    vendorId = input.vendorId;
  }

  const { data, error } = await supabase
    .from("maintenance_work_orders")
    .update({
      assignee_type: input.assigneeType,
      technician_user_id: technicianUserId,
      vendor_id: vendorId,
      status: "assigned",
      assigned_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", input.workOrderId)
    .eq("organization_id", organizationId)
    .select(SELECT_WO)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  const eventType = input.assigneeType === "vendor" ? "vendor.assigned" : "work_order.assigned";
  const body =
    input.note?.trim() ||
    (input.assigneeType === "vendor" ? "Vendor assigned" : "Technician assigned");

  await addUpdate(supabase, {
    organizationId,
    workOrderId: input.workOrderId,
    actorUserId,
    actorRole: "manager",
    body,
    statusFrom: existing.status,
    statusTo: "assigned"
  });
  await record({
    supabase,
    organizationId,
    actorId: actorUserId,
    workOrderId: input.workOrderId,
    eventType,
    alsoPropertyId: existing.property_id,
    alsoResidentId: existing.resident_id,
    payload: {
      assigneeType: input.assigneeType,
      technicianUserId,
      vendorId
    }
  });

  if (technicianUserId) {
    await notify(supabase, {
      organizationId,
      userId: technicianUserId,
      workOrderId: input.workOrderId,
      key: "work_order.assigned",
      title: "Work order assigned",
      body: `You were assigned: ${existing.title}`,
      href: "/pm/maintenance"
    });
  }
  if (vendorId) {
    const { data: vendor } = await supabase
      .from("vendor_vendors")
      .select("user_id, name")
      .eq("id", vendorId)
      .maybeSingle();
    await notify(supabase, {
      organizationId,
      userId: vendor?.user_id,
      workOrderId: input.workOrderId,
      key: "vendor.assigned",
      title: "Vendor work assigned",
      body: `Assigned work order: ${existing.title}`,
      href: "/portal/vendor"
    });
  }

  const residentUserId =
    (Array.isArray(existing.pm_residents)
      ? existing.pm_residents[0]?.user_id
      : existing.pm_residents?.user_id) ?? existing.requested_by_user_id;
  await notify(supabase, {
    organizationId,
    userId: residentUserId,
    workOrderId: input.workOrderId,
    key: "work_order.assigned",
    title: "Maintenance update",
    body: "Someone has been assigned to your request.",
    href: "/portal/tenant/maintenance"
  });

  return data as WorkOrderRow;
}

export async function progressWorkOrder(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  actorRole: "manager" | "technician" | "vendor",
  input: ProgressWorkOrderInput
) {
  const existing = await getWorkOrder(supabase, organizationId, input.workOrderId);
  if (!existing) {
    throw new Error("Work order not found");
  }
  if (["closed", "cancelled"].includes(existing.status)) {
    throw new Error("Closed work orders cannot be updated");
  }

  if (actorRole === "technician" && existing.technician_user_id !== actorUserId) {
    throw new Error("This work order is not assigned to you");
  }
  if (actorRole === "vendor") {
    const vendorUserId = Array.isArray(existing.vendor_vendors)
      ? existing.vendor_vendors[0]?.user_id
      : existing.vendor_vendors?.user_id;
    if (vendorUserId !== actorUserId) {
      throw new Error("This work order is not assigned to your vendor account");
    }
  }

  let nextStatus: WorkOrderStatus = existing.status;
  let eventType = "work_order.progressed";
  const patch: {
    updated_at: string;
    status?: WorkOrderStatus;
    started_at?: string;
    completed_at?: string;
  } = {
    updated_at: new Date().toISOString()
  };

  if (input.action === "start") {
    nextStatus = "in_progress";
    eventType = "work_order.started";
    patch.status = nextStatus;
    patch.started_at = existing.started_at ?? new Date().toISOString();
  } else if (input.action === "complete") {
    nextStatus = "completed";
    eventType = "work_order.completed";
    patch.status = nextStatus;
    patch.completed_at = new Date().toISOString();
  } else if (existing.status === "assigned") {
    nextStatus = "in_progress";
    patch.status = nextStatus;
    patch.started_at = existing.started_at ?? new Date().toISOString();
    eventType = "work_order.started";
  }

  const { data, error } = await supabase
    .from("maintenance_work_orders")
    .update(patch)
    .eq("id", input.workOrderId)
    .eq("organization_id", organizationId)
    .select(SELECT_WO)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  await addUpdate(supabase, {
    organizationId,
    workOrderId: input.workOrderId,
    actorUserId,
    actorRole,
    body: input.note,
    statusFrom: existing.status,
    statusTo: nextStatus
  });
  await record({
    supabase,
    organizationId,
    actorId: actorUserId,
    workOrderId: input.workOrderId,
    eventType,
    alsoPropertyId: existing.property_id,
    alsoResidentId: existing.resident_id,
    payload: { note: input.note, status: nextStatus, action: input.action }
  });

  const residentUserId =
    (Array.isArray(existing.pm_residents)
      ? existing.pm_residents[0]?.user_id
      : existing.pm_residents?.user_id) ?? existing.requested_by_user_id;
  await notify(supabase, {
    organizationId,
    userId: residentUserId,
    workOrderId: input.workOrderId,
    key: eventType,
    title:
      input.action === "complete" ? "Work completed — please confirm" : "Maintenance progress update",
    body: input.note,
    href: "/portal/tenant/maintenance"
  });

  return data as WorkOrderRow;
}

export async function confirmWorkOrderResolution(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: ConfirmWorkOrderInput
) {
  const existing = await getWorkOrder(supabase, organizationId, input.workOrderId);
  if (!existing) {
    throw new Error("Work order not found");
  }
  if (existing.status !== "completed") {
    throw new Error("Only completed work orders can be confirmed");
  }

  const residentUserId =
    (Array.isArray(existing.pm_residents)
      ? existing.pm_residents[0]?.user_id
      : existing.pm_residents?.user_id) ?? existing.requested_by_user_id;
  if (residentUserId !== actorUserId) {
    throw new Error("Only the requesting resident can confirm resolution");
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("maintenance_work_orders")
    .update({
      status: "closed",
      resident_confirmed_at: now,
      closed_at: now,
      updated_at: now
    })
    .eq("id", input.workOrderId)
    .eq("organization_id", organizationId)
    .select(SELECT_WO)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  const note = input.note?.trim() || "Resident confirmed the issue is resolved.";
  await addUpdate(supabase, {
    organizationId,
    workOrderId: input.workOrderId,
    actorUserId,
    actorRole: "resident",
    body: note,
    statusFrom: "completed",
    statusTo: "closed"
  });
  await record({
    supabase,
    organizationId,
    actorId: actorUserId,
    workOrderId: input.workOrderId,
    eventType: "work_order.resident_confirmed",
    alsoPropertyId: existing.property_id,
    alsoResidentId: existing.resident_id,
    payload: { note }
  });
  await record({
    supabase,
    organizationId,
    actorId: actorUserId,
    workOrderId: input.workOrderId,
    eventType: "work_order.closed",
    alsoPropertyId: existing.property_id,
    alsoResidentId: existing.resident_id,
    payload: { note }
  });

  return data as WorkOrderRow;
}

export async function listResidentWorkOrders(supabase: Db, organizationId: string, userId: string) {
  const { data: residents } = await supabase
    .from("pm_residents")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId);
  const residentIds = (residents ?? []).map((row) => row.id as string);

  let query = supabase
    .from("maintenance_work_orders")
    .select(SELECT_WO)
    .eq("organization_id", organizationId)
    .order("submitted_at", { ascending: false });

  if (residentIds.length > 0) {
    query = query.or(`requested_by_user_id.eq.${userId},resident_id.in.(${residentIds.join(",")})`);
  } else {
    query = query.eq("requested_by_user_id", userId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as WorkOrderRow[];
}

export async function listVendorPortalWorkOrders(supabase: Db, userId: string) {
  const { data: vendors, error: vendorError } = await supabase
    .from("vendor_vendors")
    .select("id, organization_id, name")
    .eq("user_id", userId)
    .eq("status", "active");
  if (vendorError) {
    throw new Error(vendorError.message);
  }
  if (!vendors?.length) {
    return { vendors: [], workOrders: [] as WorkOrderRow[] };
  }

  const vendorIds = vendors.map((row) => row.id as string);
  const { data, error } = await supabase
    .from("maintenance_work_orders")
    .select(SELECT_WO)
    .in("vendor_id", vendorIds)
    .order("submitted_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return { vendors, workOrders: (data ?? []) as WorkOrderRow[] };
}

export async function getPropertyMaintenanceSummary(
  supabase: Db,
  organizationId: string,
  propertyId: string
) {
  const { data, error } = await supabase
    .from("maintenance_work_orders")
    .select(
      "id, title, status, priority, assignee_type, technician_user_id, vendor_id, completed_at, closed_at, submitted_at, vendor_vendors(name)"
    )
    .eq("organization_id", organizationId)
    .eq("property_id", propertyId)
    .order("submitted_at", { ascending: false })
    .limit(40);
  if (error) {
    throw new Error(error.message);
  }
  const rows = data ?? [];
  const open = rows.filter((row) => !["closed", "cancelled"].includes(String(row.status)));
  const emergency = open.filter((row) => row.priority === "emergency");
  const recentlyCompleted = rows.filter((row) =>
    ["completed", "closed"].includes(String(row.status))
  );

  return {
    openWorkOrders: open,
    emergencyRequests: emergency,
    assignedTechnicians: open.filter((row) => row.assignee_type === "technician"),
    assignedVendors: open.filter((row) => row.assignee_type === "vendor"),
    recentlyCompleted: recentlyCompleted.slice(0, 8),
    history: rows.slice(0, 20)
  };
}

export function maintenanceReadyCopy() {
  return buildMaintenanceReadyAssistantCopy();
}
