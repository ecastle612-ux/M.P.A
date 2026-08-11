import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  PRODUCT_SKUS,
  PUBLIC_PRICING_MODEL_COPY,
  SKU_SUMMARIES,
  acquisitionHref,
  formatUsdAmount,
  type ProductSku
} from "@mpa/shared";
import {
  MarketingChrome,
  marketingPrimaryCtaClass,
  marketingSecondaryCtaClass
} from "./marketing-chrome";
import { LandingCtaRow } from "./landing-cta-row";
import { LandingMaintenancePreview } from "./landing-maintenance-preview";
import { LandingProductFrame } from "./landing-product-frame";

function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className = ""
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`mx-auto max-w-6xl space-y-6 px-4 py-14 md:px-6 md:py-16 ${className}`}
    >
      <div className="max-w-2xl space-y-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)] md:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)] md:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

const WORKFLOW_STEPS = [
  { label: "Property", detail: "Add the properties and units you operate." },
  { label: "People", detail: "Bring your team into the same operating home." },
  { label: "Resident / Lease", detail: "Connect residents and lease handoffs." },
  { label: "Rent", detail: "Billing, collection attention, and payment follow-through." },
  { label: "Maintenance / Vendor", detail: "Request → assign → progress → resolution." },
  { label: "Mission Control", detail: "Daily attention and a clear next action." },
  { label: "Owner visibility", detail: "Portfolio view of occupancy, rent, and maintenance." }
] as const;

const OUTCOMES = [
  {
    title: "Operational visibility",
    detail:
      "Mission Control surfaces what needs attention now, what can wait, and what to do next — from live property work, not a vanity dashboard."
  },
  {
    title: "Clearer handoffs",
    detail:
      "Keep work moving between operators, residents, vendors, and owners through connected records and portals."
  },
  {
    title: "Less manual chasing",
    detail:
      "Reduce constant checking across inboxes and spreadsheets by concentrating follow-up in one attention home."
  },
  {
    title: "Connected property work",
    detail:
      "Properties, residents, leases, billing, and maintenance stay linked in the same operating loop."
  },
  {
    title: "Resident, owner, and vendor access",
    detail:
      "Supported portals let residents handle billing and maintenance requests, owners review portfolio health, and vendors track assigned work."
  },
  {
    title: "Facility work when you need it",
    detail:
      "Facility Operations adds a building-side attention home and corrective / domain work-order queues — not a separate spreadsheet for facility tasks."
  }
] as const;

const COMPLETE_ANNUAL_DISPLAY = `${formatUsdAmount(PUBLIC_PRICING_MODEL_COPY.completeBaseMonthly * 12)}/year`;

const PRODUCT_LANDING_COPY: Record<
  ProductSku,
  { priceLine: string; annualLine: string; promise: string }
> = {
  mpa_property_manager: {
    priceLine: PUBLIC_PRICING_MODEL_COPY.pmHeadline,
    annualLine: `${formatUsdAmount(PUBLIC_PRICING_MODEL_COPY.pmBaseMonthly * 12)}/year`,
    promise:
      "Portfolio operations for professional teams — properties, residents, leasing, maintenance, vendors, financial operations, documents, communications, and portals."
  },
  mpa_facility_operations: {
    priceLine: PUBLIC_PRICING_MODEL_COPY.foHeadlineMonthly,
    annualLine: PUBLIC_PRICING_MODEL_COPY.foHeadlineAnnual,
    promise:
      "Facility product for building teams — facility Mission Control plus corrective and domain work-order queues for building work."
  },
  mpa_complete_platform: {
    priceLine: PUBLIC_PRICING_MODEL_COPY.completeHeadlineMonthly,
    annualLine: COMPLETE_ANNUAL_DISPLAY,
    promise:
      "Property Manager and Facility Operations together — both product homes in one organization with shared documents, communications, and identity."
  }
};

