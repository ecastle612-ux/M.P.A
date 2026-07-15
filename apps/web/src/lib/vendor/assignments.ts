import { createAuthServerComponentClient } from "../auth/server";
import type { Database, Json } from "@mpa/supabase";
import type { VendorAssignmentRecord, VendorAssignmentStatus } from "./contracts";
import { toVendorAssignmentStatusLabel } from "./contracts";

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;
type VendorAssignmentUpdate = Database["public"]["Tables"]["maintenance_vendor_assignments"]["Update"];
type WorkOrderUpdate = Database["public"]["Tables"]["maintenance_work_orders"]["Update"];

type VendorAssignmentRow = {
  id: string;
  organization_id: string;
  work_order_id: string;
  vendor_id: string;
  assignment_status: VendorAssignmentStatus;
  assigned_at: string;
  accepted_at: string | null;
  arrived_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  completion_notes: string | null;
  cancellation_reason: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
};

const ASSIGNMENT_SELECT =
  "id, organization_id, work_order_id, vendor_id, assignment_status, assigned_at, accepted_at, arrived_at, completed_at, cancelled_at, completion_notes, cancellation_reason, is_current, created_at, updated_at";

const IN_PROGRESS_ASSIGNMENT_STATUSES: VendorAssignmentStatus[] = ["accepted", "en_route", "arrived", "in_progress"];

