import { createServiceRoleServerClient } from "../auth/server";
import type { createAuthServerClient } from "../auth/server";

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerClient>>;
type LooseClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase builder chain
  from: (table: string) => any;
};

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

/**
 * Resolve the portal auth user for a CRM tenant.
 * Prefers tenants.user_id, then user_profiles.contact_email, then auth.users email (service role).
 * Best-effort backfills tenants.user_id when a match is found.
 */
export async function resolvePortalUserIdForTenant(
  organizationId: string,
  tenantId: string,
  client: SupabaseClientType | LooseClient,
  actorUserId?: string | null
): Promise<string | null> {
  const { data: tenant } = await client
    .from("tenants")
    .select("id, user_id, email")
    .eq("organization_id", organizationId)
    .eq("id", tenantId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!tenant) return null;

  const linkedUserId = (tenant.user_id as string | null | undefined) ?? null;
  if (linkedUserId) return linkedUserId;

  const email =
    typeof tenant.email === "string" && tenant.email.trim().length > 0
      ? tenant.email.trim()
      : null;
  if (!email) return null;

  const { data: profileRow } = await client
    .from("user_profiles")
    .select("user_id")
    .ilike("contact_email", email)
    .maybeSingle();

  let resolvedUserId = (profileRow?.user_id as string | null | undefined) ?? null;

  if (!resolvedUserId) {
    const service = createServiceRoleServerClient();
    if (service) {
      // RPC is service-role only; generated Database types may lag migrations.
      const { data: authUserId } = await (
        service as unknown as {
          rpc: (
            fn: "resolve_auth_user_id_by_email",
            args: { p_email: string }
          ) => Promise<{ data: string | null }>;
        }
      ).rpc("resolve_auth_user_id_by_email", { p_email: email });
      if (typeof authUserId === "string" && authUserId.length > 0) {
        resolvedUserId = authUserId;
      }
    }
  }

  if (!resolvedUserId) return null;

  // Best-effort link for subsequent sends / portal visits (ignore failures under RLS).
  await client
    .from("tenants")
    .update({
      user_id: resolvedUserId,
      updated_by: actorUserId ?? resolvedUserId
    })
    .eq("organization_id", organizationId)
    .eq("id", tenantId)
    .is("deleted_at", null)
    .is("user_id", null);

  return resolvedUserId;
}

export async function resolveTenantUserIds(
  organizationId: string,
  tenantId: string | null | undefined,
  client: SupabaseClientType,
  actorUserId?: string | null
): Promise<string[]> {
  if (!tenantId) return [];
  const userId = await resolvePortalUserIdForTenant(organizationId, tenantId, client, actorUserId);
  return userId ? [userId] : [];
}
