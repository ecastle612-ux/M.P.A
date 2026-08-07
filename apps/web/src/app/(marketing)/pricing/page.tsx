import type { Metadata } from "next";
import { PricingPage } from "../../../components/marketing/pricing-page";
import { createAuthServerClient } from "../../../lib/auth/server";

export const metadata: Metadata = {
  title: "Pricing — My Property Assistant",
  description:
    "Property Manager Professional and Business self-serve pricing. Facility Operations and Complete Platform are Enterprise."
};

type Search = {
  intent?: string;
  plan?: string;
  cycle?: string;
};

export default async function PricingRoute({
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
    <PricingPage
      isAuthenticated={Boolean(user)}
      selectedSkuRaw={params.intent ?? null}
      selectedPlanRaw={params.plan ?? null}
      selectedCycleRaw={params.cycle ?? null}
    />
  );
}
