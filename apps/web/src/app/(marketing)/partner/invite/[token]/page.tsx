import type { Metadata } from "next";
import { PartnerInvitePage } from "../../../../../components/partners/partner-invite-page";
import { createAuthServerClient } from "../../../../../lib/auth/server";

export const metadata: Metadata = {
  title: "Partner invitation — My Property Assistant",
  robots: { index: false, follow: false }
};

export default async function Page({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return (
    <PartnerInvitePage
      token={token}
      isAuthenticated={Boolean(user)}
      userEmail={user?.email ?? null}
    />
  );
}
