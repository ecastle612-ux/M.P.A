import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import {
  getPrincipalByAuthSubject,
  requiresFirstLoginGate
} from "../../../../../lib/auth/identity";
import {
  acceptAndActivateInvitation,
  getInvitationPublicPreview
} from "../../../../../lib/auth/invitations/service";

/**
 * AUTH-001 Slice C — accept invitation and activate membership for provisioned invitee.
 * Public signup remains disabled; invitee must sign in with MPA-generated username.
 */
export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const preview = await getInvitationPublicPreview(token).catch(() => null);
  if (!preview) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }
  return NextResponse.json({ invitation: preview });
}

export async function POST(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const trimmed = token.trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Invitation token required" }, { status: 400 });
  }

  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error:
          "Sign in required with the username from your invitation email. Public registration is disabled."
      },
      { status: 401 }
    );
  }

  const principal = await getPrincipalByAuthSubject(user.id).catch(() => null);
  if (requiresFirstLoginGate(principal)) {
    return NextResponse.json(
      {
        error:
          "Complete first sign-in (temporary password change) before accepting invitations.",
        requiresFirstLogin: true
      },
      { status: 403 }
    );
  }

  try {
    const result = await acceptAndActivateInvitation({
      token: trimmed,
      authUserId: user.id
    });
    return NextResponse.json({
      ok: true,
      organizationId: result.organizationId
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not accept invitation.";
    const status =
      message.includes("expired") || message.includes("revoked")
        ? 410
        : message.includes("Sign in") || message.includes("Forbidden")
          ? 403
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
