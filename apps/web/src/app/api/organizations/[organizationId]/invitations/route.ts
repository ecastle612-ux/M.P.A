import { NextResponse } from "next/server";
import {
  inviterMayGrantInvitation,
  isLaunchInviteRole,
  isMemberOperatingScope,
  isProductSku,
  validateInviteOperatingScope
} from "@mpa/shared";
import { parseInviteOrganizationMemberInput } from "../../../../../lib/organization/contracts";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import {
  evaluatePermission,
  resolveAuthorizationContext
} from "../../../../../lib/auth/authorization";
import {
  buildAcceptUrl,
  createAndSendInvitation,
  InvitationCreateError,
  INVITATION_ROW_COLUMNS,
  invitationNoticeCopy
} from "../../../../../lib/team/invitation-service";

async function requirePermission(
  supabase: Awaited<ReturnType<typeof createAuthServerClient>>,
  organizationId: string,
  capability: "invitation:create" | "invitation:read"
) {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  }

  const authorizationContext = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorizationContext, capability)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user };
}

function toInvitationJson(invitation: Record<string, unknown>) {
  const deliveryStatus = (invitation["delivery_status"] as string | null) ?? "pending";
  return {
    ...invitation,
    delivery_status: deliveryStatus,
    emailStatus: deliveryStatus,
    acceptUrl: invitation["status"] === "pending" ? buildAcceptUrl(invitation["token"] as string) : null
  };
}

export async function GET(_request: Request, context: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await context.params;
  const supabase = await createAuthServerClient();

  const authz = await requirePermission(supabase, organizationId, "invitation:read");
  if ("error" in authz) {
    return authz.error;
  }

  const { data, error } = await supabase
    .from("organization_invitations")
    .select(INVITATION_ROW_COLUMNS)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    invitations: (data ?? []).map((invitation) => toInvitationJson(invitation as Record<string, unknown>))
  });
}

export async function POST(request: Request, context: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await context.params;
  const supabase = await createAuthServerClient();

  const authz = await requirePermission(supabase, organizationId, "invitation:create");
  if ("error" in authz) {
    return authz.error;
  }

  const payload = await request.json().catch(() => null);
  const parsed = parseInviteOrganizationMemberInput(payload);

  if (!parsed) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!parsed.roles.every((role) => isLaunchInviteRole(role))) {
    return NextResponse.json(
      {
        error:
          "Invite role must be one of: Organization Admin, Property Manager, Leasing Agent, Maintenance Technician, Vendor, Owner"
      },
      { status: 400 }
    );
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
  const scopeDecision = validateInviteOperatingScope({
    sku,
    roles: parsed.roles,
    storedScope: parsed.operatingScope ?? null
  });
  if (!scopeDecision.ok) {
    return NextResponse.json({ error: scopeDecision.error }, { status: 400 });
  }

  const { data: inviterMembership } = await supabase
    .from("organization_memberships")
    .select("roles, operating_scope")
    .eq("organization_id", organizationId)
    .eq("user_id", authz.user.id)
    .eq("status", "active")
    .maybeSingle();

  const inviterScopeRaw = inviterMembership?.operating_scope;
  const inviterStoredScope = isMemberOperatingScope(inviterScopeRaw) ? inviterScopeRaw : null;
  const grantDecision = inviterMayGrantInvitation({
    sku,
    inviterRoles: (inviterMembership?.roles as string[] | undefined) ?? [],
    inviterStoredScope,
    grantRoles: parsed.roles,
    grantScope: scopeDecision.scope
  });
  if (!grantDecision.ok) {
    return NextResponse.json({ error: grantDecision.error }, { status: 403 });
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", organizationId)
    .maybeSingle();

  try {
    const result = await createAndSendInvitation({
      supabase,
      organizationId,
      actorId: authz.user.id,
      email: parsed.email,
      roles: parsed.roles,
      organizationName: organization?.name ?? "your organization",
      operatingScope: scopeDecision.scope,
      ...(authz.user.email ? { inviterLabel: authz.user.email } : {})
    });

    return NextResponse.json(
      {
        invitation: {
          ...toInvitationJson(result.invitation as Record<string, unknown>),
          acceptUrl: result.acceptUrl,
          roleLabel: result.roleLabel
        },
        acceptUrl: result.acceptUrl,
        emailStatus: result.emailStatus,
        deliveryStatus: result.deliveryStatus,
        notice: invitationNoticeCopy(result.emailStatus)
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof InvitationCreateError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invitation failed" },
      { status: 400 }
    );
  }
}
