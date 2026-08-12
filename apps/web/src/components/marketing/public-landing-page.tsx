import Link from "next/link";
import type { ReactNode } from "react";
import {
  PRODUCT_SKUS,
  PUBLIC_PRICING_MODEL_COPY,
  SKU_SUMMARIES,
  acquisitionHref,
  marketingModulesForSku,
  publicPurchaseMotionForSku,
  type ProductSku
} from "@mpa/shared";
import {
  MarketingChrome,
  marketingHeroSecondaryCtaClass,
  marketingPrimaryCtaClass,
  marketingSecondaryCtaClass
} from "./marketing-chrome";
import { LandingHeroProductVisual } from "./landing-hero-product-visual";
import { FutureIntegrationsNote } from "./future-integrations-note";

function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  tone = "default"
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  tone?: "default" | "muted" | "inverse";
}) {
  const shell =
    tone === "muted"
      ? "bg-[var(--mpa-color-bg-subtle,#F7F8FA)]"
      : tone === "inverse"
        ? "bg-[linear-gradient(160deg,#0B1F1A_0%,#0F6B56_55%,#1A2330_100%)] text-white"
        : "";
  const titleClass =
    tone === "inverse"
      ? "font-display text-2xl font-semibold text-white md:text-3xl"
      : "font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)] md:text-3xl";
  const descClass =
    tone === "inverse"
      ? "text-sm leading-6 text-white/80 md:text-base"
      : "text-sm leading-6 text-[var(--mpa-color-text-secondary)] md:text-base";
  const eyebrowClass =
    tone === "inverse"
      ? "text-xs font-semibold uppercase tracking-wide text-white/65"
      : "text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]";

  return (
    <section id={id} className={shell}>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-12 md:px-6 md:py-14">
        <div className="max-w-2xl space-y-2">
          {eyebrow ? <p className={eyebrowClass}>{eyebrow}</p> : null}
          <h2 className={titleClass}>{title}</h2>
          {description ? <p className={descClass}>{description}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

function productCheckoutHref(sku: ProductSku) {
  return acquisitionHref("questionnaire", {
    sku,
    billingCycle: "monthly"
  });
}

const PROBLEMS = [
  {
    title: "Maintenance and work orders live in messages",
    detail: "Requests scatter across texts, email, and notes instead of a shared work queue."
  },
  {
    title: "Vendors are hard to follow through",
    detail: "Assignments and status updates disappear until someone chases them down."
  },
  {
    title: "Property and unit context is scattered",
    detail: "Critical details sit in folders and spreadsheets — not where the next decision happens."
  },
  {
    title: "Billing and operations stay disconnected",
    detail: "Money and fieldwork rarely share one operating picture, so teams re-enter the same facts."
  },
  {
    title: "Facility work has no operational home",
    detail: "Building systems, preventive work, and day-to-day coverage fight for attention outside the PM stack."
  },
  {
    title: "Communication becomes another job",
    detail: "Owners, residents, vendors, and internal teams all ask for status because nothing is shared by default."
  }
] as const;

const PRODUCT_FIT: Record<
  ProductSku,
  { chooseIf: string; whyItMatters: string; priceLines: (pricing: typeof PUBLIC_PRICING_MODEL_COPY) => string }
> = {
  mpa_property_manager: {
    chooseIf:
      "Choose Property Manager if your primary need is managing the property-management side of the operation — properties, residents, leasing, vendors, and financial operations.",
    whyItMatters:
      "Run portfolio workflows from one Mission Control instead of stitching rent tools, maintenance threads, and spreadsheets together.",
    priceLines: (pricing) =>
      `${pricing.pmHeadline} or ${pricing.pmHeadlineAnnual} · ${pricing.pmIncludes}`
  },
  mpa_facility_operations: {
    chooseIf:
      "Choose Facility Operations if your primary need is facility, maintenance, work-order, vendor, and operational workflows for buildings and sites.",
    whyItMatters:
      "Give facility and maintenance teams a dedicated operations home for work coverage, assets, and preventive workflows.",
    priceLines: (pricing) =>
      `${pricing.foHeadlineMonthly} or ${pricing.foHeadlineAnnual} · ${pricing.foIncludes}`
  },
  mpa_complete_platform: {
    chooseIf:
      "Choose Complete if you need both property-management and facility/operations workflows in one system — one organization, both product homes, shared context.",
    whyItMatters:
      "When portfolio management and facility work share residents, units, vendors, and status, combining them removes the handoff tax between two operational sides.",
    priceLines: (pricing) =>
      `${pricing.completeHeadlineMonthly} or ${pricing.completeHeadlineAnnual} · ${pricing.completeIncludes}`
  }
};

const COMPARISON_ROWS = [
  {
    topic: "Best fit when…",
    mpa: "You need day-to-day property operations: maintenance, work orders, vendors, facility workflows, and operational visibility across units.",
    rentredi: "Best when rent collection / property-management administration is the primary job."
  },
  {
    topic: "Platform shape",
    mpa: "Property Manager, Facility Operations, and Complete — so PM and facility teams can share one operating system when needed.",
    rentredi: "Typically positioned around rental management and landlord workflows."
  },
  {
    topic: "Operational workflows",
    mpa: "Work orders, vendor follow-through, maintenance status, properties/units, and team handoffs live in connected workflows.",
    rentredi: "Strong when the core job is collecting rent and managing tenancy basics."
  },
  {
    topic: "Facility + PM together",
    mpa: "Complete Platform combines both operational sides in one organization when you need both.",
    rentredi: "Evaluate whether your need is rent-first tooling or full operations coverage."
  },
  {
    topic: "Pricing transparency",
    mpa: "Unit-volume pricing with Additional Unit Capacity disclosed before Checkout.",
    rentredi: "Compare published plans against your portfolio size and operating needs."
  },
  {
    topic: "Path after signup",
    mpa: "Stripe Checkout → create account → Guided Setup → Mission Control.",
    rentredi: "Follow their published onboarding path for rent-focused tooling."
  }
] as const;

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "See which platform fits",
    detail: "Property Manager, Facility Operations, or Complete — based on how your team operates."
  },
  {
    step: "2",
    title: "Calculate your plan",
    detail: "Confirm managed units and Additional Unit Capacity before you pay."
  },
  {
    step: "3",
    title: "Start your trial or checkout",
    detail: "Qualifying ≤500-unit plans include 30 DAYS FREE with a payment card on file."
  },
  {
    step: "4",
    title: "Enter Mission Control",
    detail: "Create your account, finish Guided Setup, and start running operations."
  }
] as const;

export function PublicLandingPage({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const pricing = PUBLIC_PRICING_MODEL_COPY;
  const getStartedHref = acquisitionHref("questionnaire");

  return (
    <MarketingChrome isAuthenticated={isAuthenticated}>
      <a
        href="#problem"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to the operational problem
      </a>

      <section
        aria-label="Homepage hero"
        className="relative isolate flex min-h-[100svh] items-end overflow-hidden"
      >
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(145deg,#0B1F1A_0%,#0F6B56_42%,#1A2330_100%)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px] motion-safe:animate-[mpa-grid-drift_28s_linear_infinite]"
        />
        <LandingHeroProductVisual placement="desktop" />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-28 md:px-6 md:pb-16 xl:pb-24">
          <div className="max-w-xl space-y-5 motion-safe:animate-[mpa-rise_700ms_ease-out]">
            <p className="font-display text-4xl font-semibold tracking-tight text-white md:text-6xl">
              M.P.A.
            </p>
            <h1 className="font-display text-2xl font-semibold leading-tight text-white/95 md:text-[2rem] md:leading-snug">
              Stop running property operations across five tools.
            </h1>
            <p className="max-w-md text-base leading-relaxed text-white/80 md:text-lg">
              M.P.A. is a workflow-first Property Operations Platform for property managers, owners,
              and facility teams — connecting maintenance, vendors, units, billing, and day-to-day
              work in one system.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              {isAuthenticated ? (
                <Link href="/dashboard" className={marketingPrimaryCtaClass}>
                  Open workspace
                </Link>
              ) : (
                <Link href={getStartedHref} className={marketingPrimaryCtaClass}>
                  Get Started
                </Link>
              )}
              <a href="#how-it-works" className={marketingHeroSecondaryCtaClass}>
                See How It Works
              </a>
            </div>
          </div>
        </div>
        <LandingHeroProductVisual placement="mobile" />
      </section>

      <Section
        id="who"
        eyebrow="Who it is for"
        title="Built for the people who keep properties running."
        description="Property managers, owners and operators, facility and maintenance teams, and growing operations orgs."
      >
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { role: "Property managers", fit: "Portfolio, residents, leasing, vendors, and money workflows." },
            { role: "Owners / operators", fit: "Visibility across units, work, vendors, and operational status." },
            { role: "Facility / maintenance", fit: "Work orders, assets, preventive work, and building coverage." },
            { role: "Growing ops teams", fit: "Start with PM or FO — or run both in Complete." }
          ].map((item) => (
            <li key={item.role} className="border-t-2 border-[var(--mpa-color-brand-primary)] pt-3">
              <h3 className="font-display text-base font-semibold">{item.role}</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
                {item.fit}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="problem"
        tone="muted"
        eyebrow="The operational problem"
        title="Property operations get fragmented — and the glue work becomes the job."
        description="If maintenance, vendors, units, billing, and communication each live in a different place, your team spends the day reconnecting work that should already be connected."
      >
        <ul className="grid gap-5 md:grid-cols-2">
          {PROBLEMS.map((item) => (
            <li key={item.title} className="space-y-1">
              <h3 className="font-display text-base font-semibold text-[var(--mpa-color-text-primary)]">
                {item.title}
              </h3>
              <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
                {item.detail}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="solution"
        eyebrow="The M.P.A. solution"
        title="Connect the workflows operators actually have to manage."
        description="M.P.A. brings property operations, maintenance, work orders, vendors, facility workflows, residents, billing, and team communication into one operating model — so status is visible without another status meeting."
      >
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Properties & units",
            "Maintenance & work orders",
            "Vendors",
            "Facility operations",
            "Residents",
            "Billing visibility",
            "Team workflows",
            "Operational overview"
          ].map((item) => (
            <li
              key={item}
              className="border-t border-[var(--mpa-color-border-default)] pt-3 text-sm font-medium text-[var(--mpa-color-text-primary)]"
            >
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="why-mpa"
        tone="muted"
        eyebrow="Why M.P.A."
        title="One operational system instead of five workarounds."
        description="Most teams already pay for software. The expensive part is the glue between rent tools, maintenance apps, spreadsheets, texts, email, and manual tracking."
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
              Instead of
            </p>
            <ul className="mt-3 space-y-2">
              {[
                "Software for rent",
                "Software for maintenance",
                "Spreadsheets for units",
                "Texts for vendors",
                "Email for status",
                "Manual follow-up"
              ].map((item) => (
                <li
                  key={item}
                  className="border-l-2 border-[var(--mpa-color-border-default)] pl-3 text-sm text-[var(--mpa-color-text-secondary)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
              With M.P.A.
            </p>
            <div className="mt-3 space-y-3 border-l-2 border-[var(--mpa-color-brand-primary)] pl-4">
              <p className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
                Workflows stay connected where the work happens
              </p>
              <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
                Less administrative chasing. Clearer visibility. Faster handoffs. Fewer disconnected
                tools — and one place to see what needs attention next.
              </p>
            </div>
          </div>
        </div>

        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Save time", detail: "Move work through shared queues instead of rebuilding status by hand." },
            { title: "Reduce admin", detail: "Stop copying the same unit, vendor, and request details into five places." },
            { title: "Improve visibility", detail: "See open work, vendors, units, and billing context in one operating view." },
            { title: "Speed workflows", detail: "Hand off maintenance and vendor work without losing ownership." },
            { title: "Cut tool sprawl", detail: "Replace glue-work between disconnected apps with connected operations." },
            { title: "Improve communication", detail: "Give teams, owners, residents, and vendors a clearer status thread." }
          ].map((item) => (
            <li key={item.title} className="space-y-1">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
                {item.title}
              </h3>
              <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">{item.detail}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="choose-platform"
        eyebrow="Product fit"
        title="Choose the platform that matches how you operate."
        description="You should not have to guess. Use these decision rules — then Get Started."
      >
        <ul className="grid gap-8 lg:grid-cols-3">
          {PRODUCT_SKUS.map((sku) => {
            const summary = SKU_SUMMARIES[sku];
            const fit = PRODUCT_FIT[sku];
            const motion = publicPurchaseMotionForSku(sku);
            return (
              <li key={sku} className="flex flex-col border-t-2 border-[var(--mpa-color-brand-primary)] pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
                  {motion.availabilityLabel}
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold">{summary.label}</h3>
                <p className="mt-3 text-sm font-medium leading-6 text-[var(--mpa-color-text-primary)]">
                  {fit.chooseIf}
                </p>
                <p className="mt-2 flex-1 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
                  {fit.whyItMatters}
                </p>
                <p className="mt-4 text-sm font-semibold text-[var(--mpa-color-text-primary)]">
                  {fit.priceLines(pricing)}
                </p>
                <p className="mt-1 text-xs text-[var(--mpa-color-text-muted)]">
                  {pricing.additionalCapacityLine} · {marketingModulesForSku(sku).length} included
                  modules
                </p>
                <div className="mt-5">
                  <Link href={productCheckoutHref(sku)} className={marketingPrimaryCtaClass}>
                    Get started — {summary.label}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="pt-2 text-sm text-[var(--mpa-color-text-secondary)]">
          Want the full module list?{" "}
          <Link href="/modules" className="font-semibold text-[var(--mpa-color-brand-primary)]">
            Explore platforms
          </Link>{" "}
          or{" "}
          <Link href="/pricing" className="font-semibold text-[var(--mpa-color-brand-primary)]">
            open pricing details
          </Link>
          .
        </p>
      </Section>

      <Section
        id="how-it-works"
        tone="muted"
        eyebrow="What happens next"
        title="From interest to Mission Control — without a parallel funnel."
        description={pricing.journeyNote}
      >
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((item) => (
            <li key={item.step} className="space-y-2">
              <p className="font-display text-3xl font-semibold text-[var(--mpa-color-brand-primary)]">
                {item.step}
              </p>
              <h3 className="font-display text-lg font-semibold">{item.title}</h3>
              <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">{item.detail}</p>
            </li>
          ))}
        </ol>
        {!isAuthenticated ? (
          <div className="pt-2">
            <Link href={getStartedHref} className={marketingPrimaryCtaClass}>
              Get Started
            </Link>
          </div>
        ) : null}
      </Section>

      <Section
        id="compare"
        eyebrow="Which platform type fits you?"
        title="M.P.A. vs rent-first tools like RentRedi"
        description="This is a category decision, not a takedown. Choose the type of platform that matches the job you need done."
      >
        <div className="relative">
          <p className="mb-2 text-xs font-medium text-[var(--mpa-color-text-muted)] md:hidden">
            Swipe sideways to compare →
          </p>
          <div className="overflow-x-auto rounded-md border border-[var(--mpa-color-border-subtle)] [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)]">
                  <th scope="col" className="px-3 py-3 text-left font-semibold">
                    Decision point
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3 text-left font-semibold text-[var(--mpa-color-brand-primary)]"
                  >
                    M.P.A.
                  </th>
                  <th scope="col" className="px-3 py-3 text-left font-semibold">
                    RentRedi / rent-first tools
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.topic} className="border-b border-[var(--mpa-color-border-subtle)]">
                    <th
                      scope="row"
                      className="px-3 py-3 text-left align-top font-medium text-[var(--mpa-color-text-primary)]"
                    >
                      {row.topic}
                    </th>
                    <td className="px-3 py-3 align-top text-[var(--mpa-color-text-secondary)]">
                      {row.mpa}
                    </td>
                    <td className="px-3 py-3 align-top text-[var(--mpa-color-text-secondary)]">
                      {row.rentredi}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-[var(--mpa-color-text-muted)]">
          Always verify a competitor&apos;s current features and pricing on their site before you
          decide. M.P.A. claims above describe M.P.A.&apos;s verified product positioning only.
        </p>
      </Section>

      <Section
        id="pricing"
        tone="muted"
        eyebrow="Exact pricing"
        title="Know the cost. Know the capacity. Know the trial."
        description="Managed-unit pricing from the same commercial model used at Checkout."
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {(
            [
              {
                label: "Property Manager",
                monthly: pricing.pmHeadline,
                annual: pricing.pmHeadlineAnnual,
                includes: pricing.pmIncludes
              },
              {
                label: "Facility Operations",
                monthly: pricing.foHeadlineMonthly,
                annual: pricing.foHeadlineAnnual,
                includes: pricing.foIncludes
              },
              {
                label: "Complete Platform",
                monthly: pricing.completeHeadlineMonthly,
                annual: pricing.completeHeadlineAnnual,
                includes: pricing.completeIncludes
              }
            ] as const
          ).map((plan) => (
            <div key={plan.label} className="border-t border-[var(--mpa-color-border-default)] pt-4">
              <h3 className="font-display text-lg font-semibold">{plan.label}</h3>
              <p className="mt-2 font-display text-2xl font-semibold">{plan.monthly}</p>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{plan.annual}</p>
              <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">{plan.includes}</p>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                {pricing.additionalCapacityLine}
              </p>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                {pricing.additionalCapacityAnnualLine}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-3 border-t border-[var(--mpa-color-border-subtle)] pt-6 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
          <p>
            <span className="font-semibold text-[var(--mpa-color-text-primary)]">
              {pricing.trialTitle}.
            </span>{" "}
            {pricing.trialEligible}
          </p>
          <p>{pricing.trialIneligible}</p>
          <p>
            <span className="font-semibold text-[var(--mpa-color-text-primary)]">
              {pricing.cancellationTitle}.
            </span>{" "}
            {pricing.cancellationSummary}
          </p>
          <p>{pricing.unitDefinition}</p>
          <p>{pricing.capacityChange}</p>
          <p>{pricing.annualNote}</p>
        </div>

        <div className="flex flex-wrap gap-3 pt-4">
          <Link href={getStartedHref} className={marketingPrimaryCtaClass}>
            Get Started
          </Link>
          <Link href="/pricing" className={marketingSecondaryCtaClass}>
            Calculate your plan
          </Link>
        </div>
      </Section>

      <Section
        id="trust"
        eyebrow="Trust the path"
        title="Production software. Honest products. Clear commercial path."
      >
        <ul className="grid gap-5 sm:grid-cols-2">
          {[
            {
              title: "Three products only",
              detail:
                "Property Manager, Facility Operations, and Complete. Enterprise is a sales path — not a fake SaaS tier."
            },
            {
              title: "Secure organization workspaces",
              detail:
                "Checkout provisions your organization, then Guided Setup takes you into Mission Control."
            },
            {
              title: "Operational workflows that exist today",
              detail:
                "Mission Control, maintenance, vendors, properties/units, facility operations, and billing visibility are real product surfaces — explore them in Live Demo."
            },
            {
              title: "Transparent unit-volume billing",
              detail:
                "Capacity, trial rules, and cancellation behavior are disclosed before you commit."
            }
          ].map((item) => (
            <li key={item.title} className="space-y-1">
              <h3 className="font-display text-base font-semibold">{item.title}</h3>
              <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">{item.detail}</p>
            </li>
          ))}
        </ul>
        <div className="pt-2">
          <Link href="/demo" className={marketingSecondaryCtaClass}>
            Explore Live Demo
          </Link>
        </div>
        <FutureIntegrationsNote className="mt-4 border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)] px-4 py-3" />
      </Section>

      <Section id="faq" tone="muted" eyebrow="FAQ" title="Straight answers">
        <dl className="space-y-5">
          {[
            {
              q: "What is M.P.A.?",
              a: "A workflow-first Property Operations Platform — built to connect the day-to-day operational work of property and facility teams, not merely list modules."
            },
            {
              q: "Which product should I choose?",
              a: "PM for property-management operations. FO for facility/maintenance operations. Complete when you need both sides in one organization."
            },
            {
              q: "What does it cost?",
              a: `Property Manager ${pricing.pmHeadline} / ${pricing.pmHeadlineAnnual}. Facility Operations ${pricing.foHeadlineMonthly} / ${pricing.foHeadlineAnnual}. Complete ${pricing.completeHeadlineMonthly} / ${pricing.completeHeadlineAnnual}. Each includes up to ${pricing.includedUnits} managed units. ${pricing.additionalCapacityLine}`
            },
            {
              q: "How do trial and cancellation work?",
              a: `${pricing.trialEligible} ${pricing.cancellationSummary}`
            },
            {
              q: "What is Enterprise?",
              a: pricing.enterpriseNotProduct
            }
          ].map((item) => (
            <div key={item.q} className="border-t border-[var(--mpa-color-border-subtle)] pt-4">
              <dt className="font-semibold">{item.q}</dt>
              <dd className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{item.a}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section
        id="start-now"
        tone="inverse"
        eyebrow="Start now"
        title="See which platform fits. Calculate your plan. Start your trial."
        description="Every week of tool sprawl is another week of reconnecting work by hand. Get your operation organized in one workflow-first system."
      >
        <div className="flex flex-wrap gap-3">
          {isAuthenticated ? (
            <Link href="/dashboard" className={marketingPrimaryCtaClass}>
              Open workspace
            </Link>
          ) : (
            <Link href={getStartedHref} className={marketingPrimaryCtaClass}>
              Get Started
            </Link>
          )}
          <a
            href="#choose-platform"
            className="inline-flex h-11 items-center justify-center rounded-md border border-white/35 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            See which platform fits
          </a>
          <Link
            href="/pricing"
            className="inline-flex h-11 items-center justify-center rounded-md border border-white/35 bg-transparent px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            Calculate your plan
          </Link>
        </div>
      </Section>

      <Section
        id="enterprise"
        eyebrow="Enterprise Solutions"
        title="For very large organizations"
        description={pricing.enterpriseNotProduct}
      >
        <Link href="/enterprise" className={marketingSecondaryCtaClass}>
          Explore Enterprise Solutions
        </Link>
      </Section>
    </MarketingChrome>
  );
}
