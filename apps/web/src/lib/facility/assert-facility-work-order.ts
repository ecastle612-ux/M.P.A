import type { SupabaseClient } from "@supabase/supabase-js";
import { getWorkOrder, type WorkOrderRow } from "../maintenance/maintenance-service";

export async function requireFacilityWorkOrder(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  organizationId: string,
  workOrderId: string
): Promise<WorkOrderRow | { error: string; status: number }> {
  const workOrder = await getWorkOrder(supabase, organizationId, workOrderId);
  if (!workOrder || workOrder.work_surface !== "facility") {
    return { error: "Not found", status: 404 };
  }
  return workOrder;
}
