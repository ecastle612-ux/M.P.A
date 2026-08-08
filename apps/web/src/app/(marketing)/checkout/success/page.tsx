import type { Metadata } from "next";
import { CheckoutSuccessPage } from "../../../../components/marketing/checkout-success-page";
import { createAuthServerClient } from "../../../../lib/auth/server";

export const metadata: Metadata = {
  title: "Purchase Successful — My Property Assistant",
  description: "Your M.P.A. subscription payment was secured. Continue to create your account.",
  robots: { index: false, follow: false }
};

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return (
    <CheckoutSuccessPage
      sessionId={params.session_id ?? null}
      isAuthenticated={Boolean(user)}
    />
  );
}
