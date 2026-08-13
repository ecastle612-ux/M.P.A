import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  entitlementsForSku,
  hasEntitlement,
  isProductSku,
  type EntitlementKey,
  type MaintenanceCapability
} from "@mpa/shared";
import { createAuthServerClient } from "../auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../auth/authorization";
import { getActiveOrganizationIdFromCookie } from "../organization/server";

/**
 * Property Manager maintenance / vendor API gate.
 * Auth + active org membership + RBAC capability + module entitlement.
 * Fail closed — mirrors Facility Operations requireFacilityOperation (no entitlement redesign).
 */
export async function requireMaintenancePermission(
  capability: MaintenanceCapability,
  moduleEntitlement: EntitlementKey = "pm.maintenance",
  organizationId?: string
) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  }

  const orgId = organizationId ?? (await getActiveOrganizationIdFromCookie());
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

  const { data: subscription } = await supabase
    .from("organization_subscriptions")
    .select("sku_code, status")
    .eq("organization_id", orgId)
    .maybeSingle();

  const sku =
    subscription &&
    isProductSku(subscription.sku_code) &&
    subscription.status !== "canceled"
      ? subscription.sku_code
      : null;

  const granted = sku
    ? entitlementsForSku(sku)
    : (["platform.org", "platform.guided_setup", "platform.billing_self", "platform.launcher"] as const);

  if (!hasEntitlement(granted, moduleEntitlement)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { supabase: supabase as SupabaseClient<any>, user, organizationId: orgId };
}

export type MaintenanceAuthz = Exclude<
  Awaited<ReturnType<typeof requireMaintenancePermission>>,
  { error: NextResponse }
>;
