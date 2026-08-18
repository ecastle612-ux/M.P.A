import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildMaintenanceReadyAssistantCopy,
  type AssignWorkOrderInput,
  type CancelWorkOrderInput,
  type ConfirmWorkOrderInput,
  type CreateFacilityWorkOrderInput,
  type CreateVendorDirectoryInput,
  type CreateWorkOrderInput,
  type FacilityRequestIntakeChannel,
  type ProgressWorkOrderInput,
  type TriageWorkOrderInput,
  type WorkOrderPriority,
  type WorkOrderStatus,
  type WorkSurface
} from "@mpa/shared";
import { provisionVendorPortalAccess } from "../portal/portal-access-service";
import { emitMaintenanceEvent, writeMaintenanceAudit } from "./events-audit";
import { notifyLifecycle } from "./lifecycle-notify";

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
  work_surface: WorkSurface;
  facility_asset_label: string | null;
  facility_asset_id: string | null;
  due_at: string | null;
  cancelled_at: string | null;
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
  intake_channel?: FacilityRequestIntakeChannel | null;
  request_number?: string | null;
  floor_label?: string | null;
  department_label?: string | null;
  room_label?: string | null;
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
    emailCritical?: boolean;
  }
) {
  // STAB-007 — in-app always when user present; email for critical lifecycle events.
  await notifyLifecycle(supabase as never, args);
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
    .eq("work_surface", "residential")
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

export async function listWorkOrders(
  supabase: Db,
  organizationId: string,
  options?: { surface?: WorkSurface | "all" }
) {
  let query = supabase
    .from("maintenance_work_orders")
    .select(SELECT_WO)
    .eq("organization_id", organizationId)
    .order("submitted_at", { ascending: false });

  const surface = options?.surface ?? "all";
  if (surface === "residential" || surface === "facility") {
    query = query.eq("work_surface", surface);
  }

  const { data, error } = await query;
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
  const { listOccupanciesForUser, resolveTenantPortalMode } = await import(
    "../tenant-lifecycle/tenant-lifecycle-service"
  );
  const occupancies = await listOccupanciesForUser(supabase, organizationId, actorUserId);
  const resolved = resolveTenantPortalMode(occupancies);
  if (resolved.mode !== "active" || !resolved.current?.pm_resident_id) {
    throw new Error("Active occupancy is required to submit maintenance.");
  }

  const { data: resident, error: residentError } = await supabase
    .from("pm_residents")
    .select("id, property_id, unit_id, display_name, portal_status, status")
    .eq("organization_id", organizationId)
    .eq("id", resolved.current.pm_resident_id)
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
      assignee_type: "unassigned",
      work_surface: "residential"
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
  const emergency = input.priority === "emergency";
  await notify(supabase, {
    organizationId,
    userId: residentUserId,
    workOrderId: input.workOrderId,
    key: emergency ? "work_order.emergency" : "work_order.triaged",
    title: emergency ? "Emergency maintenance prioritized" : "Maintenance request reviewed",
    body: emergency
      ? `Your request was marked emergency (${input.priority}).`
      : `Your request was prioritized as ${input.priority}.`,
    href: "/portal/tenant/maintenance",
    emailCritical: emergency
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

  const assigneeHref =
    existing.work_surface === "facility" ? "/facility/operations" : "/pm/maintenance";

  if (technicianUserId) {
    await notify(supabase, {
      organizationId,
      userId: technicianUserId,
      workOrderId: input.workOrderId,
      key: "work_order.assigned",
      title: "Work order assigned",
      body: `You were assigned: ${existing.title}`,
      href: assigneeHref,
      emailCritical: true
    });
  }
  let vendorPortalHandoff: Awaited<
    ReturnType<typeof provisionVendorPortalAccess>
  >["handoff"] | null = null;

  if (vendorId) {
    const { data: vendor } = await supabase
      .from("vendor_vendors")
      .select("user_id, name, email")
      .eq("id", vendorId)
      .maybeSingle();

    let vendorUserId = (vendor?.user_id as string | null | undefined) ?? null;
    const vendorEmail = (vendor?.email as string | null | undefined) ?? null;
    if (!vendorEmail) {
      throw new Error(
        "Vendor email is required to provision vendor portal access on assignment. Add a vendor email, then assign again."
      );
    }
    const portalAccess = await provisionVendorPortalAccess({
      supabase,
      organizationId,
      actorId: actorUserId,
      vendorId,
      email: vendorEmail,
      existingUserId: vendorUserId
    });
    vendorUserId = portalAccess.userId;
    vendorPortalHandoff = portalAccess.handoff;

    await notify(supabase, {
      organizationId,
      userId: vendorUserId,
      workOrderId: input.workOrderId,
      key: "vendor.assigned",
      title: "Vendor work assigned",
      body: `Assigned work order: ${existing.title}`,
      href: "/portal/vendor",
      emailCritical: true
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
    href: "/portal/tenant/maintenance",
    emailCritical: existing.priority === "emergency"
  });

  return {
    workOrder: data as WorkOrderRow,
    vendorPortalHandoff
  };
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
    closed_at?: string;
  } = {
    updated_at: new Date().toISOString()
  };

  if (input.action === "start") {
    nextStatus = "in_progress";
    eventType = "work_order.started";
    patch.status = nextStatus;
    patch.started_at = existing.started_at ?? new Date().toISOString();
  } else if (input.action === "complete") {
    // Facility work has no resident confirmation step — complete closes the WO.
    if (existing.work_surface === "facility") {
      nextStatus = "closed";
      eventType = "work_order.closed";
      patch.status = nextStatus;
      patch.completed_at = new Date().toISOString();
      patch.closed_at = new Date().toISOString();
    } else {
      nextStatus = "completed";
      eventType = "work_order.completed";
      patch.status = nextStatus;
      patch.completed_at = new Date().toISOString();
    }
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

  const isTerminalProgress =
    input.action === "start" || input.action === "complete" || eventType === "work_order.started";
  const criticalProgress =
    isTerminalProgress ||
    existing.priority === "emergency" ||
    eventType === "work_order.completed" ||
    eventType === "work_order.closed";

  if (existing.work_surface !== "facility") {
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
      href: "/portal/tenant/maintenance",
      emailCritical: criticalProgress
    });
  } else if (criticalProgress) {
    // Facility: notify assignee + requester (no resident portal).
    const facilityHref = "/facility/operations";
    await notify(supabase, {
      organizationId,
      userId: existing.technician_user_id,
      workOrderId: input.workOrderId,
      key: eventType,
      title:
        input.action === "complete"
          ? "Facility work completed"
          : input.action === "start"
            ? "Facility work started"
            : "Facility work update",
      body: input.note,
      href: facilityHref,
      emailCritical: true
    });
    if (existing.requested_by_user_id && existing.requested_by_user_id !== existing.technician_user_id) {
      await notify(supabase, {
        organizationId,
        userId: existing.requested_by_user_id,
        workOrderId: input.workOrderId,
        key: eventType,
        title:
          input.action === "complete"
            ? "Facility work completed"
            : input.action === "start"
              ? "Facility work started"
              : "Facility work update",
        body: input.note,
        href: facilityHref,
        emailCritical: true
      });
    }
  }

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

export async function createFacilityWorkOrder(
  supabase: Db,
  organizationId: string,
  actorUserId: string | null,
  input: CreateFacilityWorkOrderInput,
  options?: {
    requestedByUserId?: string | null;
    intakeChannel?: FacilityRequestIntakeChannel;
    requestNumber?: string | null;
    floorLabel?: string | null;
    departmentLabel?: string | null;
    roomLabel?: string | null;
  }
) {
  const { data: property, error: propertyError } = await supabase
    .from("property_properties")
    .select("id, name")
    .eq("organization_id", organizationId)
    .eq("id", input.propertyId)
    .maybeSingle();
  if (propertyError) {
    throw new Error(propertyError.message);
  }
  if (!property) {
    throw new Error("Property not found for organization");
  }

  let facilityAssetLabel = input.facilityAssetLabel?.trim() || null;
  const facilityAssetId: string | null = input.facilityAssetId ?? null;
  if (facilityAssetId) {
    const { data: asset, error: assetError } = await supabase
      .from("facility_assets")
      .select("id, name, organization_id")
      .eq("id", facilityAssetId)
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .maybeSingle();
    if (assetError) {
      throw new Error(assetError.message);
    }
    if (!asset) {
      throw new Error("Facility asset not found for organization");
    }
    if (!facilityAssetLabel) {
      facilityAssetLabel = asset.name;
    }
  }

  if (input.unitId) {
    const { data: unit, error: unitError } = await supabase
      .from("property_units")
      .select("id")
      .eq("id", input.unitId)
      .eq("property_id", input.propertyId)
      .maybeSingle();
    if (unitError) {
      throw new Error(unitError.message);
    }
    if (!unit) {
      throw new Error("Unit not found for property");
    }
  }

  const { data: workOrder, error } = await supabase
    .from("maintenance_work_orders")
    .insert({
      organization_id: organizationId,
      property_id: input.propertyId,
      unit_id: input.unitId ?? null,
      resident_id: null,
      requested_by_user_id: options?.requestedByUserId ?? actorUserId,
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      status: "submitted",
      assignee_type: "unassigned",
      work_surface: "facility",
      facility_asset_label: facilityAssetLabel,
      facility_asset_id: facilityAssetId,
      due_at: input.dueAt ?? null,
      intake_channel: options?.intakeChannel ?? "internal",
      request_number: options?.requestNumber ?? null,
      floor_label: options?.floorLabel ?? null,
      department_label: options?.departmentLabel ?? null,
      room_label: options?.roomLabel ?? null
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
    actorRole: actorUserId ? "manager" : "system",
    body: options?.requestNumber
      ? `Facility request ${options.requestNumber}: ${input.title}`
      : `Facility work created: ${input.title}`,
    statusFrom: null,
    statusTo: "submitted"
  });
  await record({
    supabase,
    organizationId,
    actorId: actorUserId,
    workOrderId: workOrder.id,
    eventType: "work_order.created",
    alsoPropertyId: input.propertyId,
    payload: {
      title: input.title,
      priority: input.priority,
      category: input.category,
      workSurface: "facility",
      facilityAssetLabel: input.facilityAssetLabel ?? null,
      dueAt: input.dueAt ?? null
    }
  });

  return workOrder as WorkOrderRow;
}

export async function cancelWorkOrder(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: CancelWorkOrderInput
) {
  const existing = await getWorkOrder(supabase, organizationId, input.workOrderId);
  if (!existing) {
    throw new Error("Work order not found");
  }
  if (["closed", "cancelled", "completed"].includes(existing.status)) {
    throw new Error("Cannot cancel a completed, closed, or already cancelled work order");
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("maintenance_work_orders")
    .update({
      status: "cancelled",
      cancelled_at: now,
      updated_at: now
    })
    .eq("id", input.workOrderId)
    .eq("organization_id", organizationId)
    .select(SELECT_WO)
    .single();
  if (error) {
    throw new Error(error.message);
  }

  const note = input.note?.trim() || "Work order cancelled.";
  await addUpdate(supabase, {
    organizationId,
    workOrderId: input.workOrderId,
    actorUserId,
    actorRole: "manager",
    body: note,
    statusFrom: existing.status,
    statusTo: "cancelled"
  });
  await record({
    supabase,
    organizationId,
    actorId: actorUserId,
    workOrderId: input.workOrderId,
    eventType: "work_order.cancelled",
    alsoPropertyId: existing.property_id,
    alsoResidentId: existing.resident_id,
    payload: { note, previousStatus: existing.status }
  });

  const cancelHref =
    existing.work_surface === "facility" ? "/facility/operations" : "/pm/maintenance";
  const residentUserId =
    (Array.isArray(existing.pm_residents)
      ? existing.pm_residents[0]?.user_id
      : existing.pm_residents?.user_id) ?? existing.requested_by_user_id;

  await notify(supabase, {
    organizationId,
    userId: existing.technician_user_id,
    workOrderId: input.workOrderId,
    key: "work_order.cancelled",
    title: "Work order cancelled",
    body: note,
    href: cancelHref,
    emailCritical: true
  });

  if (existing.assignee_type === "vendor") {
    const vendorUserId = Array.isArray(existing.vendor_vendors)
      ? existing.vendor_vendors[0]?.user_id
      : existing.vendor_vendors?.user_id;
    await notify(supabase, {
      organizationId,
      userId: vendorUserId,
      workOrderId: input.workOrderId,
      key: "work_order.cancelled",
      title: "Work order cancelled",
      body: note,
      href: "/portal/vendor",
      emailCritical: true
    });
  }

  if (existing.work_surface !== "facility") {
    await notify(supabase, {
      organizationId,
      userId: residentUserId,
      workOrderId: input.workOrderId,
      key: "work_order.cancelled",
      title: "Maintenance request cancelled",
      body: note,
      href: "/portal/tenant/maintenance",
      emailCritical: true
    });
  } else if (residentUserId && residentUserId !== existing.technician_user_id) {
    await notify(supabase, {
      organizationId,
      userId: residentUserId,
      workOrderId: input.workOrderId,
      key: "work_order.cancelled",
      title: "Facility work cancelled",
      body: note,
      href: cancelHref,
      emailCritical: true
    });
  }

  return data as WorkOrderRow;
}

export type FacilityMissionControlSnapshot = {
  todayOpen: number;
  emergency: number;
  open: number;
  overdue: number;
  waitingOnVendor: number;
  waitingOnTechnician: number;
  completedRecently: number;
};

export type FacilitySnapshotRow = {
  status: string;
  priority?: string | null;
  assignee_type?: string | null;
  due_at?: string | null;
  submitted_at?: string | null;
  completed_at?: string | null;
  closed_at?: string | null;
};

function isOpenFacilityStatus(status: string) {
  return !["closed", "cancelled", "completed"].includes(status);
}

/** Pure attention buckets for Facility Mission Control (unit-testable). */
export function buildFacilityMissionControlSnapshot(
  rows: FacilitySnapshotRow[],
  nowInput: Date = new Date()
): FacilityMissionControlSnapshot {
  const now = nowInput;
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const openRows = rows.filter((row) => isOpenFacilityStatus(String(row.status)));
  const todayOpen = openRows.filter((row) => {
    const submitted = row.submitted_at ? new Date(String(row.submitted_at)) : null;
    const due = row.due_at ? new Date(String(row.due_at)) : null;
    const submittedToday = submitted !== null && submitted >= startOfToday;
    const dueToday =
      due !== null && due >= startOfToday && due < new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    return submittedToday || dueToday;
  }).length;

  return {
    todayOpen,
    emergency: openRows.filter((row) => row.priority === "emergency").length,
    open: openRows.length,
    overdue: openRows.filter((row) => row.due_at && new Date(String(row.due_at)) < now).length,
    waitingOnVendor: openRows.filter(
      (row) => row.status === "assigned" && row.assignee_type === "vendor"
    ).length,
    waitingOnTechnician: openRows.filter(
      (row) => row.status === "assigned" && row.assignee_type === "technician"
    ).length,
    completedRecently: rows.filter((row) => {
      if (!["completed", "closed"].includes(String(row.status))) {
        return false;
      }
      const stamp = row.completed_at ?? row.closed_at;
      return stamp ? new Date(String(stamp)) >= sevenDaysAgo : false;
    }).length
  };
}

export async function getFacilityMissionControlSnapshot(
  supabase: Db,
  organizationId: string
): Promise<FacilityMissionControlSnapshot> {
  const { data, error } = await supabase
    .from("maintenance_work_orders")
    .select(
      "id, status, priority, assignee_type, due_at, submitted_at, completed_at, closed_at, cancelled_at"
    )
    .eq("organization_id", organizationId)
    .eq("work_surface", "facility");
  if (error) {
    throw new Error(error.message);
  }

  return buildFacilityMissionControlSnapshot((data ?? []) as FacilitySnapshotRow[]);
}

export function maintenanceReadyCopy() {
  return buildMaintenanceReadyAssistantCopy();
}