export async function assignVendorToWorkOrder(
  organizationId: string,
  workOrderId: string,
  vendorId: string,
  userId: string,
  client?: SupabaseClientType,
  isReassign = false
): Promise<VendorAssignmentRecord> {
  const supabase = await resolveClient(client);
  const workOrder = await getWorkOrderContext(organizationId, workOrderId, supabase);
  await assertVendorAvailable(organizationId, vendorId, supabase);

  if (isReassign) {
    const currentAssignment = await getCurrentVendorAssignment(organizationId, workOrderId, supabase);
    if (currentAssignment) {
      const cancelPatch: VendorAssignmentUpdate = {
        is_current: false,
        updated_by: userId
      };
      if (currentAssignment.assignmentStatus !== "completed") {
        cancelPatch.assignment_status = "cancelled";
        cancelPatch.cancelled_at = new Date().toISOString();
        cancelPatch.cancellation_reason = "Reassigned to another vendor";
      }

      const { error: cancelError } = await supabase
        .from("maintenance_vendor_assignments")
        .update(cancelPatch)
        .eq("organization_id", organizationId)
        .eq("id", currentAssignment.id);

      if (cancelError) {
        throw new Error(cancelError.message);
      }
    }
  } else {
    const existingCurrent = await getCurrentVendorAssignment(organizationId, workOrderId, supabase);
    if (existingCurrent) {
      throw new Error("Work order already has a current vendor assignment.");
    }
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("maintenance_vendor_assignments")
    .insert({
      organization_id: organizationId,
      work_order_id: workOrderId,
      vendor_id: vendorId,
      assignment_status: "pending",
      is_current: true,
      created_by: userId,
      updated_by: userId
    })
    .select(ASSIGNMENT_SELECT)
    .single();

  if (assignmentError || !assignment) {
    throw new Error(assignmentError?.message ?? "Vendor assignment failed");
  }

  const workOrderPatch: WorkOrderUpdate = {
    vendor_id: vendorId,
    current_vendor_assignment_id: assignment.id,
    updated_by: userId
  };
  if (workOrder.status === "submitted" || workOrder.status === "triaged") {
    workOrderPatch.status = "assigned";
  }

  const { error: workOrderError } = await supabase
    .from("maintenance_work_orders")
    .update(workOrderPatch)
    .eq("organization_id", organizationId)
    .eq("id", workOrderId)
    .is("deleted_at", null);

  if (workOrderError) {
    throw new Error(workOrderError.message);
  }

  const vendor = await getVendorName(organizationId, vendorId, supabase);
  await recordVendorActivityEvent({
    organizationId,
    workOrderId,
    eventType: isReassign ? "vendor_reassigned" : "vendor_assigned",
    summary: isReassign ? `Vendor reassigned to ${vendor}` : `Vendor assigned to ${vendor}`,
    details: { vendorId, assignmentId: assignment.id },
    actorUserId: userId,
    client: supabase
  });

  return toVendorAssignmentRecord(assignment as VendorAssignmentRow);
}

export async function updateVendorAssignmentStatus(
  organizationId: string,
  workOrderId: string,
  userId: string,
  input: {
    assignmentStatus: VendorAssignmentStatus;
    completionNotes?: string | null;
    cancellationReason?: string | null;
  },
  client?: SupabaseClientType
): Promise<VendorAssignmentRecord | null> {
  const supabase = await resolveClient(client);
  const currentAssignment = await getCurrentVendorAssignment(organizationId, workOrderId, supabase);
  if (!currentAssignment) {
    return null;
  }

  const now = new Date().toISOString();
  const patch: VendorAssignmentUpdate = {
    assignment_status: input.assignmentStatus,
    updated_by: userId
  };

  if (input.assignmentStatus === "accepted") {
    patch.accepted_at = now;
  }
  if (input.assignmentStatus === "arrived") {
    patch.arrived_at = now;
  }
  if (input.assignmentStatus === "completed") {
    patch.completed_at = now;
    if (input.completionNotes !== undefined) {
      patch.completion_notes = input.completionNotes;
    }
  }
  if (input.assignmentStatus === "cancelled") {
    patch.cancelled_at = now;
    if (input.cancellationReason !== undefined) {
      patch.cancellation_reason = input.cancellationReason;
    }
  }

  const { data: updatedAssignment, error: assignmentError } = await supabase
    .from("maintenance_vendor_assignments")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", currentAssignment.id)
    .select(ASSIGNMENT_SELECT)
    .maybeSingle();

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }
  if (!updatedAssignment) {
    return null;
  }

  const workOrderPatch: WorkOrderUpdate = { updated_by: userId };
  if (input.assignmentStatus === "completed") {
    workOrderPatch.status = "completed";
    workOrderPatch.completed_at = now;
  } else if (IN_PROGRESS_ASSIGNMENT_STATUSES.includes(input.assignmentStatus)) {
    workOrderPatch.status = "in_progress";
  } else if (input.assignmentStatus === "pending" || input.assignmentStatus === "awaiting_response") {
    workOrderPatch.status = "assigned";
  } else if (input.assignmentStatus === "cancelled") {
    workOrderPatch.current_vendor_assignment_id = null;
    workOrderPatch.vendor_id = null;
    workOrderPatch.status = "triaged";
  }

  const { error: workOrderError } = await supabase
    .from("maintenance_work_orders")
    .update(workOrderPatch)
    .eq("organization_id", organizationId)
    .eq("id", workOrderId)
    .is("deleted_at", null);

  if (workOrderError) {
    throw new Error(workOrderError.message);
  }

  await recordVendorStatusActivityEvent({
    organizationId,
    workOrderId,
    previousStatus: currentAssignment.assignmentStatus,
    nextStatus: input.assignmentStatus,
    vendorId: currentAssignment.vendorId,
    actorUserId: userId,
    client: supabase
  });

  return toVendorAssignmentRecord(updatedAssignment as VendorAssignmentRow);
}

export async function getVendorAssignmentsForWorkOrder(
  organizationId: string,
  workOrderId: string,
  client?: SupabaseClientType
): Promise<VendorAssignmentRecord[]> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("maintenance_vendor_assignments")
    .select(ASSIGNMENT_SELECT)
    .eq("organization_id", organizationId)
    .eq("work_order_id", workOrderId)
    .order("assigned_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as VendorAssignmentRow[]).map(toVendorAssignmentRecord);
}

