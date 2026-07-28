import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "../../../components/acquire/marketing-shell";
import { AcqFunnelPageView } from "../../../components/acquire/acq-funnel-page-view";
import { MPA_BRAND_NAME } from "../../../lib/branding";
import { ACQ_FUNNEL_EVENTS } from "../../../lib/acquire/funnel";
import {
  marketingOpenGraph,
  marketingRobots,
  marketingTwitter
} from "../../../lib/acquire/seo";

const title = "Product overview";
const description = `How ${MPA_BRAND_NAME} helps property and facility operators run day-to-day work after a modular subscription.`;

export const metadata: Metadata = {
  title,
  description,
  robots: marketingRobots(),
  alternates: { canonical: "/overview" },
  openGraph: marketingOpenGraph({ title, description, path: "/overview" }),
  twitter: marketingTwitter({ title, description })
};

export default function OverviewPage() {
  return (
    <MarketingShell currentPath="/overview">
      <AcqFunnelPageView eventName={ACQ_FUNNEL_EVENTS.overviewViewed} />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Product overview</h1>
        <p className="mt-4 text-[var(--mpa-color-text-secondary)]">
          {MPA_BRAND_NAME} is a multi-tenant property and facility operations OS. You choose modules, purchase a
          private organization, become the Organization Administrator, invite your team within seat limits, and
          operate only the modules on your plan.
        </p>
        <ol className="mt-10 list-decimal space-y-6 pl-5 text-[var(--mpa-color-text-secondary)]">
          <li>
            <span className="font-medium text-[var(--mpa-color-text-primary)]">Choose modules</span> — Property
            Operations, Facility Operations, or both.
          </li>
          <li>
            <span className="font-medium text-[var(--mpa-color-text-primary)]">Subscribe</span> — Professional or
            Business via public pricing. Enterprise works with sales.
          </li>
          <li>
            <span className="font-medium text-[var(--mpa-color-text-primary)]">Provision</span> — After successful
            Checkout, we create your organization and admin credentials automatically.
          </li>
          <li>
            <span className="font-medium text-[var(--mpa-color-text-primary)]">Guided Setup</span> — Complete
            recovery contact and activation, then open Command Center.
          </li>
          <li>
            <span className="font-medium text-[var(--mpa-color-text-primary)]">Operate</span> — Maintenance,
            leasing, facilities, financials, and messaging according to entitlements.
          </li>
        </ol>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/modules"
            className="inline-flex h-11 items-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-semibold text-[var(--mpa-color-text-inverse)]"
          >
            Choose modules
          </Link>
          <Link
            href="/tour"
            className="inline-flex h-11 items-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] px-4 text-sm font-semibold"
          >
            Optional tour
          </Link>
        </div>
      </div>
    </MarketingShell>
  );
}
