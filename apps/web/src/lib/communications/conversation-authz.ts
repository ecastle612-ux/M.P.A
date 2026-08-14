import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  entitlementsForSku,
  isProductSku,
  staffHasTenantCommsEntitlement,
  type CommunicationsCapability
} from "@mpa/shared";
import { createAuthServerClient } from "../auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../auth/authorization";
import { getActiveOrganizationIdFromCookie } from "../organization/server";
import { resolveActiveOrganizationIdForUser } from "../organization/resolve-active-organization";
import { requireCommunicationsPermission } from "./authz";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export type ConversationActor = {
  supabase: Db;
  user: User;
  organizationId: string;
  plane: "staff" | "tenant";
  tenantAccountId: string | null;
};

export async function loadOrgEntitlements(supabase: Db, organizationId: string): Promise<string[]> {
  const { data: subscription } = await supabase
    .from("organization_subscriptions")
    .select("sku_code, status")
    .eq("organization_id", organizationId)
    .maybeSingle();
  const sku =
    subscription && isProductSku(subscription.sku_code) && subscription.status !== "canceled"
      ? subscription.sku_code
      : null;
  return sku
    ? entitlementsForSku(sku)
    : ["platform.org", "platform.guided_setup", "platform.billing_self"];
}

export async function requireStaffConversationPermission(
  capability: CommunicationsCapability
): Promise<ConversationActor | { error: NextResponse }> {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  }

  const organizationId = await getActiveOrganizationIdFromCookie();
  if (!organizationId) {
    return { error: NextResponse.json({ error: "Organization required" }, { status: 400 }) };
  }

  const { data: membership } = await supabase
    .from("organization_memberships")
    .select("id, status, roles")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!membership) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const roles = (membership.roles as string[]) ?? [];
  const staffRoles = [
    "organization_admin",
    "property_manager",
    "leasing_agent",
    "maintenance_technician"
  ];
  if (!roles.some((role) => staffRoles.includes(role))) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const authorizationContext = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorizationContext, capability)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const entitlements = await loadOrgEntitlements(supabase, organizationId);
  if (!staffHasTenantCommsEntitlement(entitlements)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return {
    supabase: supabase as Db,
    user,
    organizationId,
    plane: "staff",
    tenantAccountId: null
  };
}

export async function requireTenantConversationActor(): Promise<
  ConversationActor | { error: NextResponse }
> {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  }

  const organizationId = await resolveActiveOrganizationIdForUser(supabase, user.id);
  if (!organizationId) {
    return { error: NextResponse.json({ error: "Organization required" }, { status: 400 }) };
  }

  const { data: residentRaw } = await supabase
    .from("pm_residents")
    .select("id, user_id, lease_id")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const resident = residentRaw as { id: string; user_id: string | null; lease_id: string | null } | null;

  if (!resident?.id || !resident.lease_id) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const { data: leaseResident } = await supabase
    .from("lease_residents")
    .select("id")
    .eq("lease_id", resident.lease_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!leaseResident) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return {
    supabase: supabase as Db,
    user,
    organizationId,
    plane: "tenant",
    tenantAccountId: resident.id
  };
}

export async function requireConversationMediaActor(mode: "read" | "write"): Promise<
  ConversationActor | { error: NextResponse }
> {
  const staff = await requireStaffConversationPermission(
    mode === "write" ? "platform.communications:write" : "platform.communications:read"
  );
  if (!("error" in staff)) return staff;

  if (staff.error.status === 401) return staff;
  return requireTenantConversationActor();
}

/**
 * Notification Center is the unified alert inbox (ADR-024 §4.3), not a messaging
 * surface. Staff keep existing communications:read access (finance / maintenance /
 * comms). Tenants may read and mark their own rows. FO without communications:read
 * and without a tenant lease still receives 403 — no FO tenant messaging.
 */
export async function requireNotificationCenterActor(): Promise<
  ConversationActor | { error: NextResponse }
> {
  const staff = await requireCommunicationsPermission("platform.communications:read");
  if ("error" in staff) {
    if (staff.error.status === 401) {
      return { error: staff.error };
    }
    return requireTenantConversationActor();
  }
  return {
    supabase: staff.supabase,
    user: staff.user,
    organizationId: staff.organizationId,
    plane: "staff",
    tenantAccountId: null
  };
}
