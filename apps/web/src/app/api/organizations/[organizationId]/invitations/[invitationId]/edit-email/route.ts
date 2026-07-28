import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../../../lib/auth/server";
import {
  evaluatePermission,
  resolveAuthorizationContext
} from "../../../../../../../lib/auth/authorization";
import { editInvitationEmail } from "../../../../../../../lib/auth/invitations/service";

export async function POST(
  request: Request,
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

  const payload = await request.json().catch(() => null);
  const email =
    payload && typeof payload === "object" && typeof (payload as { email?: unknown }).email === "string"
      ? String((payload as { email: string }).email).trim().toLowerCase()
      : "";
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  try {
    const invitation = await editInvitationEmail(invitationId, email);
    if (invitation.organizationId !== organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ invitation });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Edit failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}