import type { Metadata } from "next";
import { CommerceContinuePage } from "../../../../components/marketing/commerce-continue-page";
import { createAuthServerClient } from "../../../../lib/auth/server";

export const metadata: Metadata = {
  title: "Preparing your workspace — My Property Assistant",
  robots: { index: false, follow: false }
};

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ session_id?: string; bind_token?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return (
    <CommerceContinuePage
      sessionId={params.session_id ?? null}
      bindToken={params.bind_token ?? null}
      isAuthenticated={Boolean(user)}
      userEmail={user?.email ?? null}
    />
  );
}
