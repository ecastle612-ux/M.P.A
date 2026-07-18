import { createAuthServerComponentClient } from "../auth/server";
import { notify } from "../notifications/service";
import type { NotificationPriority } from "../notifications/contracts";
import type { Database, Json } from "@mpa/supabase";
import type {
  CreateWorkOrderInput,
  MaintenanceActivityEvent,
  MaintenancePriority,
  MaintenanceStatus,
  UpdateWorkOrderInput,
  WorkOrderRecord
} from "./contracts";
import { toMaintenanceStatusLabel } from "./contracts";

type WorkOrderRow = {
  id: string;
  organization_id: string;
  property_id: string;
  unit_id: string | null;
  tenant_id: string | null;
  work_order_number: string;
  title: string;
  description: string | null;
  category: WorkOrderRecord["category"];
  priority: WorkOrderRecord["priority"];
  status: WorkOrderRecord["status"];
  due_date: string | null;
  assigned_to_user_id: string | null;
  vendor_id: string | null;
  current_vendor_assignment_id: string | null;
  internal_notes: string | null;
  tenant_notes: string | null;
  photo_placeholder: string | null;
  document_placeholder: string | null;
  recurring_maintenance_placeholder: string | null;
  preventive_maintenance_placeholder: string | null;
  completed_at: string | null;
  metadata: Json | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  deleted_at: string | null;
};

type WorkOrderRelationRow = WorkOrderRow & {
  properties: { name: string } | null;
  units: { unit_number: string } | null;
  tenants: {
    first_name: string;
    last_name: string;
    preferred_name: string | null;
  } | null;
};

export type WorkOrderListItem = WorkOrderRecord & {
  propertyName: string | null;
  unitNumber: string | null;
  tenantName: string | null;
};

export type MaintenanceDashboardMetrics = {
  openWorkOrders: number;
  highPriorityWorkOrders: number;
  overdueWorkOrders: number;
  recentlyCompleted: number;
  recentActivity: MaintenanceActivityEvent[];
  openWorkOrderSample: WorkOrderListItem[];
  highPrioritySample: WorkOrderListItem[];
  overdueSample: WorkOrderListItem[];
  completedSample: WorkOrderListItem[];
};

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;
type WorkOrderUpdate = Database["public"]["Tables"]["maintenance_work_orders"]["Update"];

const WORK_ORDER_SELECT =
  "id, organization_id, property_id, unit_id, tenant_id, work_order_number, title, description, category, priority, status, due_date, assigned_to_user_id, vendor_id, current_vendor_assignment_id, internal_notes, tenant_notes, photo_placeholder, document_placeholder, recurring_maintenance_placeholder, preventive_maintenance_placeholder, completed_at, metadata, created_by, updated_by, created_at, updated_at, archived_at, deleted_at, properties(name), units(unit_number), tenants(first_name, last_name, preferred_name)";

const OPEN_STATUSES: MaintenanceStatus[] = ["submitted", "triaged", "assigned", "in_progress", "on_hold"];

