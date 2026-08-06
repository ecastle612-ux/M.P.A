import { NextResponse } from "next/server";
import { isUserRole, primaryRole, toRoleLabel } from "@mpa/shared";
import { createAuthServerClient } from "../../../../lib/auth/server";

/** Public preview for accept page (token is the secret). */
export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const supabase = await createAuthServerClient();

  const { data: invitation, error } = await supabase
    .from("organization_invitations")
    .select("id, email, roles, status, expires_at, organization_id")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", invitation.organization_id)
    .maybeSingle();

  const roles = (invitation.roles as string[]).filter(isUserRole);
  const role = primaryRole(roles);

  return NextResponse.json({
    invitation: {
      email: invitation.email,
      status: invitation.status,
      expiresAt: invitation.expires_at,
      roleLabel: role ? toRoleLabel(role) : "Member",
      roles,
      organizationName: organization?.name ?? "Organization",
      expired: new Date(invitation.expires_at).getTime() < Date.now()
    }
  });
}
