import type { Metadata } from "next";
import { ComplimentaryClaimPage } from "../../../../components/complimentary/claim-page";
import { createAuthServerClient } from "../../../../lib/auth/server";

export const metadata: Metadata = {
  title: "Set up complimentary access — My Property Assistant",
  robots: { index: false, follow: false }
};

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return (
    <ComplimentaryClaimPage
      token={params.token ?? null}
      isAuthenticated={Boolean(user)}
      userEmail={user?.email ?? null}
    />
  );
}
