import type { SupabaseClient } from "@supabase/supabase-js";
import {
  deriveOccupancyAccess,
  occupancyIsCurrent,
  utcToday,
  type OccupancyStatus,
  type ResidentPortalStatus,
  type ResidentStatus,
  type TenantAccessMode
} from "@mpa/shared";
import { emitResidentEvent, writeResidentAudit } from "../resident/events-audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export class TenantLifecycleError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "TenantLifecycleError";
  }
}

export type OccupancyRow = {
  id: string;
  organization_id: string;
  lease_id: string;
  user_id: string | null;
  display_name: string;
  email: string | null;
  is_primary: boolean;
  financial_status: string;
  pm_resident_id: string | null;
  occupancy_status: OccupancyStatus;
  occupy_from: string;
  occupy_to: string | null;
};

export async function emitLifecycle(args: {
  supabase: Db;
  organizationId: string;
  actorId: string | null;
  eventType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
}) {
  await emitResidentEvent({
    supabase: args.supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    eventType: args.eventType,
    aggregateType: "lease_residents",
    aggregateId: args.aggregateId,
    payload: args.payload
  });
  await writeResidentAudit({
    supabase: args.supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    action: args.eventType,
    entityType: "lease_residents",
    entityId: args.aggregateId,
    payload: args.payload
  });
}

export function occupancyAccess(row: OccupancyRow, today = utcToday()): TenantAccessMode {
  return deriveOccupancyAccess(
    {
      occupancyStatus: row.occupancy_status,
      occupyFrom: row.occupy_from,
      occupyTo: row.occupy_to
    },
    today
  );
}

export async function recomputePersonFromOccupancy(
  supabase: Db,
  organizationId: string,
  residentId: string
) {
  const { data: rows, error } = await supabase
    .from("lease_residents")
    .select("id, lease_id, occupancy_status, occupy_from, occupy_to, user_id")
    .eq("organization_id", organizationId)
    .eq("pm_resident_id", residentId);
  if (error) {
    throw new TenantLifecycleError(error.message, 400);
  }
  const occupancies = (rows ?? []) as OccupancyRow[];
  const today = utcToday();
  const current =
    occupancies.find((row) =>
      occupancyIsCurrent(
        {
          occupancyStatus: row.occupancy_status,
          occupyFrom: row.occupy_from,
          occupyTo: row.occupy_to
        },
        today
      )
    ) ??
    occupancies.find((row) => occupancyAccess(row, today) === "future") ??
    null;

  let status: ResidentStatus = "former";
  let portalStatus: ResidentPortalStatus = "disabled";
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  if (current && occupancyAccess(current, today) === "active") {
    status = "active";
    portalStatus = current.user_id ? "active" : "pending_activation";
    const { data: lease } = await supabase
      .from("lease_agreements")
      .select("property_id, unit_id")
      .eq("id", current.lease_id)
      .maybeSingle();
    patch["lease_id"] = current.lease_id;
    if (lease?.property_id) patch["property_id"] = lease.property_id;
    if (lease?.unit_id) patch["unit_id"] = lease.unit_id;
  } else if (current && occupancyAccess(current, today) === "future") {
    status = "pending_move_in";
    portalStatus = current.user_id ? "active" : "pending_activation";
    patch["lease_id"] = current.lease_id;
  } else {
    status = "former";
    portalStatus = "disabled";
  }

  patch["status"] = status;
  patch["portal_status"] = portalStatus;

  const { error: updateError } = await supabase
    .from("pm_residents")
    .update(patch)
    .eq("id", residentId)
    .eq("organization_id", organizationId);
  if (updateError) {
    throw new TenantLifecycleError(updateError.message, 400);
  }
}
