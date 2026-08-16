import type { SupabaseClient } from "@supabase/supabase-js";
import {
  emitLifecycle,
  occupancyAccess,
  recomputePersonFromOccupancy,
  TenantLifecycleError,
  type OccupancyRow
} from "./occupancy-core";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export async function acceptTenantBinding(args: {
  supabase: Db;
  userId: string;
  userEmail: string;
  organizationId: string;
  invitationId: string;
  invitationEmail: string;
  browserOverrides?: Record<string, unknown> | null;
}) {
  if (args.browserOverrides && Object.keys(args.browserOverrides).length > 0) {
    // Body is ignored. Presence of override keys must not change the grant.
  }

  const { data: binding, error } = await args.supabase
    .from("organization_invitation_tenant_bindings")
    .select("invitation_id, organization_id, property_id, unit_id, lease_id, resident_id, lease_resident_id")
    .eq("invitation_id", args.invitationId)
    .maybeSingle();
  if (error) {
    throw new TenantLifecycleError(error.message, 400);
  }
  if (!binding) {
    throw new TenantLifecycleError("Tenant invitation is missing occupancy binding.", 409);
  }
  if (binding.organization_id !== args.organizationId) {
    throw new TenantLifecycleError("Invitation organization does not match.", 409);
  }
  if (args.userEmail.trim().toLowerCase() !== args.invitationEmail.trim().toLowerCase()) {
    throw new TenantLifecycleError("Sign in with the invited email address to accept.", 403);
  }

  const { data: person } = await args.supabase
    .from("pm_residents")
    .select("id, organization_id, email, user_id, lease_id")
    .eq("id", binding.resident_id)
    .eq("organization_id", binding.organization_id)
    .maybeSingle();
  if (!person || person.email.trim().toLowerCase() !== args.invitationEmail.trim().toLowerCase()) {
    throw new TenantLifecycleError("Resident email no longer matches this invitation.", 409);
  }
  if (person.user_id && person.user_id !== args.userId) {
    throw new TenantLifecycleError("This resident is already linked to another account.", 409);
  }

  const { data: occupancy } = await args.supabase
    .from("lease_residents")
    .select(
      "id, organization_id, lease_id, user_id, pm_resident_id, occupancy_status, occupy_from, occupy_to, email"
    )
    .eq("id", binding.lease_resident_id)
    .maybeSingle();
  if (!occupancy || occupancy.lease_id !== binding.lease_id || occupancy.pm_resident_id !== binding.resident_id) {
    throw new TenantLifecycleError("Lease occupancy no longer matches this invitation.", 409);
  }
  if (occupancyAccess(occupancy as OccupancyRow) === "moved_out") {
    throw new TenantLifecycleError("This occupancy has already ended.", 409);
  }
  if (occupancy.user_id && occupancy.user_id !== args.userId) {
    throw new TenantLifecycleError("This occupancy is already linked to another account.", 409);
  }

  const { data: lease } = await args.supabase
    .from("lease_agreements")
    .select("id, status, property_id, unit_id, organization_id")
    .eq("id", binding.lease_id)
    .maybeSingle();
  if (!lease || lease.status === "ended") {
    throw new TenantLifecycleError("Lease is not eligible for acceptance.", 409);
  }
  if (lease.property_id !== binding.property_id || lease.unit_id !== binding.unit_id) {
    throw new TenantLifecycleError("Lease location no longer matches this invitation.", 409);
  }

  const alreadyLinked = person.user_id === args.userId && occupancy.user_id === args.userId;
  if (!person.user_id) {
    const { error: personError } = await args.supabase
      .from("pm_residents")
      .update({ user_id: args.userId, updated_at: new Date().toISOString() })
      .eq("id", person.id);
    if (personError) {
      throw new TenantLifecycleError(personError.message, 400);
    }
  }
  if (!occupancy.user_id) {
    const { error: occupancyError } = await args.supabase
      .from("lease_residents")
      .update({ user_id: args.userId })
      .eq("id", occupancy.id);
    if (occupancyError) {
      throw new TenantLifecycleError(occupancyError.message, 400);
    }
  }

  await recomputePersonFromOccupancy(args.supabase, args.organizationId, person.id);

  if (!alreadyLinked) {
    await emitLifecycle({
      supabase: args.supabase,
      organizationId: args.organizationId,
      actorId: args.userId,
      eventType: "tenant.invitation_accepted",
      aggregateId: occupancy.id,
      payload: {
        invitationId: args.invitationId,
        residentId: person.id,
        leaseId: binding.lease_id,
        propertyId: binding.property_id,
        unitId: binding.unit_id
      }
    });
  }

  return {
    residentId: person.id as string,
    leaseId: binding.lease_id as string,
    occupancyId: occupancy.id as string
  };
}
