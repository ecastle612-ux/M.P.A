import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "../../components/acquire/marketing-shell";
import { AcqFunnelPageView } from "../../components/acquire/acq-funnel-page-view";
import { MPA_BRAND_NAME } from "../../lib/branding";
import { ACQ_FUNNEL_EVENTS } from "../../lib/acquire/funnel";
import {
  landingSoftwareApplicationJsonLd,
  marketingOpenGraph,
  marketingRobots,
  marketingTwitter
} from "../../lib/acquire/seo";
import { PLAN_DISPLAY } from "../../lib/saas/plan-display";
import { listPriceForModules } from "../../lib/acquire/catalog";

const title = "Property & facility operations platform";
const description = `${MPA_BRAND_NAME} runs property and facility operations in one modular subscription — from purchase to daily work.`;

export const metadata: Metadata = {
  title,
  description,
  robots: marketingRobots(),
  alternates: { canonical: "/" },
  openGraph: marketingOpenGraph({ title, description, path: "/" }),
  twitter: marketingTwitter({ title, description })
};

const CAPABILITIES = [
  {
    title: "Property Operations",
    body: "Portfolio, leasing, residents, maintenance, and vendor handoffs in one workspace."
  },
  {
    title: "Facility Operations",
    body: "Preventive maintenance, inspections, inventory, and floor work without a second system."
  },
  {
    title: "Team & accountability",
    body: "Private organization, invitation-only seats, and clear ownership on every work item."
  },
  {
    title: "Guided go-live",
    body: "Checkout provisions your org and admin access, then Guided Setup opens Command Center."
  }
] as const;

const STEPS = [
  {
    title: "Choose modules",
    body: "Property Operations, Facility Operations, or both."
  },
  {
    title: "Pick a plan",
    body: "Professional or Business for self-serve. Enterprise with sales."
  },
  {
    title: "Subscribe & set up",
    body: "We create your organization; you finish Guided Setup."
  },
  {
    title: "Run the work",
    body: "Operate only the modules you purchased — day to day."
  }
] as const;

const OUTCOMES = [
  {
    title: "One place for the work",
    body: "Fewer tab switches between portfolio, maintenance, and facility tasks."
  },
  {
    title: "Pay for what you run",
    body: "Add modules as operations expand. Bundles cost more than one module, less than buying twice."
  },
  {
    title: "Faster path to production",
    body: "From Checkout to an entitled dashboard without a custom implementation project."
  }
] as const;

