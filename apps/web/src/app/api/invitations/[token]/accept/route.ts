import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";

export async function POST(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const supabase = await createAuthServerClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { data: invitation, error: invitationError } = await supabase
    .from("organization_invitations")
    .select("id, organization_id, email, roles, status, expires_at")
    .eq("token", token)
    .eq("status", "pending")
    .maybeSingle();

  if (invitationError) {
    return NextResponse.json({ error: invitationError.message }, { status: 400 });
  }
  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }
  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "Invitation expired" }, { status: 410 });
  }

  const { error: membershipError } = await supabase.from("organization_memberships").upsert(
    {
      organization_id: invitation.organization_id,
      user_id: user.id,
      roles: invitation.roles,
      status: "active"
    },
    { onConflict: "organization_id,user_id" }
  );

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 400 });
  }

  const { error: invitationUpdateError } = await supabase
    .from("organization_invitations")
    .update({
      status: "accepted",
      accepted_by: user.id,
      accepted_at: new Date().toISOString()
    })
    .eq("id", invitation.id);

  if (invitationUpdateError) {
    return NextResponse.json({ error: invitationUpdateError.message }, { status: 400 });
  }

  const roles = Array.isArray(invitation.roles) ? invitation.roles : [];
  if (roles.includes("tenant")) {
    await supabase
      .from("tenants")
      .update({ user_id: user.id, updated_by: user.id })
      .eq("organization_id", invitation.organization_id)
      .ilike("email", user.email)
      .is("deleted_at", null)
      .is("user_id", null);
  }

  return NextResponse.json({
    ok: true,
    organizationId: invitation.organization_id
  });
}
