import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  entitlementsForMember,
  isMemberOperatingScope,
  isProductSku,
  PM_COMMS_STAFF_ROLES,
  type CommunicationsCapability
} from "@mpa/shared";
import { createAuthServerClient } from "../auth/server";
import { resolveActiveOrganizationIdForUser } from "../organization/resolve-active-organization";
import { requireAuthorizedAction } from "../auth/require-authorized-action";
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

export async function loadOrgEntitlements(
  supabase: Db,
  organizationId: string,
  userId?: string
): Promise<string[]> {
  const { data: subscription } = await supabase
    .from("organization_subscriptions")
    .select("sku_code, status")
    .eq("organization_id", organizationId)
    .maybeSingle();
  const sku =
    subscription && isProductSku(subscription.sku_code) && subscription.status !== "canceled"
      ? subscription.sku_code
      : null;

  let roles: string[] = [];
  let storedScope: Parameters<typeof entitlementsForMember>[0]["storedScope"] = null;
  if (userId) {
    const { data: membership } = await supabase
      .from("organization_memberships")
      .select("roles, operating_scope")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();
    roles = Array.isArray(membership?.roles) ? (membership.roles as string[]) : [];
    storedScope = isMemberOperatingScope(membership?.operating_scope) ? membership.operating_scope : null;
  }

  return entitlementsForMember({ sku, roles, storedScope });
}

export async function requireStaffConversationPermission(
  capability: CommunicationsCapability
): Promise<ConversationActor | { error: NextResponse }> {
  const result = await requireAuthorizedAction({
    capability,
    entitlement: ["platform.communications", "pm.portal_tenant"],
    allowedRoles: [...PM_COMMS_STAFF_ROLES]
  });
  if ("error" in result) {
    return result;
  }

  return {
    supabase: result.supabase,
    user: result.user,
    organizationId: result.organizationId,
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
