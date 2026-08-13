import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasEntitlement, type EntitlementKey, type PermissionCapability } from "@mpa/shared";
import { createAuthServerClient } from "../auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../auth/authorization";
import { getOrganizationCommercialState } from "../commercial/server";
import { getActiveOrganizationIdFromCookie } from "../organization/server";

/**
 * Facility Operations API gate (STAB-004).
 * Cookie org id is a hint only (STAB-001) — membership is verified.
 * Fail closed: unauthenticated → 401; missing membership/capability/entitlement → 403.
 */
export async function requireFacilityOperation(
  capability: PermissionCapability,
  facilityEntitlement: EntitlementKey
) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  }

  const orgId = await getActiveOrganizationIdFromCookie();
  if (!orgId) {
    return { error: NextResponse.json({ error: "Organization required" }, { status: 400 }) };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_memberships")
    .select("id, status, roles")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (membershipError) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  if (!membership) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const authorizationContext = await resolveAuthorizationContext(user, orgId);
  if (!evaluatePermission(authorizationContext, capability)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const commercial = await getOrganizationCommercialState(orgId);
  if (!hasEntitlement(commercial.entitlements, facilityEntitlement)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { supabase: supabase as SupabaseClient<any>, user, organizationId: orgId };
}

export type FacilityAuthz = Exclude<
  Awaited<ReturnType<typeof requireFacilityOperation>>,
  { error: NextResponse }
>;
