import { AcceptInvitationCard } from "../../../../components/auth/accept-invitation-card";
import { AuthBrandShell } from "../../../../components/branding/auth-brand-shell";

export default async function AcceptInvitationPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <AuthBrandShell
      headline="Join your organization."
      support="Accept your invitation to collaborate in My Property Assistant."
    >
      <AcceptInvitationCard token={token} />
    </AuthBrandShell>
  );
}