export default function LandingPage() {
  const jsonLd = landingSoftwareApplicationJsonLd();
  const professional = PLAN_DISPLAY.find((plan) => plan.planCode === "professional");
  const singleModulePrice = listPriceForModules("professional", "property_ops").listPriceMonthly;
  const bothModulesPrice = listPriceForModules("professional", "both").listPriceMonthly;
  const businessPrice = listPriceForModules("business", "property_ops").listPriceMonthly;

  return (
    <MarketingShell currentPath="/">
      <AcqFunnelPageView eventName={ACQ_FUNNEL_EVENTS.landingViewed} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. Hero */}
      <section className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--mpa-color-brand-primary)_22%,transparent),transparent_55%),linear-gradient(165deg,var(--mpa-color-bg-app)_0%,color-mix(in_srgb,#0b1220_6%,var(--mpa-color-bg-app))_50%,var(--mpa-color-bg-app)_100%)]"
          aria-hidden
        />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
          <div>
            <p className="font-display text-4xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)] sm:text-5xl">
              {MPA_BRAND_NAME}
            </p>
            <h1 className="mt-4 max-w-xl font-display text-3xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)] sm:text-4xl">
              Run property and facility work in one operating system.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-[var(--mpa-color-text-secondary)] sm:text-lg">
              Subscribe to the modules you need, set up your organization, and run daily operations with clear
              ownership.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/modules"
                className="inline-flex h-11 min-h-11 items-center justify-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-5 text-sm font-semibold text-[var(--mpa-color-text-inverse)] shadow-[var(--mpa-shadow-xs)] hover:bg-[var(--mpa-color-brand-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
              >
                Choose modules
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-11 min-h-11 items-center justify-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-5 text-sm font-semibold text-[var(--mpa-color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
              >
                View pricing
              </Link>
            </div>
          </div>

          <div
            aria-hidden
            className="rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-3 shadow-[var(--mpa-shadow-md)]"
          >
            <div className="overflow-hidden rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)]">
              <div className="flex items-center justify-between border-b border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-sidebar)] px-4 py-3">
                <span className="text-sm font-semibold text-[var(--mpa-color-text-sidebar-active)]">
                  {MPA_BRAND_NAME}
                </span>
                <span className="rounded-full bg-[var(--mpa-color-sidebar-accent)]/20 px-2 py-0.5 text-[11px] font-medium text-[var(--mpa-color-sidebar-accent)]">
                  Command Center
                </span>
              </div>
              <div className="grid gap-3 bg-[var(--mpa-color-bg-app)] p-4 sm:grid-cols-[140px_1fr]">
                <div className="hidden space-y-2 sm:block">
                  {["Today", "Maintenance", "Leasing", "Facility"].map((item, index) => (
                    <div
                      key={item}
                      className={`rounded-[var(--mpa-radius-md)] px-3 py-2 text-xs ${
                        index === 0
                          ? "bg-[var(--mpa-color-brand-primary-subtle)] font-medium text-[var(--mpa-color-brand-primary)]"
                          : "bg-[var(--mpa-color-bg-surface)] text-[var(--mpa-color-text-secondary)]"
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-3">
                    <p className="text-xs font-medium text-[var(--mpa-color-text-muted)]">Needs attention</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--mpa-color-text-primary)]">
                      3 open work orders
                    </p>
                    <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                      Next: assign vendor · Unit 4B HVAC
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-3">
                      <p className="text-xs text-[var(--mpa-color-text-muted)]">Lease renewals</p>
                      <p className="mt-1 text-sm font-semibold">2 this week</p>
                    </div>
                    <div className="rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-3">
                      <p className="text-xs text-[var(--mpa-color-text-muted)]">Inspections due</p>
                      <p className="mt-1 text-sm font-semibold">5 scheduled</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-[var(--mpa-color-text-muted)]">
              Product preview — entitled modules only
            </p>
          </div>
        </div>
      </section>

      {/* 2. Platform overview */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Platform overview
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--mpa-color-text-secondary)]">
          Core capabilities of {MPA_BRAND_NAME}. Each one is a distinct operating surface — not a restatement of
          the same pitch.
        </p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {CAPABILITIES.map((item) => (
            <li
              key={item.title}
              className="rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-5"
            >
              <h3 className="font-display text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* 3. How it works */}
      <section
        className="border-y border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)]"
        aria-labelledby="how-heading"
      >
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 id="how-heading" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            How {MPA_BRAND_NAME} works
          </h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mpa-color-brand-primary)]">
                  Step {index + 1}
                </p>
                <h3 className="mt-2 font-display text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 4. Why teams choose */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="why-heading">
        <h2 id="why-heading" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Why teams choose {MPA_BRAND_NAME}
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--mpa-color-text-secondary)]">
          Outcomes operators feel after go-live — not another feature inventory.
        </p>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {OUTCOMES.map((item) => (
            <li key={item.title}>
              <h3 className="font-display text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* 5. Pricing */}
      <section
        className="border-y border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)]"
        aria-labelledby="pricing-heading"
      >
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 id="pricing-heading" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Pricing
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--mpa-color-text-secondary)]">
            Module count changes plan value. One module is the base. Both modules cost more — and still less than
            paying for two separate single-module subscriptions.
          </p>
          <ul className="mt-10 grid gap-4 lg:grid-cols-3">
            <li className="rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] p-5">
              <p className="text-sm font-medium text-[var(--mpa-color-brand-primary)]">One module</p>
              <h3 className="mt-2 font-display text-xl font-semibold">Professional</h3>
              <p className="mt-3 font-display text-3xl font-semibold tabular-nums">
                ${singleModulePrice}
                <span className="text-base font-medium text-[var(--mpa-color-text-secondary)]">/mo</span>
              </p>
              <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
                Property Operations or Facility Operations.
              </p>
            </li>
            <li className="rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-brand-primary)] p-5 ring-1 ring-[var(--mpa-color-brand-primary)]">
              <p className="text-sm font-medium text-[var(--mpa-color-brand-primary)]">Both modules</p>
              <h3 className="mt-2 font-display text-xl font-semibold">Professional bundle</h3>
              <p className="mt-3 font-display text-3xl font-semibold tabular-nums">
                ${bothModulesPrice}
                <span className="text-base font-medium text-[var(--mpa-color-text-secondary)]">/mo</span>
              </p>
              <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
                Higher than one module
                {professional ? ` (not $${(professional.listPriceMonthly * 2).toFixed(0)} at 2×)` : ""}.
                Built to encourage full-platform adoption.
              </p>
            </li>
            <li className="rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] p-5">
              <p className="text-sm font-medium text-[var(--mpa-color-text-muted)]">Higher capacity</p>
              <h3 className="mt-2 font-display text-xl font-semibold">Business & Enterprise</h3>
              <p className="mt-3 font-display text-3xl font-semibold tabular-nums">
                From ${businessPrice}
                <span className="text-base font-medium text-[var(--mpa-color-text-secondary)]">/mo</span>
              </p>
              <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
                Larger portfolios and custom Enterprise with sales.
              </p>
            </li>
          </ul>
          <div className="mt-8">
            <Link
              href="/modules"
              className="inline-flex h-11 items-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-5 text-sm font-semibold text-[var(--mpa-color-text-inverse)] hover:bg-[var(--mpa-color-brand-primary-hover)]"
            >
              Start with modules
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="final-cta-heading">
        <div className="rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-6 py-10 sm:px-10">
          <h2 id="final-cta-heading" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Ready to choose your operating surface?
          </h2>
          <p className="mt-3 max-w-xl text-[var(--mpa-color-text-secondary)]">
            Pick modules, see plan pricing for that selection, and subscribe. No repeated pitch — just the next
            step.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/modules"
              className="inline-flex h-11 items-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-5 text-sm font-semibold text-[var(--mpa-color-text-inverse)] hover:bg-[var(--mpa-color-brand-primary-hover)]"
            >
              Choose modules
            </Link>
            <Link
              href="/contact-sales"
              className="inline-flex h-11 items-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] px-5 text-sm font-semibold"
            >
              Contact sales
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
