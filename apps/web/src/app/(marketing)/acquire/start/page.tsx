import type { Metadata } from "next";
import { MarketingShell } from "../../../../components/acquire/marketing-shell";
import { CheckoutIntentForm } from "../../../../components/acquire/checkout-intent-form";
import { ACQ_DEFAULT_BILLING_INTERVAL } from "../../../../lib/acquire/decisions";
import type { SaasBillingInterval } from "../../../../lib/integrations/saas-billing/contracts";
import { MPA_BRAND_NAME } from "../../../../lib/branding";

export const metadata: Metadata = {
  title: "Continue to Checkout",
  description: `Confirm your ${MPA_BRAND_NAME} plan before secure Stripe Checkout.`,
  robots: { index: false, follow: false },
  alternates: { canonical: "/acquire/start" }
};

export default async function AcquireStartPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const plan = typeof params["plan"] === "string" ? params["plan"] : "professional";
  const intervalRaw = typeof params["interval"] === "string" ? params["interval"] : ACQ_DEFAULT_BILLING_INTERVAL;
  const interval: SaasBillingInterval = intervalRaw === "year" ? "year" : "month";
  const modules = typeof params["modules"] === "string" ? params["modules"] : null;

  return (
    <MarketingShell>
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16">
        <CheckoutIntentForm plan={plan} interval={interval} modules={modules} />
      </div>
    </MarketingShell>
  );
}
