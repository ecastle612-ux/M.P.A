import type { Metadata } from "next";
import { MarketingShell } from "../../../components/acquire/marketing-shell";
import { AcqFunnelPageView } from "../../../components/acquire/acq-funnel-page-view";
import { PricingExperience } from "../../../components/acquire/pricing-experience";
import { MPA_BRAND_NAME } from "../../../lib/branding";
import { ACQ_FUNNEL_EVENTS } from "../../../lib/acquire/funnel";
import { parseAcqModuleSelection } from "../../../lib/acquire/modules";
import {
  marketingOpenGraph,
  marketingRobots,
  marketingTwitter
} from "../../../lib/acquire/seo";
import { ACQ_DEFAULT_BILLING_INTERVAL } from "../../../lib/acquire/decisions";
import type { SaasBillingInterval } from "../../../lib/integrations/saas-billing/contracts";

const title = "Pricing";
const description = `${MPA_BRAND_NAME} pricing for Professional and Business after module selection. Enterprise contact sales.`;

export const metadata: Metadata = {
  title,
  description,
  robots: marketingRobots(),
  alternates: { canonical: "/pricing" },
  openGraph: marketingOpenGraph({ title, description, path: "/pricing" }),
  twitter: marketingTwitter({ title, description })
};

export default async function PricingPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const modules = parseAcqModuleSelection(params["modules"]);
  const intervalRaw =
    typeof params["interval"] === "string" ? params["interval"] : ACQ_DEFAULT_BILLING_INTERVAL;
  const interval: SaasBillingInterval = intervalRaw === "year" ? "year" : "month";

  return (
    <MarketingShell currentPath="/pricing">
      {modules ? (
        <AcqFunnelPageView
          eventName={ACQ_FUNNEL_EVENTS.pricingViewed}
          props={{ module_selection: modules }}
        />
      ) : (
        <AcqFunnelPageView eventName={ACQ_FUNNEL_EVENTS.pricingViewed} />
      )}
      <PricingExperience initialInterval={interval} initialModules={modules} />
    </MarketingShell>
  );
}