const FAQ_ITEMS = [
  {
    q: "What is M.P.A.?",
    a: "M.P.A. (My Property Assistant) is a workflow-first Property Operations Platform. It helps operators run the work around properties, residents, leases, billing, maintenance, vendors, facility work, and day-to-day operational attention."
  },
  {
    q: "Who is M.P.A. built for?",
    a: "Property operators and teams who need more than rent collection alone — portfolio managers, facility teams, and organizations that want residents, owners, and vendors connected to the same operating work."
  },
  {
    q: "Is M.P.A. just rent collection software?",
    a: "No. Resident billing and rent collection are part of Financial Operations inside Property Manager, but M.P.A. is designed around the broader operating loop: properties, residents, leases, maintenance, vendors, Mission Control attention, and owner visibility."
  },
  {
    q: "What does Property Manager include?",
    a: "Property Manager includes Mission Control, properties and units, residents, leasing, residential maintenance, vendors, financial operations, documents, communications, reporting, and resident, owner, and vendor portals."
  },
  {
    q: "What is Facility Operations?",
    a: "Facility Operations is a separate product for building teams. It includes a Facility Mission Control attention home and facility work-order coverage across corrective and domain queues (such as preventive, inspections, safety, and compliance work surfaces). It is a production facility work-order product — not a full traditional CMMS with storeroom ledgers or automated PM engines."
  },
  {
    q: "What is included in Complete Platform?",
    a: "Complete Platform includes Property Manager and Facility Operations together in one organization, with both product homes and the shared platform foundation (documents, communications, search, and identity)."
  },
  {
    q: "Can I try M.P.A.?",
    a: "Yes. Plans with 500 or fewer managed units receive a 30-day free trial. A payment card is required at signup. Plans above 500 managed units do not include a free trial. You can also explore without buying through Live Demo."
  },
  {
    q: "How does the 30-day trial work?",
    a: PUBLIC_PRICING_MODEL_COPY.trialEligible
  },
  {
    q: "What happens after I get started?",
    a: "You choose a product, confirm managed units and billing, complete Confirm Plan, and pay securely with Stripe. After payment you claim your account, complete Guided Setup, and land in Mission Control — your attention home for daily work."
  },
  {
    q: "What happens if I exceed 500 units?",
    a: `${PUBLIC_PRICING_MODEL_COPY.includedCapacityPlain} ${PUBLIC_PRICING_MODEL_COPY.additionalCapacityPlain} ${PUBLIC_PRICING_MODEL_COPY.capacityChange}`
  },
  {
    q: "Is screening available?",
    a: "Professional Background Screening integration is planned and is not available in Version 1.0 today. Leasing and applicant workflow paths exist; provider screening is not shipped yet."
  },
  {
    q: "Is there an Enterprise plan?",
    a: PUBLIC_PRICING_MODEL_COPY.enterpriseNotProduct
  }
] as const;

function productGetStartedHref(sku: ProductSku) {
  return acquisitionHref("questionnaire", {
    sku,
    billingCycle: "monthly"
  });
}

