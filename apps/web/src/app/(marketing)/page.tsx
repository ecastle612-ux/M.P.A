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
import { listPriceForModules } from "../../lib/acquire/catalog";

const title = "Property & facility operations platform";
const description = `${MPA_BRAND_NAME} replaces fragmented property and facility tools with one operating system — clear ownership, faster follow-through, and a path from purchase to production.`;

export const metadata: Metadata = {
  title,
  description,
  robots: marketingRobots(),
  alternates: { canonical: "/" },
  openGraph: marketingOpenGraph({ title, description, path: "/" }),
  twitter: marketingTwitter({ title, description })
};

const WHO_FOR = [
  {
    title: "Property operations teams",
    body: "Portfolio, leasing, residents, and maintenance without spreadsheet handoffs."
  },
  {
    title: "Facility operations teams",
    body: "Preventive work, inspections, and inventory beside the same organization."
  },
  {
    title: "Operators who outgrew point tools",
    body: "Need one private workspace, invitation-only seats, and accountable next actions."
  }
] as const;

const TRANSFORM = [
  {
    title: "Before",
    body: "Work lives in inboxes, shared drives, and disconnected apps. Ownership is unclear."
  },
  {
    title: "After",
    body: "One Command Center. Entitled modules only. Every item has an owner and a next step."
  }
] as const;

const STEPS = [
  {
    title: "Choose what you run",
    body: "Start with one module (Essentials) or both (Professional)."
  },
  {
    title: "Subscribe",
    body: "Self-serve Essentials, Professional, or Business. Enterprise with sales."
  },
  {
    title: "Go live",
    body: "We provision your organization; Guided Setup opens your dashboard."
  },
  {
    title: "Operate daily",
    body: "Run maintenance, leasing, and facility work with clear accountability."
  }
] as const;

