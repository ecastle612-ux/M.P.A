import type { createAuthServerClient } from "../auth/server";

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerClient>>;

export type LinkedTenantSummary = {
  id: string;
  propertyId: string | null;
  unitId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  userId: string | null;
};

/**
 * Resolve the CRM tenant row for a portal user.
 * Prefers tenants.user_id; falls back to email match for legacy rows.
 */
export async function resolveLinkedTenantForUser(
  organizationId: string,
  userId: string,
  email: string | null | undefined,
  client: SupabaseClientType
): Promise<LinkedTenantSummary | null> {
  const { data: byUser } = await client
    .from("tenants")
    .select("id, property_id, unit_id, first_name, last_name, email, user_id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (byUser) {
    return {
      id: byUser.id as string,
      propertyId: (byUser.property_id as string | null) ?? null,
      unitId: (byUser.unit_id as string | null) ?? null,
      firstName: byUser.first_name as string,
      lastName: byUser.last_name as string,
      email: byUser.email as string,
      userId: (byUser.user_id as string | null) ?? null
    };
  }

  if (!email) return null;

  const { data: byEmail } = await client
    .from("tenants")
    .select("id, property_id, unit_id, first_name, last_name, email, user_id")
    .eq("organization_id", organizationId)
    .ilike("email", email)
    .is("deleted_at", null)
    .maybeSingle();

  if (!byEmail) return null;

  // Best-effort link for subsequent visits (ignore failures under RLS)
  if (!byEmail.user_id) {
    await client
      .from("tenants")
      .update({ user_id: userId, updated_by: userId })
      .eq("organization_id", organizationId)
      .eq("id", byEmail.id as string)
      .is("deleted_at", null);
  }

  return {
    id: byEmail.id as string,
    propertyId: (byEmail.property_id as string | null) ?? null,
    unitId: (byEmail.unit_id as string | null) ?? null,
    firstName: byEmail.first_name as string,
    lastName: byEmail.last_name as string,
    email: byEmail.email as string,
    userId: (byEmail.user_id as string | null) ?? userId
  };
}

export async function resolveTenantUserIds(
  organizationId: string,
  tenantId: string | null | undefined,
  client: SupabaseClientType
): Promise<string[]> {
  if (!tenantId) return [];
  const { data } = await client
    .from("tenants")
    .select("user_id")
    .eq("organization_id", organizationId)
    .eq("id", tenantId)
    .is("deleted_at", null)
    .maybeSingle();
  const userId = data?.user_id as string | null | undefined;
  return userId ? [userId] : [];
}
