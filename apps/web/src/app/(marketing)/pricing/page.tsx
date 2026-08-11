import type { Metadata } from "next";
import { PricingPage } from "../../../components/marketing/pricing-page";
import { PricingJsonLd } from "../../../components/marketing/pricing-json-ld";
import { createAuthServerClient } from "../../../lib/auth/server";

export const metadata: Metadata = {
  title: "Pricing — My Property Assistant",
  description:
    "Property Manager from $59/month for up to 500 managed units. Additional Unit Capacity +$39/month per 500 units. Facility Operations and Complete Platform are not online yet."
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
