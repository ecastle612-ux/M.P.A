import type { Metadata } from "next";
import { MarketingShell } from "../../../components/acquire/marketing-shell";
import { AcqFunnelPageView } from "../../../components/acquire/acq-funnel-page-view";
import { ModuleSelectionExperience } from "../../../components/acquire/module-selection-experience";
import { MPA_BRAND_NAME } from "../../../lib/branding";
import { ACQ_FUNNEL_EVENTS } from "../../../lib/acquire/funnel";
import {
  marketingOpenGraph,
  marketingRobots,
  marketingTwitter
} from "../../../lib/acquire/seo";

const title = "Choose what you're buying";
const description = `Compare ${MPA_BRAND_NAME} subscriptions: Property Manager (available now), Facility Operations (Coming Soon), and Complete Platform.`;

export const metadata: Metadata = {
  title,
  description,
  robots: marketingRobots(),
  alternates: { canonical: "/modules" },
  openGraph: marketingOpenGraph({ title, description, path: "/modules" }),
  twitter: marketingTwitter({ title, description })
};

export default function ModulesPage() {
  return (
    <MarketingShell currentPath="/modules">
      <AcqFunnelPageView eventName={ACQ_FUNNEL_EVENTS.modulesViewed} />
      <ModuleSelectionExperience />
    </MarketingShell>
  );
}
