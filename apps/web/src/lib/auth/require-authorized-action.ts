import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  entitlementsForSku,
  hasEntitlement,
  isProductSku,
  type EntitlementKey,
  type PermissionCapability,
  type ProductSku,
  type UserRole
} from "@mpa/shared";
import { createAuthServerClient } from "./server";
import { evaluatePermission, resolveAuthorizationContext } from "./authorization";
import { getActiveOrganizationIdFromCookie } from "../organization/server";

export type AuthorizedAction = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>;
  user: User;
  organizationId: string;
  roles: string[];
  entitlements: readonly string[];
  sku: ProductSku | null;
  permissions: readonly string[];
};

export type AuthorizedActionResult = AuthorizedAction | { error: NextResponse };

/**
 * PLAT-002 / ADR-026 customer API pipeline (fail closed):
 * Authentication → Organization → Role → SKU entitlement → Module permission.
 * Action (surface, assignment, lease) stays in the route / service.
 */
export async function requireAuthorizedAction(input: {
  capability: PermissionCapability;
  entitlement: EntitlementKey | readonly EntitlementKey[];
  organizationId?: string | undefined;
  allowedRoles?: readonly UserRole[];
}): Promise<AuthorizedActionResult> {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  }

  const orgId = input.organizationId ?? (await getActiveOrganizationIdFromCookie());
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

  if (membershipError || !membership) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const roles = (membership.roles as string[]) ?? [];
  if (input.allowedRoles && !roles.some((role) => input.allowedRoles!.includes(role as UserRole))) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const { data: subscription } = await supabase
    .from("organization_subscriptions")
    .select("sku_code, status")
    .eq("organization_id", orgId)
    .maybeSingle();

  const sku =
    subscription && isProductSku(subscription.sku_code) && subscription.status !== "canceled"
      ? subscription.sku_code
      : null;

  const entitlements = sku
    ? entitlementsForSku(sku)
    : (["platform.org", "platform.guided_setup", "platform.billing_self", "platform.launcher"] as const);

  const required =
    typeof input.entitlement === "string" ? [input.entitlement] : [...input.entitlement];
  if (!required.every((key) => hasEntitlement(entitlements, key))) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const authorizationContext = await resolveAuthorizationContext(user, orgId);
  if (!evaluatePermission(authorizationContext, input.capability)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: supabase as SupabaseClient<any>,
    user,
    organizationId: orgId,
    roles,
    entitlements,
    sku,
    permissions: authorizationContext.permissions
  };
}
