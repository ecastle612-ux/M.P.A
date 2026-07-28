import { redirect } from "next/navigation";
import { AcceptInvitationCard } from "../../../../components/auth/accept-invitation-card";
import { AuthBrandShell } from "../../../../components/branding/auth-brand-shell";
import { createAuthServerComponentClient } from "../../../../lib/auth/server";
import {
  getPrincipalByAuthSubject,
  requiresFirstLoginGate
} from "../../../../lib/auth/identity";

/**
 * AUTH-001 Slice A — invitation entrypoint hardening.
 * Accept path requires authentication; no public signup is offered.
 * Invitation row visibility follows existing RLS (recipient email / org capability).
 */
export default async function AcceptInvitationPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const trimmed = token.trim();
  if (!trimmed) {
    redirect(
      `/login?error=${encodeURIComponent("Invitation link is invalid. Accounts are invitation-only.")}`
    );
  }

  const supabase = await createAuthServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const next = encodeURIComponent(`/accept-invitation/${trimmed}`);
    redirect(
      `/login?notice=${encodeURIComponent("Sign in with your username to accept this invitation.")}&next=${next}`
    );
  }

  const principal = await getPrincipalByAuthSubject(user.id).catch(() => null);
  if (requiresFirstLoginGate(principal)) {
    redirect("/first-login");
  }

  const { data: invitation } = await supabase
    .from("organization_invitations")
    .select("id, status, expires_at")
    .eq("token", trimmed)
    .maybeSingle();

  if (!invitation) {
    redirect(
      `/login?error=${encodeURIComponent("Invitation not found or not addressed to this account.")}`
    );
  }

  if (invitation.status !== "pending") {
    redirect(
      `/login?error=${encodeURIComponent("This invitation is no longer available.")}`
    );
  }

  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    redirect(
      `/login?error=${encodeURIComponent("This invitation has expired. Request a new invitation.")}`
    );
  }

  return (
    <AuthBrandShell
      headline="Join your organization."
      support="Accept your invitation to collaborate in My Property Assistant."
    >
      <AcceptInvitationCard token={trimmed} />
    </AuthBrandShell>
  );
}