export function PublicLandingPage({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  return (
    <MarketingChrome isAuthenticated={isAuthenticated}>
      <a
        href="#problem"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to operational problem
      </a>

      {/* 1. HERO */}
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
          className="absolute inset-0 opacity-[0.22] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px] motion-safe:animate-[mpa-grid-drift_28s_linear_infinite]"
        />
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 w-full max-w-3xl bg-[radial-gradient(ellipse_at_70%_40%,rgba(255,255,255,0.16),transparent_55%)]"
        />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-8 px-4 pb-14 pt-28 md:px-6 md:pb-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-end lg:gap-10">
          <div className="max-w-2xl space-y-5 motion-safe:animate-[mpa-rise_700ms_ease-out]">
            <p className="font-display text-4xl font-semibold tracking-tight text-white md:text-6xl">
              M.P.A.
            </p>
            <h1 className="max-w-xl font-display text-2xl font-semibold leading-tight text-white/95 md:text-3xl">
              Run the whole property operation — not just rent collection.
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-white/80 md:text-lg">
              M.P.A. gives property operators one system for properties, residents, leases, billing,
              maintenance, vendors, and day-to-day operational attention — so less work falls through
              the cracks.
            </p>
            <LandingCtaRow isAuthenticated={isAuthenticated} variant="hero" showJourneyHint />
          </div>

          <div className="motion-safe:animate-[mpa-rise_900ms_ease-out] lg:pb-2">
            <div className="overflow-hidden rounded-lg border border-white/20 shadow-[0_24px_60px_rgba(5,20,16,0.35)]">
              <Image
                src="/marketing/pm-mission-control-demo.png"
                alt="Property Manager Mission Control in Live Demo"
                className="h-auto w-full"
                width={1280}
                height={720}
                sizes="(max-width: 1024px) 100vw, 560px"
                priority
              />
            </div>
            <p className="mt-3 text-sm leading-5 text-white/70">
              Live Demo — Mission Control attention home for Harborline Properties.
            </p>
          </div>
        </div>
      </section>

      {/* 2. OPERATIONAL PROBLEM */}
      <Section
        id="problem"
        eyebrow="The real work"
        title="Rent is only one job. The operation has many."
        description="Running properties means keeping many moving pieces coordinated — not just collecting rent once a month."
      >
        <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2 md:grid-cols-3">
          {[
            "Properties and units",
            "Residents and leases",
            "Rent and billing follow-up",
            "Maintenance and work orders",
            "Vendors and handoffs",
            "Communication and reminders",
            "Daily operational attention",
            "Owner visibility",
            "Facility building work"
          ].map((item) => (
            <li
              key={item}
              className="border-l-2 border-[var(--mpa-color-brand-primary)] pl-3 text-sm font-medium text-[var(--mpa-color-text-primary)] md:text-base"
            >
              {item}
            </li>
          ))}
        </ul>
      </Section>

      {/* 3. CONSEQUENCE — strengthened Monday-morning scenario */}
      <section
        id="fragmentation"
        className="border-y border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)]"
      >
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-14 md:px-6 md:py-16">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
              Operational fragmentation
            </p>
            <h2 className="font-display text-2xl font-semibold md:text-3xl">
              The work itself isn’t always the hard part.
            </h2>
            <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)] md:text-base">
              Remembering, coordinating, and following up across all the moving pieces is.
            </p>
          </div>

          <div className="max-w-3xl space-y-4 text-sm leading-7 text-[var(--mpa-color-text-secondary)] md:text-base">
            <p>
              A resident reports a problem. Someone has to determine who is handling it. A vendor may
              need to be contacted. Someone has to follow up. The operator needs to know whether the
              work was completed. An owner may eventually ask what happened. Meanwhile other
              properties have their own issues waiting in inboxes, texts, and memory.
            </p>
            <p className="font-medium text-[var(--mpa-color-text-primary)]">
              When property work is scattered, operators spend the day re-checking instead of
              finishing.
            </p>
          </div>

          <ul className="grid gap-5 md:grid-cols-2">
            {[
              {
                title: "Missed follow-ups",
                detail: "Requests and reminders slip because nothing holds the full queue in view."
              },
              {
                title: "Unclear ownership",
                detail: "It becomes harder to see who is waiting on whom — resident, vendor, or team."
              },
              {
                title: "Scattered communication",
                detail: "Context is split across channels, so the same issue gets re-explained."
              },
              {
                title: "No single operational picture",
                detail: "Leaders and owners lack one clear view of what needs attention today."
              }
            ].map((item) => (
              <li key={item.title} className="max-w-xl space-y-1">
                <h3 className="font-display text-lg font-semibold">{item.title}</h3>
                <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
                  {item.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4. SOLUTION */}
      <Section
        id="solution"
        eyebrow="The solution"
        title="M.P.A. — a workflow-first Property Operations Platform"
        description="M.P.A. gives property operators a system built around the work of running the operation — connecting people, properties, residents, maintenance, and day-to-day attention so less work falls through the cracks."
      >
        <p className="max-w-2xl text-sm leading-6 text-[var(--mpa-color-text-secondary)] md:text-base">
          Instead of organizing isolated rental tasks in separate places, M.P.A. is designed so the
          operating loop can move together: from property setup through residents, leases, rent,
          maintenance, and daily attention in Mission Control.
        </p>
      </Section>

      {/* 5. WORKFLOW STORY — denser on mobile */}
      <Section
        id="workflow"
        eyebrow="How the work flows"
        title="A connected operating loop"
        description="Property Manager supports this path from purchase through daily ops. Facility Operations adds a building-side path for facility work orders."
      >
        <ol className="flex flex-wrap gap-2 md:hidden" aria-label="Operating loop">
          {WORKFLOW_STEPS.map((step, index) => (
            <li
              key={step.label}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--mpa-color-bg-subtle,#F7F8FA)] px-3 py-2 text-sm font-medium"
            >
              <span className="text-[var(--mpa-color-brand-primary)]">{index + 1}</span>
              {step.label}
            </li>
          ))}
        </ol>
        <ol className="hidden gap-3 sm:grid-cols-2 lg:grid-cols-3 md:grid">
          {WORKFLOW_STEPS.map((step, index) => (
            <li
              key={step.label}
              className="relative space-y-2 border-t border-[var(--mpa-color-brand-primary)]/40 pt-4"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
                Step {index + 1}
              </p>
              <h3 className="font-display text-lg font-semibold">{step.label}</h3>
              <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
                {step.detail}
              </p>
            </li>
          ))}
        </ol>
        <div className="max-w-2xl space-y-2 border-t border-[var(--mpa-color-border-subtle)] pt-6">
          <h3 className="font-display text-base font-semibold">Facility path</h3>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            Facility Mission Control → corrective and domain work-order queues for building teams.
            Complete Platform customers get both product homes in one organization.
          </p>
        </div>
      </Section>

      {/* 6. MISSION CONTROL PROOF — real screenshot */}
      <section
        id="mission-control"
        className="border-y border-[var(--mpa-color-border-subtle)] bg-[linear-gradient(180deg,#0B1F1A_0%,#102820_55%,#0F1720_100%)]"
      >
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-center md:px-6 md:py-16">
          <div className="space-y-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/65">
              Mission Control
            </p>
            <h2 className="font-display text-2xl font-semibold md:text-3xl">
              See what needs attention and keep the operation moving.
            </h2>
            <p className="max-w-lg text-sm leading-6 text-white/75 md:text-base">
              Mission Control is your attention home after Guided Setup — Immediate, Waiting on me,
              Waiting on others, and a clear next action drawn from property work.
            </p>
            <LandingCtaRow isAuthenticated={isAuthenticated} variant="hero" />
          </div>
          <div className="overflow-hidden rounded-lg border border-white/15 shadow-[0_24px_60px_rgba(5,20,16,0.35)]">
            <Image
              src="/marketing/pm-mission-control-demo.png"
              alt="Mission Control Live Demo showing Immediate and Waiting priorities"
              className="h-auto w-full"
              width={1280}
              height={720}
              sizes="(max-width: 1024px) 100vw, 640px"
            />
            <p className="bg-[#0B1F1A]/80 px-3 py-2 text-sm text-white/70">
              Live Demo — Property Manager Mission Control
            </p>
          </div>
        </div>
      </section>

      {/* 7. OUTCOMES */}
      <Section
        id="outcomes"
        eyebrow="What changes"
        title="Know what needs attention. Keep work moving. Operate with greater control."
        description="Outcome-led capabilities grounded in the shipped Property Manager loop, portals, and Facility Operations work-order product."
      >
        <ul className="grid gap-8 sm:grid-cols-2">
          {OUTCOMES.map((item) => (
            <li key={item.title} className="max-w-md space-y-2">
              <h3 className="font-display text-lg font-semibold">{item.title}</h3>
              <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
                {item.detail}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      {/* 8. DIFFERENTIATION — more concrete */}
      <Section
        id="differentiation"
        eyebrow="Built around the operation"
        title="M.P.A. is designed to keep the operation visible and workable day to day."
        description="Not simply another place to manage individual rental tasks."
      >
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
              Task-oriented software
            </h3>
            <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)] md:text-base">
              Helps manage individual rental activities — collect rent, log a repair, send a message —
              often as separate jobs.
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
              M.P.A. operating loop
            </h3>
            <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)] md:text-base">
              Designed around the loop that connects property → people → resident → lease → rent →
              maintenance → vendor → resolution → ongoing attention in Mission Control.
            </p>
          </div>
        </div>
      </Section>

      {/* 9. PRODUCT EXPERIENCE — evidence, not just CTA */}
      <Section
        id="experience"
        eyebrow="See it working"
        title="What using M.P.A. actually looks like"
        description="Mission Control keeps the day prioritized. Maintenance Command Center keeps residential work moving from request to resolution."
      >
        <div className="space-y-8">
          <LandingProductFrame
            eyebrow="Maintenance workflow"
            title="Maintenance Command Center"
            description="Review requests, prioritize, assign, monitor progress, and close — including vendor handoffs."
            caption="Illustrative layout of the shipped Maintenance Command Center — not a live screenshot."
          >
            <LandingMaintenancePreview className="rounded-none border-0 shadow-none" />
          </LandingProductFrame>
          <div className="max-w-2xl space-y-3">
            <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)] md:text-base">
              Together with Mission Control above, an operator can see what needs attention, move
              maintenance work without losing context, and return for the next clear action.
            </p>
            <LandingCtaRow isAuthenticated={isAuthenticated} />
          </div>
        </div>
      </Section>

      {/* 10. PRODUCT SELECTION */}
      <Section
        id="choose-platform"
        eyebrow="Choose your platform"
        title="Three products. One operating approach."
        description="Start with the product that matches your team. Enterprise remains an optional sales path — not a fourth self-serve product."
      >
        <ul className="grid gap-4 md:grid-cols-3">
          {PRODUCT_SKUS.map((sku) => {
            const summary = SKU_SUMMARIES[sku];
            const copy = PRODUCT_LANDING_COPY[sku];
            return (
              <li
                key={sku}
                className="flex flex-col border-t-2 border-[var(--mpa-color-brand-primary)] pt-4"
              >
                <h3 className="font-display text-xl font-semibold">{summary.label}</h3>
                <p className="mt-2 text-2xl font-semibold tabular-nums">
                  {copy.priceLine}
                  <span className="ml-2 text-sm font-normal text-[var(--mpa-color-text-secondary)]">
                    {copy.annualLine}
                  </span>
                </p>
                <p className="mt-1 text-xs text-[var(--mpa-color-text-muted)]">
                  {PUBLIC_PRICING_MODEL_COPY.pmIncludes}
                </p>
                <p className="mt-3 flex-1 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
                  {copy.promise}
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  <Link href={productGetStartedHref(sku)} className={marketingPrimaryCtaClass}>
                    Get started with {summary.label}
                  </Link>
                  <Link
                    href={acquisitionHref("pricing", sku)}
                    className={marketingSecondaryCtaClass}
                  >
                    View pricing
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* 11. PRICING / VALUE BRIDGE */}
      <section
        id="pricing-value"
        className="border-y border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)]"
      >
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-14 md:px-6 md:py-16">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
              Transparent value
            </p>
            <h2 className="font-display text-2xl font-semibold md:text-3xl">
              Clear pricing for operating capacity — not seat theater.
            </h2>
            <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)] md:text-base">
              Property Manager and Facility Operations start at {PUBLIC_PRICING_MODEL_COPY.pmHeadline}.
              Complete Platform is {PUBLIC_PRICING_MODEL_COPY.completeHeadlineMonthly} (
              {COMPLETE_ANNUAL_DISPLAY}). Each plan includes up to{" "}
              {PUBLIC_PRICING_MODEL_COPY.includedUnits} managed units.
            </p>
          </div>
          <ul className="grid gap-4 text-sm leading-6 text-[var(--mpa-color-text-secondary)] md:grid-cols-3">
            <li>
              <p className="font-semibold text-[var(--mpa-color-text-primary)]">
                Additional capacity
              </p>
              <p className="mt-1">{PUBLIC_PRICING_MODEL_COPY.additionalCapacityLine}</p>
              <p className="mt-1">{PUBLIC_PRICING_MODEL_COPY.additionalCapacityAnnualLine}</p>
            </li>
            <li>
              <p className="font-semibold text-[var(--mpa-color-text-primary)]">Trial</p>
              <p className="mt-1">{PUBLIC_PRICING_MODEL_COPY.trialEligible}</p>
            </li>
            <li>
              <p className="font-semibold text-[var(--mpa-color-text-primary)]">Above 500 units</p>
              <p className="mt-1">{PUBLIC_PRICING_MODEL_COPY.trialIneligible}</p>
            </li>
          </ul>
          <Link href="/pricing" className={marketingPrimaryCtaClass}>
            View full pricing
          </Link>
        </div>
      </section>

      {/* 12. TRUST */}
      <Section
        id="trust"
        eyebrow="Trust without theater"
        title="Honest scope. Transparent rules. A clear path in."
        description="These are the signals you can verify today — without invented logos or savings percentages."
      >
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Transparent pricing",
              detail:
                "Published base prices, unit capacity rules, and Additional Unit Capacity in plain language."
            },
            {
              title: "Transparent trial",
              detail: "30 days for ≤500 managed units. Card required. No trial above 500 units."
            },
            {
              title: "Clear product scope",
              detail:
                "Three real products. Facility Operations described as the shipped work-order product — not an oversold CMMS."
            },
            {
              title: "Live Demo",
              detail: "Explore Mission Control and product surfaces without creating an account when demo is available."
            },
            {
              title: "Clear post-checkout path",
              detail: "Confirm plan → secure checkout → account claim → Guided Setup → Mission Control."
            },
            {
              title: "Honest roadmap language",
              detail: "Background Screening is planned and called out as not available in Version 1.0."
            }
          ].map((item) => (
            <li key={item.title} className="space-y-1">
              <h3 className="font-display text-base font-semibold">{item.title}</h3>
              <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
                {item.detail}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      {/* 13. FAQ */}
      <Section id="faq" eyebrow="FAQ" title="Straight answers before you start">
        <dl className="space-y-5">
          {FAQ_ITEMS.map((item) => (
            <div
              key={item.q}
              className="max-w-3xl border-t border-[var(--mpa-color-border-subtle)] pt-4"
            >
              <dt className="font-semibold">{item.q}</dt>
              <dd className="mt-1 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* 14. FINAL CTA */}
      <section
        id="get-started"
        className="border-t border-[var(--mpa-color-border-subtle)] bg-[linear-gradient(145deg,#0B1F1A_0%,#0F6B56_55%,#1A2330_100%)]"
      >
        <div className="mx-auto max-w-6xl space-y-5 px-4 py-16 md:px-6 md:py-20">
          <p className="font-display text-3xl font-semibold text-white md:text-4xl">M.P.A.</p>
          <h2 className="max-w-2xl font-display text-2xl font-semibold text-white md:text-3xl">
            Run the operation with greater clarity and control.
          </h2>
          <p className="max-w-xl text-sm leading-6 text-white/75 md:text-base">
            Know what needs attention, keep work moving, and stop running the property operation from
            scattered tools and memory.
          </p>
          <LandingCtaRow isAuthenticated={isAuthenticated} variant="hero" showJourneyHint />
        </div>
      </section>
    </MarketingChrome>
  );
}
