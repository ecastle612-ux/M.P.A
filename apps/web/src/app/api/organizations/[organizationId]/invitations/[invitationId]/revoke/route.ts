import { NextResponse } from "next/server";
import {
  createAuthServerClient,
  createServiceRoleServerClient
} from "../../../../../../../lib/auth/server";
import {
  evaluatePermission,
  resolveAuthorizationContext
} from "../../../../../../../lib/auth/authorization";
import { revokeInvitation } from "../../../../../../../lib/auth/invitations/service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ organizationId: string; invitationId: string }> }
) {
  const { organizationId, invitationId } = await context.params;
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const authorizationContext = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorizationContext, "invitation:create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createServiceRoleServerClient();
  if (!admin) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
  const { data: row } = await admin
    .from("organization_invitations")
    .select("organization_id")
    .eq("id", invitationId)
    .maybeSingle();
  if (!row || String(row.organization_id) !== organizationId) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  try {
    await revokeInvitation(invitationId);
    return NextResponse.json({ ok: true, revoked: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Revoke failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