type WorkOrderListOptions = {
  search?: string;
  status?: MaintenanceStatus | "open" | "all";
  priority?: WorkOrderRecord["priority"];
  propertyId?: string;
  unitId?: string;
  tenantId?: string;
  sortBy?: "updated_at" | "due_date" | "priority" | "created_at";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

export async function getWorkOrdersForOrganization(
  organizationId: string,
  options: WorkOrderListOptions = {},
  client?: SupabaseClientType
): Promise<WorkOrderListItem[]> {
  const supabase = await resolveClient(client);
  let query = supabase
    .from("maintenance_work_orders")
    .select(WORK_ORDER_SELECT)
    .eq("organization_id", organizationId)
    .is("deleted_at", null);

  if (options.status === "open") {
    query = query.in("status", OPEN_STATUSES);
  } else if (options.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  if (options.priority) {
    query = query.eq("priority", options.priority);
  }
  if (options.propertyId) {
    query = query.eq("property_id", options.propertyId);
  }
  if (options.unitId) {
    query = query.eq("unit_id", options.unitId);
  }
  if (options.tenantId) {
    query = query.eq("tenant_id", options.tenantId);
  }

  const trimmedSearch = options.search?.trim();
  if (trimmedSearch) {
    const escaped = escapeLike(trimmedSearch);
    query = query.or(`title.ilike.%${escaped}%,work_order_number.ilike.%${escaped}%,description.ilike.%${escaped}%`);
  }

  const sortBy = options.sortBy ?? "updated_at";
  const ascending = (options.sortOrder ?? "desc") === "asc";
  query = query.order(sortBy, { ascending });

  if (options.limit !== undefined) {
    const from = options.offset ?? 0;
    query = query.range(from, from + options.limit - 1);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as WorkOrderRelationRow[]).map(toWorkOrderListItem);
}

export async function getWorkOrderForOrganization(
  organizationId: string,
  workOrderId: string,
  client?: SupabaseClientType
): Promise<WorkOrderListItem | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("maintenance_work_orders")
    .select(WORK_ORDER_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", workOrderId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toWorkOrderListItem(data as WorkOrderRelationRow) : null;
}

export async function getActivityForWorkOrder(
  organizationId: string,
  workOrderId: string,
  client?: SupabaseClientType
): Promise<MaintenanceActivityEvent[]> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("maintenance_activity_events")
    .select("id, organization_id, work_order_id, event_type, summary, details, actor_user_id, created_at")
    .eq("organization_id", organizationId)
    .eq("work_order_id", workOrderId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Array<{
    id: string;
    organization_id: string;
    work_order_id: string;
    event_type: string;
    summary: string;
    details: Json | null;
    actor_user_id: string | null;
    created_at: string;
  }>).map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    workOrderId: row.work_order_id,
    eventType: row.event_type,
    summary: row.summary,
    details: (row.details ?? {}) as Record<string, unknown>,
    actorUserId: row.actor_user_id,
    createdAt: row.created_at
  }));
}

export async function createWorkOrder(
  organizationId: string,
  userId: string,
  input: CreateWorkOrderInput,
  client?: SupabaseClientType
): Promise<WorkOrderListItem> {
  const supabase = await resolveClient(client);
  await assertWorkOrderAssignment({
    organizationId,
    propertyId: input.propertyId,
    unitId: input.unitId,
    tenantId: input.tenantId,
    client: supabase
  });

  const workOrderNumber = await generateWorkOrderNumber(organizationId, supabase);
  const status = input.assignedToUserId && input.status === "submitted" ? "assigned" : input.status;
  const completedAt = status === "completed" ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from("maintenance_work_orders")
    .insert({
      organization_id: organizationId,
      property_id: input.propertyId,
      unit_id: input.unitId,
      tenant_id: input.tenantId,
      work_order_number: workOrderNumber,
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      status,
      due_date: input.dueDate,
      assigned_to_user_id: input.assignedToUserId,
      internal_notes: input.internalNotes,
      tenant_notes: input.tenantNotes,
      photo_placeholder: input.photoPlaceholder,
      document_placeholder: input.documentPlaceholder,
      recurring_maintenance_placeholder: input.recurringMaintenancePlaceholder,
      preventive_maintenance_placeholder: input.preventiveMaintenancePlaceholder,
      completed_at: completedAt,
      metadata: input.metadata as Json,
      created_by: userId,
      updated_by: userId
    })
    .select(WORK_ORDER_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Work order creation failed");
  }

  const workOrder = toWorkOrderListItem(data as WorkOrderRelationRow);
  await recordActivityEvent({
    organizationId,
    workOrderId: workOrder.id,
    eventType: "created",
    summary: `Work order ${workOrder.workOrderNumber} created`,
    details: { status: workOrder.status, priority: workOrder.priority },
    actorUserId: userId,
    client: supabase
  });

  if (input.assignedToUserId) {
    await recordActivityEvent({
      organizationId,
      workOrderId: workOrder.id,
      eventType: "assigned",
      summary: "Assigned to internal staff",
      details: { assignedToUserId: input.assignedToUserId },
      actorUserId: userId,
      client: supabase
    });
  }

  try {
    const { ensureMaintenanceThread } = await import("../messaging/server");
    await ensureMaintenanceThread(
      organizationId,
      userId,
      {
        id: workOrder.id,
        workOrderNumber: workOrder.workOrderNumber,
        title: workOrder.title,
        propertyId: workOrder.propertyId,
        unitId: workOrder.unitId,
        tenantId: workOrder.tenantId
      },
      supabase
    );
  } catch {
    // Thread creation is best-effort; work order creation must still succeed.
  }

  const managerIds = await listPropertyManagerUserIds(organizationId, supabase);
  const recipientUserIds = [
    ...new Set(
      [...managerIds, workOrder.assignedToUserId].filter((id): id is string => Boolean(id) && id !== userId)
    )
  ];
  if (recipientUserIds.length > 0) {
    await notify(
      {
        organizationId,
        actorUserId: userId,
        eventKey: `maintenance.created:${workOrder.id}`,
        recipientUserIds,
        category: "maintenance",
        priority: mapMaintenancePriority(workOrder.priority),
        title: "New maintenance request",
        body: `${workOrder.workOrderNumber}: ${workOrder.title}`,
        href: `/maintenance/${workOrder.id}`,
        sourceEntityType: "maintenance_work_order",
        sourceEntityId: workOrder.id,
        propertyId: workOrder.propertyId,
        unitId: workOrder.unitId
      },
      supabase
    ).catch(() => undefined);
  }

  return workOrder;
}

