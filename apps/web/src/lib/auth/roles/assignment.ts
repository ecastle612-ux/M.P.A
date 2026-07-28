/**
 * AUTH-001 Slice D — internal role assignment / activation / disable.
 * Secret-free OPS events only. No Slice E recovery.
 */
import { isUserRole, type UserRole } from "@mpa/shared";
import { createServiceRoleServerClient } from "../server";
import { emitOpsDomainEvent } from "../../ops/emit";
import { isAssignableMembershipRole } from "./templates";
import { replaceMembershipPropertyScopes, roleRequiresPropertyScope } from "./property-scope";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function serviceClient(): AnyClient {
  const client = createServiceRoleServerClient();
  if (!client) throw new Error("Role assignment requires SUPABASE_SERVICE_ROLE_KEY");
  return client;
}

export type AssignRolesInput = {
  organizationId: string;
  targetUserId: string;
  roles: UserRole[];
  actorUserId: string;
  /** When true, actor is platform Master Admin (Level 0). */
  actorIsMasterAdmin?: boolean;
  propertyIds?: string[];
  status?: "active" | "inactive";
};

export type MembershipRoleResult = {
  membershipId: string;
  userId: string;
  organizationId: string;
  roles: UserRole[];
  status: "active" | "inactive";
  previousRoles: UserRole[];
};

async function loadActorMembership(
  admin: AnyClient,
  organizationId: string,
  actorUserId: string
): Promise<{ roles: UserRole[]; isOwner: boolean } | null> {
  const { data, error } = await admin
    .from("organization_memberships")
    .select("roles, is_owner, status")
    .eq("organization_id", organizationId)
    .eq("user_id", actorUserId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.status !== "active") return null;
  const roles = (Array.isArray(data.roles) ? data.roles : []).filter(
    (role: unknown): role is UserRole => isUserRole(role)
  );
  return { roles, isOwner: Boolean(data.is_owner) };
}

function assertAssignableRoles(roles: UserRole[]): void {
  if (roles.length === 0) throw new Error("At least one role is required.");
  for (const role of roles) {
    if (!isAssignableMembershipRole(role)) {
      throw new Error(`Role not assignable: ${role}`);
    }
  }
}

/**
 * Elevation bans:
 * - never invent master_admin membership
 * - cannot self-assign organization_admin
 * - only Org Admin (or Master Admin) may grant organization_admin
 * - property_manager with membership:update may assign non–org-admin catalog roles
 */
export function assertRoleAssignmentAllowed(input: {
  actorUserId: string;
  targetUserId: string;
  actorRoles: UserRole[];
  actorIsOwner: boolean;
  actorIsMasterAdmin: boolean;
  nextRoles: UserRole[];
}): void {
  assertAssignableRoles(input.nextRoles);

  if (input.nextRoles.some((role) => String(role) === "master_admin")) {
    throw new Error("Cannot grant master_admin as a membership role.");
  }

  const grantsOrgAdmin = input.nextRoles.includes("organization_admin");
  const actorIsOrgAdmin =
    input.actorIsMasterAdmin ||
    input.actorIsOwner ||
    input.actorRoles.includes("organization_admin");

  if (grantsOrgAdmin && input.actorUserId === input.targetUserId && !input.actorIsMasterAdmin) {
    throw new Error("Cannot self-elevate to Organization Administrator.");
  }

  if (grantsOrgAdmin && !actorIsOrgAdmin) {
    throw new Error("Only Organization Administrators may assign organization_admin.");
  }

  const canAssign =
    actorIsOrgAdmin ||
    input.actorRoles.includes("property_manager") ||
    input.actorIsMasterAdmin;

  if (!canAssign) {
    throw new Error("Forbidden: insufficient role to assign membership roles.");
  }
}

async function emitRoleEvent(
  admin: AnyClient,
  input: {
    organizationId: string;
    membershipId: string;
    userId: string;
    eventType:
      | "auth.role.assigned"
      | "auth.role.changed"
      | "auth.membership.activated"
      | "auth.membership.disabled";
    roles: string[];
    previousRoles?: string[];
    actorUserId: string;
  }
): Promise<void> {
  try {
    await emitOpsDomainEvent(
      admin,
      {
        eventType: input.eventType,
        organizationId: input.organizationId,
        subject: { type: "membership", id: input.membershipId },
        actor: { actor_type: "user", principal_id: input.actorUserId, label: "Role assignment" },
        summary: input.eventType.replace("auth.", "").replace(/\./g, " "),
        payload: {
          membershipId: input.membershipId,
          userId: input.userId,
          roles: input.roles,
          previousRoles: input.previousRoles ?? null
        },
        visibility: "staff_only",
        sensitivity: "normal"
      },
      { dispatchNow: true }
    );
  } catch {
    // Best-effort — assignment must not fail solely on emit.
  }
}

