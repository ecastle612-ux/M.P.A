import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AssignWorkOrderInput,
  ProgressWorkOrderInput,
  TriageWorkOrderInput
} from "@mpa/shared";
import {
  assignWorkOrder,
  getWorkOrder,
  progressWorkOrder,
  triageWorkOrder
} from "../maintenance/maintenance-service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

async function requireFacilityContextWorkOrder(
  supabase: Db,
  organizationId: string,
  workOrderId: string
) {
  const workOrder = await getWorkOrder(supabase, organizationId, workOrderId);
  if (!workOrder || workOrder.product_context !== "facility") {
    throw new Error("Facility work order not found");
  }
  return workOrder;
}

/** Reuses Maintenance triage path for facility-context WOs only. */
export async function triageFacilityWorkOrder(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: TriageWorkOrderInput
) {
  await requireFacilityContextWorkOrder(supabase, organizationId, input.workOrderId);
  return triageWorkOrder(supabase, organizationId, actorUserId, input);
}

/** Reuses Maintenance assign path for facility-context WOs only. */
export async function assignFacilityWorkOrder(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  input: AssignWorkOrderInput
) {
  await requireFacilityContextWorkOrder(supabase, organizationId, input.workOrderId);
  return assignWorkOrder(supabase, organizationId, actorUserId, input);
}

/** Reuses Maintenance progress path for facility-context WOs only. */
export async function progressFacilityWorkOrder(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  actorRole: "manager" | "technician",
  input: ProgressWorkOrderInput
) {
  await requireFacilityContextWorkOrder(supabase, organizationId, input.workOrderId);
  return progressWorkOrder(supabase, organizationId, actorUserId, actorRole, input);
}