export async function updateWorkOrder(
  organizationId: string,
  workOrderId: string,
  userId: string,
  updates: UpdateWorkOrderInput,
  client?: SupabaseClientType
): Promise<WorkOrderListItem | null> {
  const supabase = await resolveClient(client);
  const { data: existing, error: existingError } = await supabase
    .from("maintenance_work_orders")
    .select(
      "id, property_id, unit_id, tenant_id, status, assigned_to_user_id, priority, due_date, internal_notes, tenant_notes"
    )
    .eq("organization_id", organizationId)
    .eq("id", workOrderId)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }
  if (!existing) {
    return null;
  }

  const nextPropertyId = updates.propertyId ?? existing.property_id;
  const nextUnitId = updates.unitId !== undefined ? updates.unitId : existing.unit_id;
  const nextTenantId = updates.tenantId !== undefined ? updates.tenantId : existing.tenant_id;

  await assertWorkOrderAssignment({
    organizationId,
    propertyId: nextPropertyId,
    unitId: nextUnitId,
    tenantId: nextTenantId,
    client: supabase
  });

  const patch: WorkOrderUpdate = { updated_by: userId };
  if (updates.propertyId !== undefined) patch.property_id = updates.propertyId;
  if (updates.unitId !== undefined) patch.unit_id = updates.unitId;
  if (updates.tenantId !== undefined) patch.tenant_id = updates.tenantId;
  if (updates.title !== undefined) patch.title = updates.title;
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.category !== undefined) patch.category = updates.category;
  if (updates.priority !== undefined) patch.priority = updates.priority;
  if (updates.dueDate !== undefined) patch.due_date = updates.dueDate;
  if (updates.assignedToUserId !== undefined) patch.assigned_to_user_id = updates.assignedToUserId;
  if (updates.internalNotes !== undefined) patch.internal_notes = updates.internalNotes;
  if (updates.tenantNotes !== undefined) patch.tenant_notes = updates.tenantNotes;
  if (updates.photoPlaceholder !== undefined) patch.photo_placeholder = updates.photoPlaceholder;
  if (updates.documentPlaceholder !== undefined) patch.document_placeholder = updates.documentPlaceholder;
  if (updates.recurringMaintenancePlaceholder !== undefined) {
    patch.recurring_maintenance_placeholder = updates.recurringMaintenancePlaceholder;
  }
  if (updates.preventiveMaintenancePlaceholder !== undefined) {
    patch.preventive_maintenance_placeholder = updates.preventiveMaintenancePlaceholder;
  }
  if (updates.metadata !== undefined) patch.metadata = updates.metadata as Json;

  const nextStatus = updates.status;
  if (nextStatus !== undefined) {
    patch.status = nextStatus;
    if (nextStatus === "completed") {
      patch.completed_at = new Date().toISOString();
    } else if (existing.status === "completed") {
      patch.completed_at = null;
    }
  }

  if (updates.assignedToUserId !== undefined && updates.assignedToUserId && !nextStatus) {
    if (existing.status === "submitted" || existing.status === "triaged") {
      patch.status = "assigned";
    }
  }

  const { data, error } = await supabase
    .from("maintenance_work_orders")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", workOrderId)
    .is("deleted_at", null)
    .select(WORK_ORDER_SELECT)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }

  const workOrder = toWorkOrderListItem(data as WorkOrderRelationRow);
  await recordWorkOrderUpdateEvents({
    organizationId,
    workOrderId,
    userId,
    existing,
    updates,
    nextStatus: workOrder.status,
    client: supabase
  });

  if (updates.status && updates.status !== existing.status) {
    const tenantUserIds = await resolveTenantRecipientUserIds(
      organizationId,
      workOrder.tenantId,
      supabase
    );
    const managerIds = await listPropertyManagerUserIds(organizationId, supabase);
    const recipientUserIds = [
      ...new Set(
        [
          workOrder.createdBy,
          workOrder.assignedToUserId,
          ...tenantUserIds,
          ...managerIds
        ].filter((id): id is string => Boolean(id) && id !== userId)
      )
    ];
    if (recipientUserIds.length > 0) {
      const residentIds = new Set(tenantUserIds);
      const statusCopy = statusNotificationCopy(updates.status);
      if (statusCopy) {
        await Promise.all(
          recipientUserIds.map((recipientUserId) =>
            notify(
              {
                organizationId,
                actorUserId: userId,
                eventKey: `maintenance.status:${updates.status}:${workOrder.id}:${recipientUserId}`,
                recipientUserIds: [recipientUserId],
                category: "maintenance",
                priority: mapMaintenancePriority(workOrder.priority),
                title: statusCopy.title,
                body: `${workOrder.workOrderNumber}: ${workOrder.title}`,
                href: residentIds.has(recipientUserId)
                  ? `/portal/tenant/maintenance/${workOrder.id}`
                  : `/maintenance/${workOrder.id}`,
                sourceEntityType: "maintenance_work_order",
                sourceEntityId: workOrder.id,
                propertyId: workOrder.propertyId,
                unitId: workOrder.unitId
              },
              supabase
            ).catch(() => undefined)
          )
        );
      }
    }
  }

  return workOrder;
}

