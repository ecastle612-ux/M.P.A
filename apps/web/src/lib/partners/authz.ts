import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  entitlementsForMember,
  evaluateCapability,
  hasEntitlement,
  isMemberOperatingScope,
  isProductSku,
  type MemberOperatingScope,
  type PermissionCapability,
  type ProductSku
} from "@mpa/shared";
import { createAuthServerClient } from "../auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../auth/authorization";
import { getActiveOrganizationIdFromCookie } from "../organization/server";
import { loadPartnerDeps } from "./runtime";

export type PartnerAuthorizedAction = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>;
  user: User;
  organizationId: string;
  roles: string[];
  entitlements: readonly string[];
  sku: ProductSku | null;
  storedScope: MemberOperatingScope | null;
  permissions: readonly string[];
};

type PartnerAuthorizedResult = PartnerAuthorizedAction | { error: NextResponse };

async function requirePartnerServices(capability: "read" | "write"): Promise<PartnerAuthorizedResult> {
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
    .select("id, status, roles, operating_scope")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (membershipError || !membership) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const roles = (membership.roles as string[]) ?? [];
  const storedScope = isMemberOperatingScope(membership.operating_scope) ? membership.operating_scope : null;
  const { data: subscription } = await supabase
    .from("organization_subscriptions")
    .select("sku_code, status")
    .eq("organization_id", orgId)
    .maybeSingle();
  const sku =
    subscription && isProductSku(subscription.sku_code) && subscription.status !== "canceled"
      ? subscription.sku_code
      : null;

  const deps = await loadPartnerDeps();
  const partner = await deps.store.getPartnerByOrganization(orgId);
  if (!partner) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const entitlements = [
    ...entitlementsForMember({ sku, roles, storedScope }),
    "platform.partner_services"
  ];
  if (!hasEntitlement(entitlements, "platform.partner_services")) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const authorizationContext = await resolveAuthorizationContext(user, orgId);
  const partnerCapability: PermissionCapability =
    capability === "write" ? "partner.services:write" : "partner.services:read";
  const legacyCapability: PermissionCapability =
    capability === "write" ? "pm.maintenance:write" : "pm.maintenance:read";
  const allowed =
    evaluatePermission(authorizationContext, partnerCapability) ||
    evaluatePermission(authorizationContext, legacyCapability) ||
    evaluateCapability(authorizationContext.permissions, partnerCapability) ||
    evaluateCapability(authorizationContext.permissions, legacyCapability);
  if (!allowed) {
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
    storedScope,
    permissions: authorizationContext.permissions
  };
}

export async function requirePartnerServicesRead() {
  return requirePartnerServices("read");
}

export async function requirePartnerServicesWrite() {
  return requirePartnerServices("write");
}