export async function assignMembershipRoles(input: AssignRolesInput): Promise<MembershipRoleResult> {
  const admin = serviceClient();
  const nextRoles = [...new Set(input.roles)].filter(isUserRole);
  assertAssignableRoles(nextRoles);

  const actor = input.actorIsMasterAdmin
    ? { roles: [] as UserRole[], isOwner: false }
    : await loadActorMembership(admin, input.organizationId, input.actorUserId);

  if (!input.actorIsMasterAdmin && !actor) {
    throw new Error("Actor is not an active member of this organization.");
  }

  assertRoleAssignmentAllowed({
    actorUserId: input.actorUserId,
    targetUserId: input.targetUserId,
    actorRoles: actor?.roles ?? [],
    actorIsOwner: actor?.isOwner ?? false,
    actorIsMasterAdmin: Boolean(input.actorIsMasterAdmin),
    nextRoles
  });

  const { data: existing, error: existingError } = await admin
    .from("organization_memberships")
    .select("id, roles, status")
    .eq("organization_id", input.organizationId)
    .eq("user_id", input.targetUserId)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  const previousRoles: UserRole[] = (Array.isArray(existing?.roles) ? existing.roles : []).filter(
    (role: unknown): role is UserRole => isUserRole(role)
  );
  const nextStatus = input.status ?? (existing?.status === "inactive" ? "inactive" : "active");

  const { data: upserted, error: upsertError } = await admin
    .from("organization_memberships")
    .upsert(
      {
        organization_id: input.organizationId,
        user_id: input.targetUserId,
        roles: nextRoles,
        status: nextStatus,
        updated_at: new Date().toISOString()
      },
      { onConflict: "organization_id,user_id" }
    )
    .select("id, roles, status, user_id, organization_id")
    .single();

  if (upsertError || !upserted) {
    throw new Error(upsertError?.message ?? "Failed to assign roles.");
  }

  const membershipId = String(upserted.id);

  if (roleRequiresPropertyScope(nextRoles)) {
    const propertyIds = input.propertyIds ?? [];
    if (propertyIds.length === 0) {
      throw new Error("Select at least one property for this role.");
    }
    await replaceMembershipPropertyScopes({
      organizationId: input.organizationId,
      membershipId,
      propertyIds
    });
  } else {
    // Clear leftover scopes when moving off a property-scoped role.
    await replaceMembershipPropertyScopes({
      organizationId: input.organizationId,
      membershipId,
      propertyIds: []
    });
  }

  const rolesChanged =
    previousRoles.length !== nextRoles.length ||
    previousRoles.some((role) => !nextRoles.includes(role)) ||
    nextRoles.some((role) => !previousRoles.includes(role));

  const eventType =
    previousRoles.length === 0
      ? "auth.role.assigned"
      : rolesChanged
        ? "auth.role.changed"
        : "auth.role.assigned";

  await emitRoleEvent(admin, {
    organizationId: input.organizationId,
    membershipId,
    userId: input.targetUserId,
    eventType,
    roles: nextRoles,
    previousRoles,
    actorUserId: input.actorUserId
  });

  if (existing?.status === "inactive" && nextStatus === "active") {
    await emitRoleEvent(admin, {
      organizationId: input.organizationId,
      membershipId,
      userId: input.targetUserId,
      eventType: "auth.membership.activated",
      roles: nextRoles,
      previousRoles,
      actorUserId: input.actorUserId
    });
  }

  return {
    membershipId,
    userId: input.targetUserId,
    organizationId: input.organizationId,
    roles: nextRoles,
    status: nextStatus,
    previousRoles
  };
}

export async function setMembershipStatus(input: {
  organizationId: string;
  targetUserId: string;
  status: "active" | "inactive";
  actorUserId: string;
  actorIsMasterAdmin?: boolean;
}): Promise<MembershipRoleResult> {
  const admin = serviceClient();
  const actor = input.actorIsMasterAdmin
    ? { roles: ["organization_admin"] as UserRole[], isOwner: true }
    : await loadActorMembership(admin, input.organizationId, input.actorUserId);

  if (!input.actorIsMasterAdmin && !actor) {
    throw new Error("Actor is not an active member of this organization.");
  }

  const actorIsOrgAdmin =
    Boolean(input.actorIsMasterAdmin) ||
    Boolean(actor?.isOwner) ||
    Boolean(actor?.roles.includes("organization_admin")) ||
    Boolean(actor?.roles.includes("property_manager"));

  if (!actorIsOrgAdmin) {
    throw new Error("Forbidden: cannot change membership status.");
  }

  if (input.status === "inactive" && input.actorUserId === input.targetUserId) {
    throw new Error("Cannot deactivate your own membership.");
  }

  const { data: existing, error } = await admin
    .from("organization_memberships")
    .select("id, roles, status, is_owner")
    .eq("organization_id", input.organizationId)
    .eq("user_id", input.targetUserId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!existing) throw new Error("Membership not found.");

  if (existing.is_owner && input.status === "inactive") {
    throw new Error("Cannot deactivate the primary Organization Administrator.");
  }

  const roles = (Array.isArray(existing.roles) ? existing.roles : []).filter(
    (role: unknown): role is UserRole => isUserRole(role)
  );

  const { data: updated, error: updateError } = await admin
    .from("organization_memberships")
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq("id", existing.id)
    .select("id, roles, status, user_id, organization_id")
    .single();

  if (updateError || !updated) {
    throw new Error(updateError?.message ?? "Failed to update membership status.");
  }

  await emitRoleEvent(admin, {
    organizationId: input.organizationId,
    membershipId: String(updated.id),
    userId: input.targetUserId,
    eventType: input.status === "active" ? "auth.membership.activated" : "auth.membership.disabled",
    roles,
    previousRoles: roles,
    actorUserId: input.actorUserId
  });

  return {
    membershipId: String(updated.id),
    userId: input.targetUserId,
    organizationId: input.organizationId,
    roles,
    status: input.status,
    previousRoles: roles
  };
}
