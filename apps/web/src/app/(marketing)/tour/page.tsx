import type { Metadata } from "next";
import { MarketingShell } from "../../../components/acquire/marketing-shell";
import { ProductTour } from "../../../components/acquire/product-tour";
import { MPA_BRAND_NAME } from "../../../lib/branding";
import {
  marketingOpenGraph,
  marketingRobots,
  marketingTwitter
} from "../../../lib/acquire/seo";

const title = "Product tour";
const description = `Interactive tour of ${MPA_BRAND_NAME} — command center, portfolio, maintenance, facilities, and billing separation.`;

export const metadata: Metadata = {
  title,
  description,
  robots: marketingRobots(),
  alternates: { canonical: "/tour" },
  openGraph: marketingOpenGraph({ title, description, path: "/tour" }),
  twitter: marketingTwitter({ title, description })
};

export default function TourPage() {
  return (
    <MarketingShell currentPath="/tour">
      <ProductTour />
    </MarketingShell>
  );
}
