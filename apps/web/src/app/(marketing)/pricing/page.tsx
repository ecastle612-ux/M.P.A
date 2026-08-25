import type { Metadata } from "next";
import { PricingPage } from "../../../components/marketing/pricing-page";
import { PricingJsonLd } from "../../../components/marketing/pricing-json-ld";
import { createAuthServerClient } from "../../../lib/auth/server";

export const metadata: Metadata = {
  title: "Pricing — My Property Assistant",
  description:
    "Property Manager and Facility Operations from $59/month, Complete Platform from $109/month. Property Manager and Complete include online rent collection — ACH, cards, and tenant AutoPay. Up to 500 managed units included."
};

type Search = {
  intent?: string;
  plan?: string;
  cycle?: string;
  units?: string;
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
    <>
      <PricingJsonLd />
      <PricingPage
        isAuthenticated={Boolean(user)}
        selectedSkuRaw={params.intent ?? null}
        selectedPlanRaw={params.plan ?? null}
        selectedCycleRaw={params.cycle ?? null}
        selectedUnitsRaw={params.units ?? null}
      />
    </>
  );
}
