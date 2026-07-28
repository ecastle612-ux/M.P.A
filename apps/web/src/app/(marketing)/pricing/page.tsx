import type { Metadata } from "next";
import { MarketingShell } from "../../../components/acquire/marketing-shell";
import { AcqFunnelPageView } from "../../../components/acquire/acq-funnel-page-view";
import { PricingExperience } from "../../../components/acquire/pricing-experience";
import { MPA_BRAND_NAME } from "../../../lib/branding";
import { ACQ_FUNNEL_EVENTS } from "../../../lib/acquire/funnel";
import {
  marketingOpenGraph,
  marketingRobots,
  marketingTwitter
} from "../../../lib/acquire/seo";

const title = "Pricing";
const description = `${MPA_BRAND_NAME} pricing for Trial, Professional, and Business. Enterprise contact sales. Compare seats, properties, and modules.`;

export const metadata: Metadata = {
  title,
  description,
  robots: marketingRobots(),
  alternates: { canonical: "/pricing" },
  openGraph: marketingOpenGraph({ title, description, path: "/pricing" }),
  twitter: marketingTwitter({ title, description })
};

export default function PricingPage() {
  return (
    <MarketingShell currentPath="/pricing">
      <AcqFunnelPageView eventName={ACQ_FUNNEL_EVENTS.pricingViewed} />
      <PricingExperience />
    </MarketingShell>
  );
}
