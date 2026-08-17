import { NextResponse } from "next/server";
import {
  isMemberOperatingScope,
  isProductSku,
  roleAllowsOperatingScope,
  validateInviteOperatingScope,
  wouldLeaveCompleteWithoutBothAdmin,
  wouldLeaveOrganizationWithoutActiveAdmin
} from "@mpa/shared";
import { parseUpdateOrganizationMembershipInput } from "../../../../../lib/organization/contracts";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import {
  evaluatePermission,
  resolveAuthorizationContext
} from "../../../../../lib/auth/authorization";
import { recordOperatingScopeEvent } from "../../../../../lib/organization/operating-scope-events";

async function requireMembership(
  supabase: Awaited<ReturnType<typeof createAuthServerClient>>,
  organizationId: string
) {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  }

  const authorizationContext = await resolveAuthorizationContext(user, organizationId);
  const canReadMemberships = evaluatePermission(authorizationContext, "membership:read");
  const canUpdateMemberships = evaluatePermission(authorizationContext, "membership:update");
  if (!canReadMemberships && !canUpdateMemberships) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user, canReadMemberships, canUpdateMemberships };
}

export async function GET(_request: Request, context: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await context.params;
  const supabase = await createAuthServerClient();

  const authz = await requireMembership(supabase, organizationId);
  if ("error" in authz) {
    return authz.error;
  }
  if (!authz.canReadMemberships) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("organization_memberships")
    .select("id, user_id, roles, status, created_at, operating_scope")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    memberships: data ?? [],
    canUpdateMemberships: authz.canUpdateMemberships
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await context.params;
  const supabase = await createAuthServerClient();
  const authz = await requireMembership(supabase, organizationId);
  if ("error" in authz) {
    return authz.error;
  }
  if (!authz.canUpdateMemberships) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = parseUpdateOrganizationMembershipInput(payload);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { data: current, error: currentError } = await supabase
    .from("organization_memberships")
    .select("id, user_id, roles, status, operating_scope")
    .eq("organization_id", organizationId)
    .eq("id", parsed.membershipId)
    .maybeSingle();
  if (currentError || !current) {
    return NextResponse.json({ error: currentError?.message ?? "Membership not found" }, { status: 400 });
  }

  const { data: subscription } = await supabase
    .from("organization_subscriptions")
    .select("sku_code, status")
    .eq("organization_id", organizationId)
    .maybeSingle();
  const sku =
    subscription && isProductSku(subscription.sku_code) && subscription.status !== "canceled"
      ? subscription.sku_code
      : null;

  const nextRoles = parsed.roles ?? ((current.roles as string[]) ?? []);
  const nextStatus = parsed.status ?? (current.status as "active" | "inactive");
  const currentScope = isMemberOperatingScope(current.operating_scope) ? current.operating_scope : null;
  let nextScope = parsed.operatingScope !== undefined ? parsed.operatingScope : currentScope;

  if (parsed.operatingScope !== undefined) {
    const scopeDecision = validateInviteOperatingScope({
      sku,
      roles: nextRoles,
      storedScope: nextScope
    });
    if (!scopeDecision.ok) {
      return NextResponse.json({ error: scopeDecision.error }, { status: 400 });
    }
    nextScope = scopeDecision.scope;
  } else if (nextScope) {
    const assignedScope = nextScope;
    const staffRoles = nextRoles.filter((role) =>
      ["organization_admin", "property_manager", "leasing_agent", "maintenance_technician"].includes(role)
    );
    if (staffRoles.some((role) => !roleAllowsOperatingScope(role, assignedScope))) {
      return NextResponse.json(
        { error: "Leasing Agent can only operate Property Operations." },
        { status: 400 }
      );
    }
  }

  const { data: adminRows } = await supabase
    .from("organization_memberships")
    .select("id, roles, status, operating_scope")
    .eq("organization_id", organizationId);

  if (
    wouldLeaveCompleteWithoutBothAdmin({
      sku,
      admins: (adminRows ?? []).map((row) => ({
        id: row.id as string,
        roles: (row.roles as string[]) ?? [],
        storedScope: isMemberOperatingScope(row.operating_scope) ? row.operating_scope : null,
        status: row.status as string
      })),
      targetMembershipId: parsed.membershipId,
      nextScope,
      nextStatus,
      nextRoles
    })
  ) {
    return NextResponse.json(
      { error: "Complete must keep at least one Organization Admin with Both operational responsibility." },
      { status: 400 }
    );
  }

  if (
    wouldLeaveOrganizationWithoutActiveAdmin({
      members: (adminRows ?? []).map((row) => ({
        id: row.id as string,
        roles: (row.roles as string[]) ?? [],
        status: row.status as string
      })),
      targetMembershipId: parsed.membershipId,
      nextStatus
    })
  ) {
    return NextResponse.json(
      { error: "An organization must keep at least one active Organization Admin." },
      { status: 400 }
    );
  }

  const updateData: {
    roles?: string[];
    status?: "active" | "inactive";
    operating_scope?: "property_operations" | "facility_operations" | "both" | null;
  } = {};
  if (parsed.roles) {
    updateData.roles = parsed.roles;
  }
  if (parsed.status) {
    updateData.status = parsed.status;
  }
  if (parsed.operatingScope !== undefined) {
    updateData.operating_scope = nextScope;
  }

  const { data, error } = await supabase
    .from("organization_memberships")
    .update(updateData)
    .eq("organization_id", organizationId)
    .eq("id", parsed.membershipId)
    .select("id, user_id, roles, status, operating_scope")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (parsed.operatingScope !== undefined && currentScope !== nextScope) {
    try {
      await recordOperatingScopeEvent({
        supabase,
        organizationId,
        actorId: authz.user.id,
        membershipId: parsed.membershipId,
        fromScope: currentScope,
        toScope: nextScope,
        reason: "membership.updated"
      });
    } catch (eventError) {
      return NextResponse.json(
        { error: eventError instanceof Error ? eventError.message : "Failed to record scope change" },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ membership: data });
}
