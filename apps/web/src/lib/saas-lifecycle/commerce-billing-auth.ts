/**
 * STAB-001 — authenticated commerce mutations.
 * Cookie `mpa_active_organization_id` is a request hint only, never authority.
 */

import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import type { LifecycleSubscription } from "@mpa/shared";
import { createAuthServerClient } from "../auth/server";
import { ACTIVE_ORGANIZATION_COOKIE } from "../organization/contracts";
import { isOrganizationManager } from "../organization/server";
import { resolveLifecycleForOrganization } from "./resolve-lifecycle";

export type CommerceBillingAuth = {
  supabase: Awaited<ReturnType<typeof createAuthServerClient>>;
  user: User;
  organizationId: string;
  roles: string[];
  lifecycle: LifecycleSubscription;
};

function organizationIdFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${ACTIVE_ORGANIZATION_COOKIE}=([^;]+)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

/**
 * Authenticate → verify active membership → verify billing capability
 * (organization_admin | property_manager) → load org-scoped lifecycle.
 * Fail closed on any step.
 */
export async function requireCommerceBillingAuth(
  request: Request
): Promise<CommerceBillingAuth | { error: NextResponse }> {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };
  }

  const organizationId = organizationIdFromRequest(request);
  if (!organizationId) {
    return { error: NextResponse.json({ error: "missing_organization" }, { status: 400 }) };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_memberships")
    .select("roles, status")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (membershipError) {
    return { error: NextResponse.json({ error: "authorization_failed" }, { status: 403 }) };
  }

  if (!membership) {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }

  const roles = Array.isArray(membership.roles) ? (membership.roles as string[]) : [];
  // Existing billing/commercial authority: org managers (admin or property_manager).
  if (!isOrganizationManager(roles)) {
    return { error: NextResponse.json({ error: "forbidden_billing" }, { status: 403 }) };
  }

  const lifecycle = await resolveLifecycleForOrganization(organizationId, supabase);
  if (!lifecycle) {
    return { error: NextResponse.json({ error: "subscription_not_found" }, { status: 404 }) };
  }

  if (lifecycle.organizationId !== organizationId) {
    return { error: NextResponse.json({ error: "subscription_org_mismatch" }, { status: 403 }) };
  }

  return { supabase, user, organizationId, roles, lifecycle };
}