export async function archiveWorkOrder(
  organizationId: string,
  workOrderId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<WorkOrderListItem | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("maintenance_work_orders")
    .update({
      archived_at: new Date().toISOString(),
      archived_by: userId,
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", workOrderId)
    .is("deleted_at", null)
    .select(WORK_ORDER_SELECT)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }

  await recordActivityEvent({
    organizationId,
    workOrderId,
    eventType: "archived",
    summary: "Work order archived",
    details: {},
    actorUserId: userId,
    client: supabase
  });

  return toWorkOrderListItem(data as WorkOrderRelationRow);
}

export async function restoreWorkOrder(
  organizationId: string,
  workOrderId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<WorkOrderListItem | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("maintenance_work_orders")
    .update({
      archived_at: null,
      archived_by: null,
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", workOrderId)
    .is("deleted_at", null)
    .select(WORK_ORDER_SELECT)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }

  await recordActivityEvent({
    organizationId,
    workOrderId,
    eventType: "restored",
    summary: "Work order restored",
    details: {},
    actorUserId: userId,
    client: supabase
  });

  return toWorkOrderListItem(data as WorkOrderRelationRow);
}

export async function softDeleteWorkOrder(
  organizationId: string,
  workOrderId: string,
  userId: string,
  client?: SupabaseClientType
): Promise<WorkOrderListItem | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("maintenance_work_orders")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
      updated_by: userId
    })
    .eq("organization_id", organizationId)
    .eq("id", workOrderId)
    .is("deleted_at", null)
    .select(WORK_ORDER_SELECT)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toWorkOrderListItem(data as WorkOrderRelationRow) : null;
}

