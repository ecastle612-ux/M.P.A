import { NextResponse } from "next/server";
import { parseInviteOrganizationMemberInput } from "../../../../../lib/organization/contracts";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import {
  evaluatePermission,
  resolveAuthorizationContext
} from "../../../../../lib/auth/authorization";

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
    .select("id, email, roles, status, token, expires_at, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ invitations: data ?? [] });
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

  const { data, error } = await supabase
    .from("organization_invitations")
    .insert({
      organization_id: organizationId,
      email: parsed.email,
      roles: parsed.roles,
      invited_by: authz.user.id
    })
    .select("id, email, roles, status, token, expires_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (data?.token) {
    const { sendInvitationEmail } = await import("../../../../../lib/integrations/email/delivery");
    await sendInvitationEmail({
      organizationId,
      email: data.email as string,
      token: data.token as string,
      roles: Array.isArray(data.roles) ? (data.roles as string[]) : parsed.roles,
      invitationId: data.id as string
    }).catch(() => undefined);
  }

  return NextResponse.json({ invitation: data }, { status: 201 });
}
