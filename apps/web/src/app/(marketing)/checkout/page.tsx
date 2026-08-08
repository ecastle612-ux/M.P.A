import type { Metadata } from "next";
import { CheckoutPage } from "../../../components/marketing/checkout-page";
import { createAuthServerClient } from "../../../lib/auth/server";

export const metadata: Metadata = {
  title: "Confirm Plan — My Property Assistant",
  description:
    "Confirm your platform and billing cycle, then continue to secure Stripe Checkout where self-service is supported."
};

type Search = {
  intent?: string;
  plan?: string;
  cycle?: string;
};

export default async function CheckoutRoute({
  searchParams
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <CheckoutPage
      isAuthenticated={Boolean(user)}
      selectedSkuRaw={params.intent ?? null}
      selectedPlanRaw={params.plan ?? null}
      selectedCycleRaw={params.cycle ?? null}
    />
  );
}