export async function getAssigneesForOrganization(
  organizationId: string,
  client?: SupabaseClientType
): Promise<Array<{ userId: string; label: string }>> {
  const supabase = await resolveClient(client);
  const { data: memberships, error: membershipError } = await supabase
    .from("organization_memberships")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("status", "active");

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const userIds = ((memberships ?? []) as Array<{ user_id: string }>).map((row) => row.user_id);
  if (userIds.length === 0) {
    return [];
  }

  const { data: profiles, error: profileError } = await supabase
    .from("user_profiles")
    .select("user_id, display_name, contact_email")
    .in("user_id", userIds);

  if (profileError) {
    throw new Error(profileError.message);
  }

  return userIds.map((userId) => {
    const profile = ((profiles ?? []) as Array<{ user_id: string; display_name: string | null; contact_email: string | null }>).find(
      (row) => row.user_id === userId
    );
    const label = profile?.display_name?.trim() || profile?.contact_email?.trim() || `Staff ${userId.slice(0, 8)}`;
    return { userId, label };
  });
}

export async function getMaintenanceDashboardMetrics(
  organizationId: string,
  client?: SupabaseClientType
): Promise<MaintenanceDashboardMetrics> {
  const supabase = await resolveClient(client);
  const today = new Date().toISOString().slice(0, 10);
  const completedSince = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const [
    { count: openCount, error: openError },
    { count: highPriorityCount, error: highPriorityError },
    { count: overdueCount, error: overdueError },
    { count: completedCount, error: completedError },
    openSample,
    highPrioritySample,
    overdueSample,
    completedSample,
    recentActivity
  ] = await Promise.all([
    supabase
      .from("maintenance_work_orders")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .in("status", OPEN_STATUSES),
    supabase
      .from("maintenance_work_orders")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .in("status", OPEN_STATUSES)
      .in("priority", ["high", "emergency"]),
    supabase
      .from("maintenance_work_orders")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .in("status", OPEN_STATUSES)
      .not("due_date", "is", null)
      .lt("due_date", today),
    supabase
      .from("maintenance_work_orders")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .eq("status", "completed")
      .gte("completed_at", completedSince),
    getWorkOrdersForOrganization(organizationId, { status: "open", limit: 5, sortBy: "updated_at" }, supabase),
    getWorkOrdersForOrganization(
      organizationId,
      { status: "open", priority: "emergency", limit: 3, sortBy: "updated_at" },
      supabase
    ),
    getWorkOrdersForOrganization(
      organizationId,
      { status: "open", sortBy: "due_date", sortOrder: "asc", limit: 5 },
      supabase
    ).then((items) => items.filter((item) => item.dueDate && item.dueDate < today)),
    getWorkOrdersForOrganization(
      organizationId,
      { status: "completed", limit: 5, sortBy: "updated_at" },
      supabase
    ),
    getRecentMaintenanceActivity(organizationId, supabase)
  ]);

  assertNoError(openError);
  assertNoError(highPriorityError);
  assertNoError(overdueError);
  assertNoError(completedError);

  return {
    openWorkOrders: openCount ?? 0,
    highPriorityWorkOrders: highPriorityCount ?? 0,
    overdueWorkOrders: overdueCount ?? 0,
    recentlyCompleted: completedCount ?? 0,
    recentActivity,
    openWorkOrderSample: openSample,
    highPrioritySample: highPrioritySample.length > 0 ? highPrioritySample : openSample.filter((item) => item.priority === "high" || item.priority === "emergency").slice(0, 3),
    overdueSample,
    completedSample
  };
}

async function getRecentMaintenanceActivity(
  organizationId: string,
  client: SupabaseClientType
): Promise<MaintenanceActivityEvent[]> {
  const { data, error } = await client
    .from("maintenance_activity_events")
    .select("id, organization_id, work_order_id, event_type, summary, details, actor_user_id, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Array<{
    id: string;
    organization_id: string;
    work_order_id: string;
    event_type: string;
    summary: string;
    details: Json | null;
    actor_user_id: string | null;
    created_at: string;
  }>).map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    workOrderId: row.work_order_id,
    eventType: row.event_type,
    summary: row.summary,
    details: (row.details ?? {}) as Record<string, unknown>,
    actorUserId: row.actor_user_id,
    createdAt: row.created_at
  }));
}

