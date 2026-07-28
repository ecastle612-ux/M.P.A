import { NextResponse } from "next/server";
import { parseInviteOrganizationMemberInput } from "../../../../../lib/organization/contracts";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import {
  evaluatePermission,
  resolveAuthorizationContext
} from "../../../../../lib/auth/authorization";
import { createAndDeliverInvitation } from "../../../../../lib/auth/invitations/service";
import { EntitlementGateError } from "../../../../../lib/saas/entitlement-gate";
import { apiError } from "../../../../../lib/api/http";

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
      "id, email, roles, status, token, expires_at, created_at, username, delivery_status, last_delivered_at, provisioned_user_id, property_ids"
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ invitations: data ?? [] });
}

/**
 * AUTH-001 Slice C — create invitation, provision invitee principal, deliver credentials.
 */
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

  try {
    const result = await createAndDeliverInvitation({
      organizationId,
      email: parsed.email,
      roles: parsed.roles,
      invitedBy: authz.user.id,
      ...(parsed.propertyIds !== undefined ? { propertyIds: parsed.propertyIds } : {})
    });

    return NextResponse.json(
      {
        invitation: {
          id: result.invitation.id,
          email: result.invitation.email,
          roles: result.invitation.roles,
          status: result.invitation.status,
          token: result.invitation.token,
          expires_at: result.invitation.expiresAt,
          username: result.invitation.username,
          delivery_status: result.invitation.deliveryStatus,
          property_ids: result.invitation.propertyIds
        },
        resent: result.resent
      },
      { status: result.resent ? 200 : 201 }
    );
  } catch (err) {
    if (err instanceof EntitlementGateError) {
      return apiError(err.denial.httpStatus, err.denial.code.toUpperCase(), err.denial.message);
    }
    const message = err instanceof Error ? err.message : "Failed to create invitation";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
