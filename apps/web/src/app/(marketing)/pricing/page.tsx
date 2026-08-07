import type { Metadata } from "next";
import { PricingPage } from "../../../components/marketing/pricing-page";
import { createAuthServerClient } from "../../../lib/auth/server";

export const metadata: Metadata = {
  title: "Pricing — M.P.A.",
  description: "Compare M.P.A. commercial subscriptions and continue to checkout."
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
  return <PricingPage isAuthenticated={Boolean(user)} selectedSkuRaw={params.intent ?? null} />;
}