async function generateWorkOrderNumber(organizationId: string, client: SupabaseClientType): Promise<string> {
  const year = new Date().getUTCFullYear();
  const prefix = `WO-${year}-`;

  const { data, error } = await client
    .from("maintenance_work_orders")
    .select("work_order_number")
    .eq("organization_id", organizationId)
    .like("work_order_number", `${prefix}%`)
    .order("work_order_number", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const latest = (data?.[0] as { work_order_number?: string } | undefined)?.work_order_number;
  const latestSequence = latest ? Number.parseInt(latest.replace(prefix, ""), 10) : 0;
  const nextSequence = Number.isFinite(latestSequence) ? latestSequence + 1 : 1;
  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
}

async function assertWorkOrderAssignment({
  organizationId,
  propertyId,
  unitId,
  tenantId,
  client
}: {
  organizationId: string;
  propertyId: string;
  unitId: string | null;
  tenantId: string | null;
  client: SupabaseClientType;
}): Promise<void> {
  const { data: property, error: propertyError } = await client
    .from("properties")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", propertyId)
    .is("deleted_at", null)
    .maybeSingle();

  if (propertyError) {
    throw new Error(propertyError.message);
  }
  if (!property) {
    throw new Error("Property not found in organization.");
  }

  if (unitId) {
    const { data: unit, error: unitError } = await client
      .from("units")
      .select("id, property_id")
      .eq("organization_id", organizationId)
      .eq("id", unitId)
      .is("deleted_at", null)
      .maybeSingle();

    if (unitError) {
      throw new Error(unitError.message);
    }
    if (!unit || unit.property_id !== propertyId) {
      throw new Error("Unit must belong to the selected property.");
    }
  }

  if (tenantId) {
    const { data: tenant, error: tenantError } = await client
      .from("tenants")
      .select("id, property_id, unit_id")
      .eq("organization_id", organizationId)
      .eq("id", tenantId)
      .is("deleted_at", null)
      .maybeSingle();

    if (tenantError) {
      throw new Error(tenantError.message);
    }
    if (!tenant) {
      throw new Error("Tenant not found in organization.");
    }
    if (unitId && tenant.unit_id && tenant.unit_id !== unitId) {
      throw new Error("Tenant must match the selected unit.");
    }
    if (tenant.property_id && tenant.property_id !== propertyId) {
      throw new Error("Tenant must belong to the selected property.");
    }
  }
}

async function listPropertyManagerUserIds(
  organizationId: string,
  client: SupabaseClientType
): Promise<string[]> {
  const { data, error } = await client
    .from("organization_memberships")
    .select("user_id, roles")
    .eq("organization_id", organizationId)
    .eq("status", "active");
  if (error) return [];
  return ((data ?? []) as Array<{ user_id: string; roles: string[] | null }>)
    .filter((row) => Array.isArray(row.roles) && row.roles.includes("property_manager"))
    .map((row) => row.user_id);
}

function mapMaintenancePriority(priority: MaintenancePriority): NotificationPriority {
  if (priority === "emergency") return "emergency";
  if (priority === "high") return "high";
  if (priority === "low") return "low";
  return "normal";
}

function statusNotificationCopy(status: MaintenanceStatus): { title: string } | null {
  switch (status) {
    case "assigned":
      return { title: "Work order assigned" };
    case "in_progress":
      return { title: "Work order in progress" };
    case "on_hold":
      return { title: "Work order on hold" };
    case "completed":
      return { title: "Work order completed" };
    case "cancelled":
      return { title: "Work order cancelled" };
    default:
      return null;
  }
}

async function recordWorkOrderUpdateEvents({
  organizationId,
  workOrderId,
  userId,
  existing,
  updates,
  nextStatus,
  client
}: {
  organizationId: string;
  workOrderId: string;
  userId: string;
  existing: {
    status: string;
    assigned_to_user_id: string | null;
    priority: string;
    due_date: string | null;
    internal_notes: string | null;
    tenant_notes: string | null;
  };
  updates: UpdateWorkOrderInput;
  nextStatus: MaintenanceStatus;
  client: SupabaseClientType;
}): Promise<void> {
  if (updates.status && updates.status !== existing.status) {
    await recordActivityEvent({
      organizationId,
      workOrderId,
      eventType: updates.status === "completed" ? "completed" : "status_changed",
      summary:
        updates.status === "completed"
          ? "Work order completed"
          : `Status changed to ${toMaintenanceStatusLabel(updates.status)}`,
      details: { from: existing.status, to: updates.status },
      actorUserId: userId,
      client
    });
    return;
  }

  if (updates.assignedToUserId !== undefined && updates.assignedToUserId !== existing.assigned_to_user_id) {
    await recordActivityEvent({
      organizationId,
      workOrderId,
      eventType: "assigned",
      summary: updates.assignedToUserId ? "Assigned to internal staff" : "Assignment cleared",
      details: { assignedToUserId: updates.assignedToUserId },
      actorUserId: userId,
      client
    });
  }

  const noteChanged =
    (updates.internalNotes !== undefined && updates.internalNotes !== existing.internal_notes) ||
    (updates.tenantNotes !== undefined && updates.tenantNotes !== existing.tenant_notes);

  if (noteChanged) {
    await recordActivityEvent({
      organizationId,
      workOrderId,
      eventType: "note_added",
      summary: "Notes updated",
      details: {},
      actorUserId: userId,
      client
    });
    return;
  }

  if (Object.keys(updates).length > 0) {
    await recordActivityEvent({
      organizationId,
      workOrderId,
      eventType: "updated",
      summary: "Work order details updated",
      details: { status: nextStatus },
      actorUserId: userId,
      client
    });
  }
}

async function recordActivityEvent({
  organizationId,
  workOrderId,
  eventType,
  summary,
  details,
  actorUserId,
  client
}: {
  organizationId: string;
  workOrderId: string;
  eventType: string;
  summary: string;
  details: Record<string, unknown>;
  actorUserId: string;
  client: SupabaseClientType;
}): Promise<void> {
  const { error } = await client.from("maintenance_activity_events").insert({
    organization_id: organizationId,
    work_order_id: workOrderId,
    event_type: eventType,
    summary,
    details: details as Json,
    actor_user_id: actorUserId
  });

  if (error) {
    throw new Error(error.message);
  }
}

function toWorkOrderRecord(row: WorkOrderRow): WorkOrderRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    propertyId: row.property_id,
    unitId: row.unit_id,
    tenantId: row.tenant_id,
    workOrderNumber: row.work_order_number,
    title: row.title,
    description: row.description,
    category: row.category,
    priority: row.priority,
    status: row.status,
    dueDate: row.due_date,
    assignedToUserId: row.assigned_to_user_id,
    vendorId: row.vendor_id,
    currentVendorAssignmentId: row.current_vendor_assignment_id,
    internalNotes: row.internal_notes,
    tenantNotes: row.tenant_notes,
    photoPlaceholder: row.photo_placeholder,
    documentPlaceholder: row.document_placeholder,
    recurringMaintenancePlaceholder: row.recurring_maintenance_placeholder,
    preventiveMaintenancePlaceholder: row.preventive_maintenance_placeholder,
    completedAt: row.completed_at,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    deletedAt: row.deleted_at
  };
}

function toWorkOrderListItem(row: WorkOrderRelationRow): WorkOrderListItem {
  const tenant = row.tenants;
  const tenantName = tenant
    ? tenant.preferred_name || `${tenant.first_name} ${tenant.last_name}`.trim()
    : null;

  return {
    ...toWorkOrderRecord(row),
    propertyName: row.properties?.name ?? null,
    unitNumber: row.units?.unit_number ?? null,
    tenantName
  };
}

function escapeLike(value: string): string {
  return value.replaceAll("%", "\\%").replaceAll("_", "\\_");
}

async function resolveTenantRecipientUserIds(
  organizationId: string,
  tenantId: string | null,
  client: SupabaseClientType
): Promise<string[]> {
  if (!tenantId) return [];
  const { data } = await client
    .from("tenants")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("id", tenantId)
    .is("deleted_at", null)
    .maybeSingle();
  const userId = data?.user_id as string | null | undefined;
  return userId ? [userId] : [];
}

function assertNoError(error: { message: string } | null): void {
  if (error) {
    throw new Error(error.message);
  }
}

async function resolveClient(client?: SupabaseClientType): Promise<SupabaseClientType> {
  return client ?? (await createAuthServerComponentClient());
}
