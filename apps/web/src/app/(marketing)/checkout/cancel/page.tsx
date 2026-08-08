import type { Metadata } from "next";
import { CheckoutCancelPage } from "../../../../components/marketing/checkout-cancel-page";
import { createAuthServerClient } from "../../../../lib/auth/server";

export const metadata: Metadata = {
  title: "Checkout Canceled — My Property Assistant",
  robots: { index: false, follow: false }
};

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ offer?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return <CheckoutCancelPage offerId={params.offer ?? null} isAuthenticated={Boolean(user)} />;
}