export default function LandingPage() {
  const jsonLd = landingSoftwareApplicationJsonLd();
  const essentials = listPriceForModules("professional", "property_ops");
  const professional = listPriceForModules("professional", "both");
  const business = listPriceForModules("business", "property_ops");
  const essentialsPrice = essentials.listPriceMonthly ?? 99;
  const professionalPrice = professional.listPriceMonthly ?? 149;
  const compareAt = professional.compareAtMonthly ?? essentialsPrice * 2;
  const bundleSavings = professional.bundleSavingsMonthly ?? compareAt - professionalPrice;
  const businessPrice = business.listPriceMonthly ?? 249;

  return (
    <MarketingShell currentPath="/">
      <AcqFunnelPageView eventName={ACQ_FUNNEL_EVENTS.landingViewed} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. Hero — outcomes first */}
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
              From scattered tools to one accountable operations system.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-[var(--mpa-color-text-secondary)] sm:text-lg">
              {MPA_BRAND_NAME} is for property and facility teams who need clear ownership, faster follow-through,
              and software that runs the work — not another dashboard of widgets.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/modules"
                className="inline-flex h-11 min-h-11 items-center justify-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-5 text-sm font-semibold text-[var(--mpa-color-text-inverse)] shadow-[var(--mpa-shadow-xs)] hover:bg-[var(--mpa-color-brand-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
              >
                Start free setup path
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-11 min-h-11 items-center justify-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-5 text-sm font-semibold text-[var(--mpa-color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
              >
                See plans
              </Link>
            </div>
            <p className="mt-4 text-sm text-[var(--mpa-color-text-muted)]">
              Built for operating teams — not marketing demos.
            </p>
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
              What operators see after go-live
            </p>
          </div>
        </div>
      </section>

      {/* 2. Who it's for + transformation */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="for-heading">
        <h2 id="for-heading" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Who {MPA_BRAND_NAME} is for
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--mpa-color-text-secondary)]">
          Professional operators who need the work to move — not another feature catalog.
        </p>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {WHO_FOR.map((item) => (
            <li
              key={item.title}
              className="rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-5"
            >
              <h3 className="font-display text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">{item.body}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {TRANSFORM.map((item) => (
            <div
              key={item.title}
              className="rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mpa-color-brand-primary)]">
                {item.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--mpa-color-text-secondary)]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. How it works */}
      <section
        className="border-y border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)]"
        aria-labelledby="how-heading"
      >
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 id="how-heading" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            How it works
          </h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title}>
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

      {/* 4. Why different */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="why-heading">
        <h2 id="why-heading" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Why teams switch to {MPA_BRAND_NAME}
        </h2>
        <ul className="mt-8 max-w-3xl space-y-4 text-[var(--mpa-color-text-secondary)]">
          <li>
            <span className="font-medium text-[var(--mpa-color-text-primary)]">Outcomes first.</span> You see the
            operating result — accountability and follow-through — before choosing modules.
          </li>
          <li>
            <span className="font-medium text-[var(--mpa-color-text-primary)]">Pay for what you run.</span> Essentials
            covers one module. Professional covers both with bundle savings.
          </li>
          <li>
            <span className="font-medium text-[var(--mpa-color-text-primary)]">Production path built in.</span> Checkout
            provisions your org; Guided Setup gets you to Command Center.
          </li>
        </ul>
      </section>

      {/* 5. Pricing — premium package names */}
      <section
        className="border-y border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)]"
        aria-labelledby="pricing-heading"
      >
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 id="pricing-heading" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Plans
          </h2>
          <p className="mt-3 max-w-2xl text-[var(--mpa-color-text-secondary)]">
            Start with one operating module or both. Professional includes both modules and saves versus buying
            them separately.
          </p>
          <ul className="mt-10 grid gap-4 lg:grid-cols-4">
            <li className="flex flex-col rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] p-5">
              <h3 className="font-display text-xl font-semibold">Essentials</h3>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">Choose one module</p>
              <p className="mt-4 font-display text-3xl font-semibold tabular-nums">
                ${essentialsPrice}
                <span className="text-base font-medium text-[var(--mpa-color-text-secondary)]">/month</span>
              </p>
              <p className="mt-2 flex-1 text-sm text-[var(--mpa-color-text-secondary)]">
                Property Operations or Facility Operations.
              </p>
              <Link
                href="/modules"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] px-4 text-sm font-semibold"
              >
                Choose Essentials
              </Link>
            </li>

            <li className="flex flex-col rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-brand-primary)] p-5 ring-1 ring-[var(--mpa-color-brand-primary)]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mpa-color-brand-primary)]">
                Most teams
              </p>
              <h3 className="mt-2 font-display text-xl font-semibold">Professional</h3>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">Choose both modules</p>
              <p className="mt-4 text-sm text-[var(--mpa-color-text-muted)] line-through tabular-nums">
                ${compareAt}/month
              </p>
              <p className="font-display text-3xl font-semibold tabular-nums">
                ${professionalPrice}
                <span className="text-base font-medium text-[var(--mpa-color-text-secondary)]">/month</span>
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--mpa-color-brand-primary)]">
                Save ${bundleSavings}/month compared to purchasing separately.
              </p>
              <p className="mt-2 flex-1 text-sm text-[var(--mpa-color-text-secondary)]">
                Property and Facility Operations together.
              </p>
              <Link
                href="/pricing?modules=both"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-semibold text-[var(--mpa-color-text-inverse)] hover:bg-[var(--mpa-color-brand-primary-hover)]"
              >
                Choose Professional
              </Link>
            </li>

            <li className="flex flex-col rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] p-5">
              <h3 className="font-display text-xl font-semibold">Business</h3>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">Higher capacity</p>
              <p className="mt-4 font-display text-3xl font-semibold tabular-nums">
                From ${businessPrice}
                <span className="text-base font-medium text-[var(--mpa-color-text-secondary)]">/month</span>
              </p>
              <p className="mt-2 flex-1 text-sm text-[var(--mpa-color-text-secondary)]">
                Larger portfolios, more seats, priority support. Module selection still applies.
              </p>
              <Link
                href="/modules"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] px-4 text-sm font-semibold"
              >
                Choose Business path
              </Link>
            </li>

            <li className="flex flex-col rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] p-5">
              <h3 className="font-display text-xl font-semibold">Enterprise</h3>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">Custom scale</p>
              <p className="mt-4 font-display text-3xl font-semibold">Contact sales</p>
              <p className="mt-2 flex-1 text-sm text-[var(--mpa-color-text-secondary)]">
                Custom limits, security review, and assisted onboarding.
              </p>
              <Link
                href="/contact-sales"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] px-4 text-sm font-semibold"
              >
                Contact sales
              </Link>
            </li>
          </ul>
        </div>
      </section>

      {/* 6. Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="final-cta-heading">
        <div className="rounded-[var(--mpa-radius-xl)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-6 py-10 sm:px-10">
          <h2 id="final-cta-heading" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Ready for accountable operations?
          </h2>
          <p className="mt-3 max-w-xl text-[var(--mpa-color-text-secondary)]">
            Pick your modules, confirm your plan, and go live. Next step is clear.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/modules"
              className="inline-flex h-11 items-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-5 text-sm font-semibold text-[var(--mpa-color-text-inverse)] hover:bg-[var(--mpa-color-brand-primary-hover)]"
            >
              Choose modules
            </Link>
            <Link
              href="/pricing?modules=both"
              className="inline-flex h-11 items-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] px-5 text-sm font-semibold"
            >
              View Professional pricing
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
