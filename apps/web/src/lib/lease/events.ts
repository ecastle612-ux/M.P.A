import type { createAuthServerComponentClient } from "../auth/server";
import type { Json } from "@mpa/supabase";
import type { LeaseEventType, LeaseRecord, LeaseStatus } from "./contracts";

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

export async function recordLeaseEvent(
  organizationId: string,
  leaseId: string,
  userId: string,
  eventType: LeaseEventType,
  summary: string,
  payload: Record<string, unknown> = {},
  client: SupabaseClientType
) {
  const { error } = await client.from("lease_events").insert({
    organization_id: organizationId,
    lease_id: leaseId,
    event_type: eventType,
    summary,
    payload: payload as Json,
    created_by: userId
  });

  if (error) {
    throw new Error(error.message);
  }
}

export function assertLeaseLifecycleTransition(currentStatus: LeaseStatus, action: string) {
  const allowed: Record<string, LeaseStatus[]> = {
    sign: ["draft"],
    activate: ["draft", "signed"],
    offer_renewal: ["active"],
    renew: ["active"],
    give_notice: ["active"],
    expire: ["active", "signed"],
    terminate: ["draft", "signed", "active"],
    move_out: ["active", "expired", "terminated"]
  };

  const permittedFrom = allowed[action];
  if (!permittedFrom) return;
  if (!permittedFrom.includes(currentStatus)) {
    throw new Error(`Cannot ${action.replaceAll("_", " ")} a lease in ${currentStatus} status.`);
  }
}

export function buildRenewedEndDate(currentEndDate: string, extensionMonths: number): string {
  const date = new Date(`${currentEndDate}T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + extensionMonths);
  return date.toISOString().slice(0, 10);
}

export function defaultMoveOutDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function leaseLifecycleSummary(action: string, lease: Pick<LeaseRecord, "leaseNumber">): string {
  const summaries: Record<string, string> = {
    sign: `Lease ${lease.leaseNumber} signed`,
    activate: `Lease ${lease.leaseNumber} activated`,
    offer_renewal: `Renewal offered for lease ${lease.leaseNumber}`,
    renew: `Lease ${lease.leaseNumber} renewed`,
    give_notice: `Notice given for lease ${lease.leaseNumber}`,
    expire: `Lease ${lease.leaseNumber} expired`,
    terminate: `Lease ${lease.leaseNumber} terminated`,
    move_out: `Move-out recorded for lease ${lease.leaseNumber}`
  };
  return summaries[action] ?? `Lease ${lease.leaseNumber} updated`;
}
