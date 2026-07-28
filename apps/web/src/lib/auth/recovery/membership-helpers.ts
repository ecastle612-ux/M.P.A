import { isUserRole, type UserRole } from "@mpa/shared";
import { createServiceRoleServerClient } from "../server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export function serviceClient(): AnyClient {
  const client = createServiceRoleServerClient();
  if (!client) throw new Error("Recovery services require SUPABASE_SERVICE_ROLE_KEY");
  return client;
}

export type MembershipRow = {
  id: string;
  user_id: string;
  organization_id: string;
  roles: UserRole[];
  status: string;
  is_owner: boolean;
};

export function isOrganizationAdminRoles(roles: UserRole[], isOwner: boolean): boolean {
  return isOwner || roles.includes("organization_admin") || roles.includes("property_manager");
}

export async function loadMembership(
  organizationId: string,
  userId: string
): Promise<MembershipRow | null> {
  const admin = serviceClient();
  const { data, error } = await admin
    .from("organization_memberships")
    .select("id, user_id, organization_id, roles, status, is_owner")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const roles = (Array.isArray(data.roles) ? data.roles : []).filter(
    (role: unknown): role is UserRole => isUserRole(role)
  );

  return {
    id: String(data.id),
    user_id: String(data.user_id),
    organization_id: String(data.organization_id),
    roles,
    status: String(data.status),
    is_owner: Boolean(data.is_owner)
  };
}

export async function assertActorIsOrgAdmin(
  organizationId: string,
  actorUserId: string,
  actorIsMasterAdmin = false
): Promise<MembershipRow | null> {
  if (actorIsMasterAdmin) return null;
  const membership = await loadMembership(organizationId, actorUserId);
  if (!membership || membership.status !== "active") {
    throw new Error("Actor is not an active member of this organization.");
  }
  if (!isOrganizationAdminRoles(membership.roles, membership.is_owner)) {
    throw new Error("Forbidden: Organization Administrator required.");
  }
  return membership;
}

export async function loadContactEmail(userId: string): Promise<string | null> {
  const admin = serviceClient();
  const { data } = await admin
    .from("user_profiles")
    .select("contact_email")
    .eq("user_id", userId)
    .maybeSingle();
  const email = typeof data?.contact_email === "string" ? data.contact_email.trim().toLowerCase() : "";
  return email.includes("@") ? email : null;
}

/** True when the auth user is an Org Admin / owner on any commercial organization. */
export async function isCommercialOrgAdminUser(userId: string): Promise<boolean> {
  const admin = serviceClient();
  const { data, error } = await admin
    .from("organization_memberships")
    .select("roles, is_owner, status")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) throw new Error(error.message);

  for (const row of data ?? []) {
    const roles = (Array.isArray(row.roles) ? row.roles : []).filter(
      (role: unknown): role is UserRole => isUserRole(role)
    );
    if (isOrganizationAdminRoles(roles, Boolean(row.is_owner))) {
      return true;
    }
  }
  return false;
}

export async function resolveUserIdByContactOrUsername(identifier: string): Promise<string | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;
  const admin = serviceClient();

  if (trimmed.includes("@")) {
    const { data: byEmail } = await admin
      .from("user_profiles")
      .select("user_id")
      .eq("contact_email", trimmed.toLowerCase())
      .maybeSingle();
    if (byEmail?.user_id) return String(byEmail.user_id);
  }

  const { data: principal } = await admin
    .from("identity_principals")
    .select("auth_provider_subject")
    .eq("username", trimmed.toLowerCase())
    .maybeSingle();

  return principal?.auth_provider_subject ? String(principal.auth_provider_subject) : null;
}