export async function getCurrentVendorAssignment(
  organizationId: string,
  workOrderId: string,
  client?: SupabaseClientType
): Promise<VendorAssignmentRecord | null> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("maintenance_vendor_assignments")
    .select(ASSIGNMENT_SELECT)
    .eq("organization_id", organizationId)
    .eq("work_order_id", workOrderId)
    .eq("is_current", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? toVendorAssignmentRecord(data as VendorAssignmentRow) : null;
}

async function getWorkOrderContext(
  organizationId: string,
  workOrderId: string,
  client: SupabaseClientType
): Promise<{ id: string; status: string }> {
  const { data, error } = await client
    .from("maintenance_work_orders")
    .select("id, status")
    .eq("organization_id", organizationId)
    .eq("id", workOrderId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error("Work order not found in organization.");
  }

  return data;
}

async function assertVendorAvailable(
  organizationId: string,
  vendorId: string,
  client: SupabaseClientType
): Promise<void> {
  const { data, error } = await client
    .from("vendors")
    .select("id, status")
    .eq("organization_id", organizationId)
    .eq("id", vendorId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error("Vendor not found in organization.");
  }
  if (data.status !== "active") {
    throw new Error("Only active vendors can be assigned to work orders.");
  }
}

async function getVendorName(
  organizationId: string,
  vendorId: string,
  client: SupabaseClientType
): Promise<string> {
  const { data, error } = await client
    .from("vendors")
    .select("business_name")
    .eq("organization_id", organizationId)
    .eq("id", vendorId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.business_name ?? "vendor";
}

async function recordVendorStatusActivityEvent({
  organizationId,
  workOrderId,
  previousStatus,
  nextStatus,
  vendorId,
  actorUserId,
  client
}: {
  organizationId: string;
  workOrderId: string;
  previousStatus: VendorAssignmentStatus;
  nextStatus: VendorAssignmentStatus;
  vendorId: string;
  actorUserId: string;
  client: SupabaseClientType;
}): Promise<void> {
  const eventType = resolveVendorStatusEventType(nextStatus);
  const summary =
    eventType === "vendor_status_changed"
      ? `Vendor status changed to ${toVendorAssignmentStatusLabel(nextStatus)}`
      : resolveVendorStatusEventSummary(nextStatus);

  await recordVendorActivityEvent({
    organizationId,
    workOrderId,
    eventType,
    summary,
    details: { vendorId, from: previousStatus, to: nextStatus },
    actorUserId,
    client
  });
}

function resolveVendorStatusEventType(status: VendorAssignmentStatus): string {
  switch (status) {
    case "accepted":
      return "vendor_accepted";
    case "arrived":
      return "vendor_arrived";
    case "completed":
      return "vendor_completed";
    case "cancelled":
      return "vendor_cancelled";
    default:
      return "vendor_status_changed";
  }
}

function resolveVendorStatusEventSummary(status: VendorAssignmentStatus): string {
  switch (status) {
    case "accepted":
      return "Vendor accepted assignment";
    case "arrived":
      return "Vendor arrived on site";
    case "completed":
      return "Vendor completed assignment";
    case "cancelled":
      return "Vendor assignment cancelled";
    default:
      return `Vendor status changed to ${toVendorAssignmentStatusLabel(status)}`;
  }
}

async function recordVendorActivityEvent({
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

function toVendorAssignmentRecord(row: VendorAssignmentRow): VendorAssignmentRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    workOrderId: row.work_order_id,
    vendorId: row.vendor_id,
    assignmentStatus: row.assignment_status,
    assignedAt: row.assigned_at,
    acceptedAt: row.accepted_at,
    arrivedAt: row.arrived_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
    completionNotes: row.completion_notes,
    cancellationReason: row.cancellation_reason,
    isCurrent: row.is_current,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function resolveClient(client?: SupabaseClientType): Promise<SupabaseClientType> {
  return client ?? (await createAuthServerComponentClient());
}
