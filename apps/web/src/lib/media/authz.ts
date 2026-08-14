import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isMediaEntityType, type MediaEntityType } from "@mpa/shared";
import { createAuthServerClient } from "../auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../auth/authorization";
import { getActiveOrganizationIdFromCookie } from "../organization/server";
import { getWorkOrder } from "../maintenance/maintenance-service";
import { hasEntitlement, entitlementsForSku, isProductSku } from "@mpa/shared";

export type MediaAuthzContext = {
  supabase: SupabaseClient;
  user: User;
  organizationId: string;
  roles: string[];
};

/**
 * Shared media gate: auth + org membership + maintenance/media permissions.
 * Does not broaden RBAC — reuses pm.maintenance:* for maintenance attachments.
 */
export async function requireMediaActor(mode: "read" | "write"): Promise<
  MediaAuthzContext | { error: NextResponse }
> {
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

  const capability = mode === "write" ? "pm.maintenance:write" : "pm.maintenance:read";
  const authorizationContext = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorizationContext, capability)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  // Entitlement: FO operations OR PM maintenance product access.
  const { data: subscription } = await supabase
    .from("organization_subscriptions")
    .select("sku_code, status")
    .eq("organization_id", organizationId)
    .maybeSingle();

  const sku =
    subscription && isProductSku(subscription.sku_code) && subscription.status !== "canceled"
      ? subscription.sku_code
      : null;
  const entitlements = sku
    ? entitlementsForSku(sku)
    : (["platform.org", "platform.guided_setup", "platform.billing_self"] as const);

  const entitled =
    hasEntitlement(entitlements, "facility.operations") ||
    hasEntitlement(entitlements, "pm.maintenance");
  if (!entitled) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: supabase as SupabaseClient<any>,
    user,
    organizationId,
    roles: (membership.roles as string[]) ?? []
  };
}

export async function assertMediaEntityAccess(input: {
  supabase: SupabaseClient;
  organizationId: string;
  relatedEntityType: MediaEntityType;
  relatedEntityId: string | null;
  conversationActor?: { plane: "staff" | "tenant"; tenantAccountId: string | null };
}): Promise<{ ok: true } | { error: NextResponse }> {
  if (!input.relatedEntityId) {
    return { ok: true };
  }
  if (input.relatedEntityType === "maintenance") {
    const workOrder = await getWorkOrder(
      input.supabase,
      input.organizationId,
      input.relatedEntityId
    );
    if (!workOrder) {
      return { error: NextResponse.json({ error: "Work order not found" }, { status: 404 }) };
    }
    return { ok: true };
  }
  if (input.relatedEntityType === "conversation_message") {
    const { canReadConversationMessageMedia } = await import("../communications/conversation-service");
    const allowed = await canReadConversationMessageMedia(
      input.supabase,
      {
        organizationId: input.organizationId,
        plane: input.conversationActor?.plane ?? "staff",
        tenantAccountId: input.conversationActor?.tenantAccountId ?? null
      },
      input.relatedEntityId
    );
    if (!allowed) {
      return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
    return { ok: true };
  }
  // Other entity types reserved.
  if (!isMediaEntityType(input.relatedEntityType)) {
    return { error: NextResponse.json({ error: "Unsupported entity type" }, { status: 400 }) };
  }
  return { ok: true };
}

export function isOrgManagerRoles(roles: readonly string[]): boolean {
  return roles.includes("organization_admin") || roles.includes("property_manager");
}

export async function resolveMediaActorForEntity(
  mode: "read" | "write",
  relatedEntityType: MediaEntityType
) {
  if (relatedEntityType === "conversation_message") {
    const { requireConversationMediaActor } = await import("../communications/conversation-authz");
    return requireConversationMediaActor(mode);
  }
  return requireMediaActor(mode);
}

export async function resolveMediaActorWithFallback(mode: "read" | "write") {
  const staff = await requireMediaActor(mode);
  if (!("error" in staff)) {
    return { ...staff, plane: "staff" as const, tenantAccountId: null };
  }
  if (staff.error.status === 401) return staff;
  const { requireConversationMediaActor } = await import("../communications/conversation-authz");
  const conversation = await requireConversationMediaActor(mode);
  if ("error" in conversation) return conversation;
  return { ...conversation, roles: [] as string[] };
}
