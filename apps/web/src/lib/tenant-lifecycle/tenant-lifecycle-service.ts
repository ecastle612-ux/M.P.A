import type { SupabaseClient } from "@supabase/supabase-js";
import {
  deriveOccupancyAccess,
  occupancyIsCurrent,
  residentDisplayName,
  utcToday,
  type AddTenantInput,
  type OccupancyStatus,
  type ResidentPortalStatus,
  type ResidentStatus,
  type TenantAccessMode
} from "@mpa/shared";
import { createAndSendInvitation, InvitationCreateError } from "../team/invitation-service";
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

type LeaseRow = {
  id: string;
  organization_id: string;
  property_id: string;
  unit_id: string | null;
  status: string;
  start_date: string;
  end_date: string | null;
  resident_id: string | null;
};

type PersonRow = {
  id: string;
  organization_id: string;
  property_id: string;
  unit_id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
  status: ResidentStatus;
  portal_status: ResidentPortalStatus;
  user_id: string | null;
  lease_id: string | null;
};

async function emitLifecycle(args: {
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

export async function listOccupanciesForUser(
  supabase: Db,
  organizationId: string,
  userId: string
): Promise<OccupancyRow[]> {
  const { data, error } = await supabase
    .from("lease_residents")
    .select(
      "id, organization_id, lease_id, user_id, display_name, email, is_primary, financial_status, pm_resident_id, occupancy_status, occupy_from, occupy_to"
    )
    .eq("organization_id", organizationId)
    .eq("user_id", userId);
  if (error) {
    throw new TenantLifecycleError(error.message, 400);
  }
  return (data ?? []) as OccupancyRow[];
}

export function resolveTenantPortalMode(
  occupancies: OccupancyRow[],
  today = utcToday()
): { mode: TenantAccessMode; current: OccupancyRow | null; historical: OccupancyRow[] } {
  const current = occupancies.find((row) => occupancyAccess(row, today) === "active") ?? null;
  const future = occupancies.find((row) => occupancyAccess(row, today) === "future") ?? null;
  const historical = occupancies.filter((row) => occupancyAccess(row, today) === "moved_out");
  if (current) {
    return { mode: "active", current, historical };
  }
  if (future) {
    return { mode: "future", current: future, historical };
  }
  if (historical.length > 0) {
    return { mode: "moved_out", current: historical[0] ?? null, historical };
  }
  return { mode: "invited", current: null, historical: [] };
}

async function loadLease(supabase: Db, organizationId: string, leaseId: string): Promise<LeaseRow> {
  const { data, error } = await supabase
    .from("lease_agreements")
    .select("id, organization_id, property_id, unit_id, status, start_date, end_date, resident_id")
    .eq("id", leaseId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) {
    throw new TenantLifecycleError(error.message, 400);
  }
  if (!data) {
    throw new TenantLifecycleError("Lease not found.", 404);
  }
  return data as LeaseRow;
}

async function recomputePersonFromOccupancy(
  supabase: Db,
  organizationId: string,
  residentId: string
) {
  const { data: rows, error } = await supabase
    .from("lease_residents")
    .select(
      "id, lease_id, occupancy_status, occupy_from, occupy_to, user_id"
    )
    .eq("organization_id", organizationId)
    .eq("pm_resident_id", residentId);
  if (error) {
    throw new TenantLifecycleError(error.message, 400);
  }
  const occupancies = (rows ?? []) as OccupancyRow[];
  const today = utcToday();
  const current =
    occupancies.find((row) => occupancyIsCurrent({
      occupancyStatus: row.occupancy_status,
      occupyFrom: row.occupy_from,
      occupyTo: row.occupy_to
    }, today)) ??
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

export async function addTenantToLease(args: {
  supabase: Db;
  organizationId: string;
  actorId: string;
  organizationName: string;
  input: AddTenantInput;
  sendEmail?: Parameters<typeof createAndSendInvitation>[0]["sendEmail"];
}) {
  const lease = await loadLease(args.supabase, args.organizationId, args.input.leaseId);
  if (lease.status === "ended") {
    throw new TenantLifecycleError("Cannot add a tenant to an ended lease.", 409);
  }
  if (!lease.unit_id) {
    throw new TenantLifecycleError("Lease must be assigned to a unit.", 400);
  }

  const email = args.input.email.trim().toLowerCase();
  const occupyFrom = args.input.occupyFrom ?? lease.start_date;
  const today = utcToday();
  const occupancyStatus: OccupancyStatus = occupyFrom > today ? "scheduled" : "occupying";
  const displayName = residentDisplayName(args.input.firstName, args.input.lastName);

  const { data: existingPerson } = await args.supabase
    .from("pm_residents")
    .select("*")
    .eq("organization_id", args.organizationId)
    .eq("email", email)
    .maybeSingle();

  let person = existingPerson as PersonRow | null;
  if (!person) {
    const { data: created, error } = await args.supabase
      .from("pm_residents")
      .insert({
        organization_id: args.organizationId,
        property_id: lease.property_id,
        unit_id: lease.unit_id,
        first_name: args.input.firstName.trim(),
        last_name: args.input.lastName.trim(),
        display_name: displayName,
        email,
        status: occupancyStatus === "scheduled" ? "pending_move_in" : "pending_lease",
        portal_status: "pending_activation",
        lease_id: lease.id,
        created_by: args.actorId
      })
      .select("*")
      .single();
    if (error || !created) {
      throw new TenantLifecycleError(error?.message ?? "Could not create resident.", 400);
    }
    person = created as PersonRow;
  }

  const { data: existingOccupancy } = await args.supabase
    .from("lease_residents")
    .select("id, occupancy_status, occupy_from, occupy_to, user_id")
    .eq("organization_id", args.organizationId)
    .eq("lease_id", lease.id)
    .eq("pm_resident_id", person.id)
    .maybeSingle();

  if (existingOccupancy) {
    const mode = occupancyAccess(existingOccupancy as OccupancyRow, today);
    if (mode === "active" || mode === "future") {
      throw new TenantLifecycleError("This resident is already on this lease.", 409);
    }
  }

  const { count: householdCount } = await args.supabase
    .from("lease_residents")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", args.organizationId)
    .eq("lease_id", lease.id);

  const { data: occupancy, error: occupancyError } = await args.supabase
    .from("lease_residents")
    .insert({
      organization_id: args.organizationId,
      lease_id: lease.id,
      user_id: person.user_id,
      display_name: displayName,
      email,
      is_primary: (householdCount ?? 0) === 0,
      financial_status: "current",
      pm_resident_id: person.id,
      occupancy_status: occupancyStatus,
      occupy_from: occupyFrom,
      occupy_to: null
    })
    .select(
      "id, organization_id, lease_id, user_id, display_name, email, is_primary, financial_status, pm_resident_id, occupancy_status, occupy_from, occupy_to"
    )
    .single();
  if (occupancyError || !occupancy) {
    if (occupancyError?.code === "23505") {
      throw new TenantLifecycleError("This email is already on this lease.", 409);
    }
    throw new TenantLifecycleError(occupancyError?.message ?? "Could not add tenant to lease.", 400);
  }

  await recomputePersonFromOccupancy(args.supabase, args.organizationId, person.id);

  const { data: property } = await args.supabase
    .from("property_properties")
    .select("name")
    .eq("id", lease.property_id)
    .maybeSingle();
  const { data: unit } = await args.supabase
    .from("property_units")
    .select("unit_label")
    .eq("id", lease.unit_id)
    .maybeSingle();

  let invitation;
  try {
    invitation = await createAndSendInvitation({
      supabase: args.supabase,
      organizationId: args.organizationId,
      actorId: args.actorId,
      email,
      roles: ["tenant"],
      organizationName: args.organizationName,
      ...(args.sendEmail ? { sendEmail: args.sendEmail } : {})
    });
  } catch (error) {
    if (error instanceof InvitationCreateError) {
      throw new TenantLifecycleError(error.message, error.status);
    }
    throw error;
  }

  const { error: bindingError } = await args.supabase
    .from("organization_invitation_tenant_bindings")
    .insert({
      invitation_id: invitation.invitation.id,
      organization_id: args.organizationId,
      property_id: lease.property_id,
      unit_id: lease.unit_id,
      lease_id: lease.id,
      resident_id: person.id,
      lease_resident_id: occupancy.id
    });
  if (bindingError) {
    throw new TenantLifecycleError(bindingError.message, 400);
  }

  const payload = {
    tenantName: displayName,
    email,
    propertyId: lease.property_id,
    propertyName: property?.name ?? null,
    unitId: lease.unit_id,
    unitLabel: unit?.unit_label ?? null,
    leaseId: lease.id,
    residentId: person.id,
    occupyFrom,
    invitationId: invitation.invitation.id
  };

  await emitLifecycle({
    supabase: args.supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    eventType: "tenant.invited",
    aggregateId: occupancy.id,
    payload
  });

  return {
    resident: person,
    occupancy,
    invitation: invitation.invitation,
    acceptUrl: invitation.acceptUrl,
    emailStatus: invitation.emailStatus,
    deliveryStatus: invitation.deliveryStatus,
    confirmation: {
      tenantName: displayName,
      propertyName: (property?.name as string | undefined) ?? "Property",
      unitLabel: (unit?.unit_label as string | undefined) ?? "—",
      occupyFrom
    }
  };
}

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

async function loadOccupancyForManager(
  supabase: Db,
  organizationId: string,
  occupancyId: string
): Promise<{ occupancy: OccupancyRow; lease: LeaseRow; person: PersonRow | null }> {
  const { data: occupancy, error } = await supabase
    .from("lease_residents")
    .select(
      "id, organization_id, lease_id, user_id, display_name, email, is_primary, financial_status, pm_resident_id, occupancy_status, occupy_from, occupy_to"
    )
    .eq("id", occupancyId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) {
    throw new TenantLifecycleError(error.message, 400);
  }
  if (!occupancy) {
    throw new TenantLifecycleError("Resident occupancy not found.", 404);
  }
  const lease = await loadLease(supabase, organizationId, occupancy.lease_id as string);
  let person: PersonRow | null = null;
  if (occupancy.pm_resident_id) {
    const { data } = await supabase
      .from("pm_residents")
      .select("*")
      .eq("id", occupancy.pm_resident_id)
      .maybeSingle();
    person = (data as PersonRow | null) ?? null;
  }
  return { occupancy: occupancy as OccupancyRow, lease, person };
}

export async function moveOutOccupancy(args: {
  supabase: Db;
  organizationId: string;
  actorId: string;
  occupancyId: string;
  occupyTo: string;
  note?: string;
}) {
  const { occupancy, lease, person } = await loadOccupancyForManager(
    args.supabase,
    args.organizationId,
    args.occupancyId
  );
  const today = utcToday();
  const currentMode = occupancyAccess(occupancy, today);
  if (currentMode === "moved_out" && occupancy.occupy_to === args.occupyTo) {
    return { occupancy, idempotent: true, leaseEnded: false };
  }
  if (currentMode === "moved_out") {
    throw new TenantLifecycleError("This resident has already moved out. Use correct to change the date.", 409);
  }

  const nextStatus: OccupancyStatus = args.occupyTo < today ? "moved_out" : "occupying";
  const { data: updated, error } = await args.supabase
    .from("lease_residents")
    .update({
      occupy_to: args.occupyTo,
      occupancy_status: nextStatus
    })
    .eq("id", occupancy.id)
    .select(
      "id, organization_id, lease_id, user_id, display_name, email, is_primary, financial_status, pm_resident_id, occupancy_status, occupy_from, occupy_to"
    )
    .single();
  if (error || !updated) {
    throw new TenantLifecycleError(error?.message ?? "Could not move out resident.", 400);
  }

  if (person) {
    await recomputePersonFromOccupancy(args.supabase, args.organizationId, person.id);
  }

  const { data: property } = await args.supabase
    .from("property_properties")
    .select("name")
    .eq("id", lease.property_id)
    .maybeSingle();
  const { data: unit } = await args.supabase
    .from("property_units")
    .select("unit_label")
    .eq("id", lease.unit_id)
    .maybeSingle();

  await emitLifecycle({
    supabase: args.supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    eventType: "tenant.moved_out",
    aggregateId: occupancy.id,
    payload: {
      tenantName: occupancy.display_name,
      propertyName: property?.name ?? null,
      unitLabel: unit?.unit_label ?? null,
      leaseId: lease.id,
      occupyTo: args.occupyTo,
      note: args.note ?? null,
      leaseEnded: false
    }
  });

  return {
    occupancy: updated as OccupancyRow,
    idempotent: false,
    leaseEnded: false,
    confirmation: {
      tenantName: occupancy.display_name,
      propertyName: (property?.name as string | undefined) ?? "Property",
      unitLabel: (unit?.unit_label as string | undefined) ?? "—",
      occupyTo: args.occupyTo
    }
  };
}

export async function cancelFutureMoveOut(args: {
  supabase: Db;
  organizationId: string;
  actorId: string;
  occupancyId: string;
}) {
  const { occupancy, person } = await loadOccupancyForManager(
    args.supabase,
    args.organizationId,
    args.occupancyId
  );
  const today = utcToday();
  if (!occupancy.occupy_to || occupancy.occupy_to < today) {
    throw new TenantLifecycleError("Only a future move-out can be cancelled.", 409);
  }

  const { data: updated, error } = await args.supabase
    .from("lease_residents")
    .update({ occupy_to: null, occupancy_status: "occupying" })
    .eq("id", occupancy.id)
    .select(
      "id, organization_id, lease_id, user_id, display_name, email, is_primary, financial_status, pm_resident_id, occupancy_status, occupy_from, occupy_to"
    )
    .single();
  if (error || !updated) {
    throw new TenantLifecycleError(error?.message ?? "Could not cancel move-out.", 400);
  }
  if (person) {
    await recomputePersonFromOccupancy(args.supabase, args.organizationId, person.id);
  }
  await emitLifecycle({
    supabase: args.supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    eventType: "tenant.move_out_cancelled",
    aggregateId: occupancy.id,
    payload: { previousOccupyTo: occupancy.occupy_to, tenantName: occupancy.display_name }
  });
  return { occupancy: updated as OccupancyRow };
}

export async function correctMoveOut(args: {
  supabase: Db;
  organizationId: string;
  actorId: string;
  occupancyId: string;
  occupyTo?: string | null;
  note?: string;
}) {
  const { occupancy, person } = await loadOccupancyForManager(
    args.supabase,
    args.organizationId,
    args.occupancyId
  );
  const today = utcToday();
  const nextOccupyTo = args.occupyTo === undefined ? null : args.occupyTo;
  const nextStatus: OccupancyStatus =
    nextOccupyTo && nextOccupyTo < today ? "moved_out" : "occupying";

  const { data: updated, error } = await args.supabase
    .from("lease_residents")
    .update({
      occupy_to: nextOccupyTo,
      occupancy_status: nextStatus
    })
    .eq("id", occupancy.id)
    .select(
      "id, organization_id, lease_id, user_id, display_name, email, is_primary, financial_status, pm_resident_id, occupancy_status, occupy_from, occupy_to"
    )
    .single();
  if (error || !updated) {
    throw new TenantLifecycleError(error?.message ?? "Could not correct move-out.", 400);
  }
  if (person) {
    await recomputePersonFromOccupancy(args.supabase, args.organizationId, person.id);
  }
  await emitLifecycle({
    supabase: args.supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    eventType: "tenant.move_out_corrected",
    aggregateId: occupancy.id,
    payload: {
      previousOccupyTo: occupancy.occupy_to,
      occupyTo: nextOccupyTo,
      note: args.note ?? null,
      tenantName: occupancy.display_name
    }
  });
  return { occupancy: updated as OccupancyRow };
}
