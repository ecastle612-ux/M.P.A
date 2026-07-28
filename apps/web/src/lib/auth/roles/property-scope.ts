import { isPropertyScopedRole, type UserRole } from "@mpa/shared";
import { createServiceRoleServerClient } from "../server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function serviceClient(): AnyClient {
  const client = createServiceRoleServerClient();
  if (!client) throw new Error("Property scopes require SUPABASE_SERVICE_ROLE_KEY");
  return client;
}

export function roleRequiresPropertyScope(roles: readonly string[]): boolean {
  return roles.some((role) => isPropertyScopedRole(role));
}

export async function listMembershipPropertyIds(membershipId: string): Promise<string[]> {
  const admin = serviceClient();
  const { data, error } = await admin
    .from("membership_property_scopes")
    .select("property_id")
    .eq("membership_id", membershipId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: { property_id: string }) => row.property_id);
}

/**
 * Fail closed: property-scoped roles with zero scopes cannot access property-bound resources.
 */
export async function assertMembershipPropertyAccess(input: {
  membershipId: string;
  roles: readonly UserRole[];
  propertyId: string;
}): Promise<void> {
  if (!roleRequiresPropertyScope(input.roles)) return;
  const ids = await listMembershipPropertyIds(input.membershipId);
  if (ids.length === 0) {
    throw new Error("PROPERTY_SCOPE_REQUIRED");
  }
  if (!ids.includes(input.propertyId)) {
    throw new Error("PROPERTY_SCOPE_DENIED");
  }
}

export async function replaceMembershipPropertyScopes(input: {
  organizationId: string;
  membershipId: string;
  propertyIds: string[];
}): Promise<void> {
  const admin = serviceClient();
  const { error: deleteError } = await admin
    .from("membership_property_scopes")
    .delete()
    .eq("membership_id", input.membershipId);
  if (deleteError) throw new Error(deleteError.message);

  const unique = [...new Set(input.propertyIds.filter(Boolean))];
  if (unique.length === 0) return;

  const { error: insertError } = await admin.from("membership_property_scopes").insert(
    unique.map((propertyId) => ({
      organization_id: input.organizationId,
      membership_id: input.membershipId,
      property_id: propertyId
    }))
  );
  if (insertError) throw new Error(insertError.message);
}

/**
 * Ensures every propertyId belongs to the organization (fail closed).
 */
export async function assertOrganizationPropertyIds(input: {
  organizationId: string;
  propertyIds: string[];
}): Promise<string[]> {
  const unique = [...new Set(input.propertyIds.filter(Boolean))];
  if (unique.length === 0) return [];

  const admin = serviceClient();
  const { data, error } = await admin
    .from("properties")
    .select("id")
    .eq("organization_id", input.organizationId)
    .is("deleted_at", null)
    .in("id", unique);

  if (error) throw new Error(error.message);

  const found = new Set((data ?? []).map((row: { id: string }) => row.id));
  const missing = unique.filter((id) => !found.has(id));
  if (missing.length > 0) {
    throw new Error("One or more properties are not in this organization.");
  }
  return unique;
}

export function requirePropertyIdsForScopedRoles(input: {
  roles: readonly string[];
  propertyIds: string[] | undefined;
}): string[] {
  if (!roleRequiresPropertyScope(input.roles)) {
    return [];
  }
  const ids = [...new Set((input.propertyIds ?? []).filter(Boolean))];
  if (ids.length === 0) {
    throw new Error("Select at least one property for this role.");
  }
  return ids;
}
