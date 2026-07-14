import { AcceptInvitationCard } from "../../../../components/auth/accept-invitation-card";

export default async function AcceptInvitationPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <AcceptInvitationCard token={token} />
    </main>
  );
}
