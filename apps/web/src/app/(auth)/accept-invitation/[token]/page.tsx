import { AcceptInvitationCard } from "../../../../components/auth/accept-invitation-card";
import { AuthShell } from "../../../../components/auth/auth-shell";

export default async function AcceptInvitationPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <AuthShell
      title="Join your organization."
      subtitle="Accept the invitation to activate membership and enter the correct portal."
    >
      <AcceptInvitationCard token={token} />
    </AuthShell>
  );
}
