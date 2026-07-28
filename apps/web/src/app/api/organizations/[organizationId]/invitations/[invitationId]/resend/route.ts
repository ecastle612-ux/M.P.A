import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../../../lib/auth/server";
import {
  evaluatePermission,
  resolveAuthorizationContext
} from "../../../../../../../lib/auth/authorization";
import { resendInvitation } from "../../../../../../../lib/auth/invitations/service";

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

  try {
    const invitation = await resendInvitation(invitationId);
    if (invitation.organizationId !== organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ invitation, resent: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Resend failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
