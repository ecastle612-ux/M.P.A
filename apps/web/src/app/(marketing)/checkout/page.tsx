import type { Metadata } from "next";
import { CheckoutPage } from "../../../components/marketing/checkout-page";
import { createAuthServerClient } from "../../../lib/auth/server";

export const metadata: Metadata = {
  title: "Checkout — M.P.A.",
  description: "Confirm your M.P.A. plan selection and continue to account creation."
};

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return <CheckoutPage isAuthenticated={Boolean(user)} selectedSkuRaw={params.intent ?? null} />;
}
