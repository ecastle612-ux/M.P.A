import { NextResponse } from "next/server";
import { isLaunchInviteRole, isProductSku, validateInviteOperatingScope } from "@mpa/shared";
import { parseInviteOrganizationMemberInput } from "../../../../../lib/organization/contracts";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import {
  evaluatePermission,
  resolveAuthorizationContext
} from "../../../../../lib/auth/authorization";
import {
  buildAcceptUrl,
  createAndSendInvitation
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

export async function GET(_request: Request, context: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await context.params;
  const supabase = await createAuthServerClient();

  const authz = await requirePermission(supabase, organizationId, "invitation:read");
  if ("error" in authz) {
    return authz.error;
  }

  const { data, error } = await supabase
    .from("organization_invitations")
    .select(
      "id, email, roles, status, token, expires_at, created_at, email_status, email_sent_at, email_provider_id, email_error, operating_scope"
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    invitations: (data ?? []).map((invitation) => ({
      ...invitation,
      acceptUrl:
        invitation.status === "pending" ? buildAcceptUrl(invitation.token as string) : null
    }))
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
          ...result.invitation,
          acceptUrl: result.acceptUrl,
          roleLabel: result.roleLabel
        },
        acceptUrl: result.acceptUrl,
        emailStatus: result.emailStatus,
        notice:
          result.emailStatus === "sent"
            ? "Invitation email sent."
            : result.emailStatus === "failed"
              ? "Invitation created but email failed — copy the accept link."
              : "Invitation created. Copy the accept link (email provider not configured)."
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invitation failed" },
      { status: 400 }
    );
  }
}
