import Link from "next/link";
import type { ReactNode } from "react";
import {
  PRODUCT_SKUS,
  PUBLIC_PRICING_MODEL_COPY,
  SKU_SUMMARIES,
  acquisitionHref,
  marketingModulesForOwner,
  marketingModulesForSku,
  publicPurchaseMotionForSku,
  skuComparisonRows,
  type ProductSku
} from "@mpa/shared";
import {
  MarketingChrome,
  marketingHeroSecondaryCtaClass,
  marketingPrimaryCtaClass,
  marketingSecondaryCtaClass
} from "./marketing-chrome";
import { marketingModuleDescription } from "./marketing-module-copy";
import {
  BACKGROUND_SCREENING_LABEL,
  FutureIntegrationsNote,
  PlannedIntegrationCell
} from "./future-integrations-note";

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
  children: ReactNode;
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
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-14 md:px-6 md:py-16">
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

function CapabilityList({
  modules
}: {
  modules: ReturnType<typeof marketingModulesForOwner>;
}) {
  return (
    <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {modules.map((module) => (
        <li key={module.id} className="border-t border-[var(--mpa-color-border-subtle)] pt-3">
          <h3 className="font-medium text-[var(--mpa-color-text-primary)]">{module.label}</h3>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            {marketingModuleDescription(module.id, module.description)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function productCheckoutHref(sku: ProductSku) {
  return acquisitionHref("questionnaire", {
    sku,
    billingCycle: "monthly"
  });
}

function PlatformHeroVisual() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] lg:block"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_35%,rgba(255,255,255,0.18),transparent_58%)]" />
      <div className="absolute bottom-[8%] right-[4%] w-[min(560px,90%)] origin-bottom-right motion-safe:animate-[mpa-rise_900ms_ease-out]">
        <div className="rounded-tl-lg border border-white/20 bg-[#0A1714]/55 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-white/35" />
            <span className="h-2 w-2 rounded-full bg-white/25" />
            <span className="h-2 w-2 rounded-full bg-white/15" />
            <span className="ml-2 text-[10px] font-medium uppercase tracking-[0.14em] text-white/55">
              Mission Control
            </span>
          </div>
          <div className="grid grid-cols-[0.9fr_1.4fr_1fr] gap-2">
            <div className="space-y-2">
              {["Work queue", "Vendors", "Units", "Billing"].map((label) => (
                <div
                  key={label}
                  className="rounded border border-white/10 bg-white/[0.06] px-2 py-2 text-[10px] text-white/70"
                >
                  {label}
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded border border-white/10 bg-gradient-to-br from-white/15 to-white/[0.04]" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-20 rounded border border-white/10 bg-white/[0.07]" />
                <div className="h-20 rounded border border-white/10 bg-white/[0.05]" />
              </div>
              <div className="h-10 rounded border border-white/10 bg-white/[0.06]" />
            </div>
            <div className="space-y-2">
              <div className="rounded border border-emerald-200/20 bg-emerald-300/10 px-2 py-2 text-[10px] text-emerald-50/90">
                Open work orders
              </div>
              <div className="rounded border border-white/10 bg-white/[0.06] px-2 py-2 text-[10px] text-white/65">
                Vendor status
              </div>
              <div className="rounded border border-white/10 bg-white/[0.06] px-2 py-2 text-[10px] text-white/65">
                Portfolio pulse
              </div>
              <div className="h-16 rounded border border-white/10 bg-white/[0.04]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PROBLEMS = [
  {
    title: "Too many disconnected tools",
    detail: "Rent software, maintenance apps, spreadsheets, texts, and email — none of them share one operational picture."
  },
  {
    title: "Work orders buried in messages",
    detail: "Requests live in inboxes and chat threads instead of a trackable workflow with clear ownership."
  },
  {
    title: "Vendors hard to follow",
    detail: "Assignments, status, and follow-ups scatter across phones and notes until something slips."
  },
  {
    title: "Maintenance status unclear",
    detail: "Owners and managers ask for updates because there is no shared view of what is open, waiting, or done."
  },
  {
    title: "Property and unit data scattered",
    detail: "Critical details live in folders, sheets, and memory — not where the next decision is made."
  },
  {
    title: "Teams stuck in repetitive admin",
    detail: "Growing portfolios create more copy-paste work instead of clearer operations."
  }
] as const;

const OUTCOMES = [
  {
    title: "Save time",
    detail: "Move work through shared queues instead of chasing updates across channels."
  },
  {
    title: "Save money",
    detail: "Reduce tool sprawl and catch operational leakage before it becomes expensive."
  },
  {
    title: "Reduce risk",
    detail: "Keep status, ownership, and documentation visible so fewer things fall through."
  },
  {
    title: "Improve communication",
    detail: "Give managers, facility teams, owners, residents, and vendors a clearer operating thread."
  },
  {
    title: "Improve operations",
    detail: "Run day-to-day property work from one workflow-first system — not a pile of modules."
  },
  {
    title: "Remove unnecessary work",
    detail: "Stop re-entering the same facts into five places just to keep the operation moving."
  }
] as const;

const OPERATING_MODEL = [
  "Property operations",
  "Maintenance",
  "Work orders",
  "Vendors",
  "Billing",
  "Team workflows",
  "Operational visibility"
] as const;

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Choose your platform",
    detail: "Property Manager, Facility Operations, or Complete — matched to how your team actually works."
  },
  {
    step: "2",
    title: "Confirm units and price",
    detail: "See managed-unit pricing and Additional Unit Capacity before you pay. No surprise math at Checkout."
  },
  {
    step: "3",
    title: "Stripe Checkout",
    detail: "Pay securely. Qualifying plans with 500 or fewer managed units include 30 DAYS FREE with a payment card on file."
  },
  {
    step: "4",
    title: "Create account & Guided Setup",
    detail: "Claim your workspace, complete Guided Setup, then enter Mission Control ready to operate."
  }
] as const;

const COMPARISON_ROWS = [
  {
    topic: "Primary focus",
    mpa: "Workflow-first property operations platform",
    rentredi: "Often associated with rent collection and landlord tooling"
  },
  {
    topic: "Product shape",
    mpa: "Property Manager, Facility Operations, and Complete Platform",
    rentredi: "Typically positioned around rental management needs"
  },
  {
    topic: "Operations depth",
    mpa: "Maintenance, work orders, vendors, and day-to-day operational visibility",
    rentredi: "Strong when the main need is rent-centric workflows"
  },
  {
    topic: "Pricing model",
    mpa: "Transparent unit-volume pricing with Additional Unit Capacity disclosed up front",
    rentredi: "Evaluate their published plans against your portfolio size"
  },
  {
    topic: "Try before full commitment",
    mpa: "30 DAYS FREE for qualifying plans with 500 or fewer managed units (card required)",
    rentredi: "Compare their current trial or demo options"
  },
  {
    topic: "What happens after signup",
    mpa: "Checkout → create account → Guided Setup → Mission Control",
    rentredi: "Follow their published onboarding path"
  }
] as const;

const TRUST_POINTS = [
  {
    title: "Honest product lineup",
    detail:
      "Three platforms only — Property Manager, Facility Operations, and Complete. Enterprise is a sales path, not a fake SaaS tier."
  },
  {
    title: "Transparent commercial path",
    detail:
      "Landing → product → monthly/annual → Stripe Checkout → account → Guided Setup → Mission Control."
  },
  {
    title: "No invented capabilities",
    detail:
      "Pricing, capacity, and trial rules come from the same commercial model used at Checkout — not marketing-only numbers."
  },
  {
    title: "Live Demo when you want to look first",
    detail:
      "Explore a controlled demonstration environment before you buy — separate from your paid workspace."
  }
] as const;

export function PublicLandingPage({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const pmModules = marketingModulesForOwner("property_manager");
  const foModules = marketingModulesForOwner("facility_operations");
  const comparison = skuComparisonRows();
  const pricing = PUBLIC_PRICING_MODEL_COPY;

  return (
    <MarketingChrome isAuthenticated={isAuthenticated}>
      <a
        href="#problem"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to why operators switch
      </a>

      {/* Hero — brand + one outcome headline + CTAs + full-bleed platform atmosphere */}
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
        <svg
          aria-hidden
          className="absolute bottom-0 left-0 h-[55%] w-[min(520px,70vw)] text-white/[0.07] motion-safe:animate-[mpa-rise_1100ms_ease-out]"
          viewBox="0 0 520 420"
          fill="currentColor"
        >
          <rect x="40" y="140" width="100" height="280" />
          <rect x="160" y="80" width="120" height="340" />
          <rect x="300" y="120" width="110" height="300" />
          <rect x="430" y="180" width="70" height="240" />
        </svg>
        <PlatformHeroVisual />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-28 md:px-6 md:pb-24">
          <div className="max-w-xl space-y-5 motion-safe:animate-[mpa-rise_700ms_ease-out]">
            <p className="font-display text-4xl font-semibold tracking-tight text-white md:text-6xl">
              M.P.A.
            </p>
            <h1 className="font-display text-2xl font-semibold leading-tight text-white/95 md:text-[2rem] md:leading-snug">
              Run property operations with less admin — and one clear system of record.
            </h1>
            <p className="max-w-md text-base leading-relaxed text-white/80 md:text-lg">
              A workflow-first Property Operations Platform for property managers, owners, and
              facility teams who are tired of stitching tools together.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              {isAuthenticated ? (
                <Link href="/dashboard" className={marketingPrimaryCtaClass}>
                  Open workspace
                </Link>
              ) : (
                <Link href={acquisitionHref("questionnaire")} className={marketingPrimaryCtaClass}>
                  Get Started
                </Link>
              )}
              <a href="#how-it-works" className={marketingHeroSecondaryCtaClass}>
                See How It Works
              </a>
            </div>
          </div>
        </div>
      </section>

      <Section
        id="who"
        eyebrow="Who it is for"
        title="Built for the people who keep properties running."
        description="Property managers, owners and operators, facility and maintenance teams, and growing property operations orgs — without making you guess which product fits."
      >
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              role: "Property managers",
              fit: "Portfolio ops, residents, leasing, vendors, and financial operations."
            },
            {
              role: "Owners / operators",
              fit: "Visibility into what is happening across units, work, and money."
            },
            {
              role: "Facility / maintenance",
              fit: "Work orders, assets, preventive maintenance, and building systems."
            },
            {
              role: "Growing ops teams",
              fit: "Start with PM or FO — or run both under Complete Platform."
            }
          ].map((item) => (
            <li key={item.role} className="border-t-2 border-[var(--mpa-color-brand-primary)] pt-4">
              <h3 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
                {item.role}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
                {item.fit}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="problem"
        tone="muted"
        eyebrow="The real problem"
        title="Your day is not a software category. It is operational friction."
        description="If this feels familiar, you are not alone — and you do not need another disconnected app."
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
        title="One platform that connects the work — not another silo."
        description="M.P.A. brings property operations, maintenance, vendors, billing, and team workflows into one operating model so you stop stitching systems together by hand."
      >
        <div className="overflow-hidden rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)]">
          <div className="border-b border-[var(--mpa-color-border-subtle)] bg-[linear-gradient(120deg,#0B1F1A,#0F6B56)] px-5 py-4">
            <p className="font-display text-lg font-semibold text-white">One platform</p>
            <p className="mt-1 text-sm text-white/75">
              Property operations connected end to end — not a pile of separate products.
            </p>
          </div>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-4">
            {OPERATING_MODEL.map((item, index) => (
              <li
                key={item}
                className={`border-[var(--mpa-color-border-subtle)] px-5 py-4 text-sm font-medium text-[var(--mpa-color-text-primary)] ${
                  index < OPERATING_MODEL.length - 1 ? "sm:border-r" : ""
                } ${index < 4 ? "border-b lg:border-b-0" : ""} ${index === 3 ? "lg:border-r-0" : ""} ${
                  index >= 4 ? "border-t lg:border-t" : ""
                }`}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section
        id="why-mpa"
        tone="muted"
        eyebrow="Why M.P.A."
        title="One operational system instead of five workarounds."
        description="Most teams already pay for software. The cost is the glue work between rent tools, maintenance apps, spreadsheets, texts, email, and manual tracking."
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
                "Spreadsheets",
                "Text messages",
                "Email threads",
                "Manual tracking"
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
                Operational workflows in one system
              </p>
              <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
                Work orders, vendor follow-through, unit context, billing visibility, and team
                handoffs live where the work actually happens — so status is visible without another
                status meeting.
              </p>
            </div>
          </div>
        </div>

        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {OUTCOMES.map((item) => (
            <li key={item.title} className="space-y-1">
              <h3 className="font-display text-base font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
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
        id="choose-platform"
        eyebrow="Choose your platform"
        title="Three products. One operating system. Clear fit."
        description="You should not have to reverse-engineer which SKU matches your team. Start with the product that mirrors how you operate today."
      >
        <ul className="grid gap-6 lg:grid-cols-3">
          {PRODUCT_SKUS.map((sku) => {
            const summary = SKU_SUMMARIES[sku];
            const motion = publicPurchaseMotionForSku(sku);
            return (
              <li
                key={sku}
                className="flex flex-col border-t-2 border-[var(--mpa-color-brand-primary)] pt-5"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
                  {motion.availabilityLabel}
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold">{summary.label}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
                  {summary.description}
                </p>
                <p className="mt-4 text-sm font-medium text-[var(--mpa-color-text-primary)]">
                  {motion.explanation}
                </p>
                <p className="mt-2 text-xs text-[var(--mpa-color-text-muted)]">
                  {marketingModulesForSku(sku).length} included modules
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  <Link href={productCheckoutHref(sku)} className={marketingPrimaryCtaClass}>
                    Get started — {summary.label}
                  </Link>
                  <Link
                    href={acquisitionHref("pricing", sku)}
                    className={marketingSecondaryCtaClass}
                  >
                    View {summary.label} pricing
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section
        id="how-it-works"
        tone="muted"
        eyebrow="What happens if you sign up"
        title="A clear path from interest to Mission Control."
        description={pricing.journeyNote}
      >
        <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((item) => (
            <li key={item.step} className="space-y-2">
              <p className="font-display text-3xl font-semibold text-[var(--mpa-color-brand-primary)]">
                {item.step}
              </p>
              <h3 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
                {item.title}
              </h3>
              <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
                {item.detail}
              </p>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-3 pt-2">
          {!isAuthenticated ? (
            <Link href={acquisitionHref("questionnaire")} className={marketingPrimaryCtaClass}>
              Get Started
            </Link>
          ) : null}
          <Link href="/demo" className={marketingSecondaryCtaClass}>
            Explore Live Demo
          </Link>
        </div>
      </Section>

      <Section
        id="pricing"
        eyebrow="Exact pricing"
        title="Know what it costs — and what you get."
        description="Managed-unit pricing with Additional Unit Capacity disclosed before Checkout. These amounts match the commercial model used when you confirm your plan."
      >
        <div className="grid gap-8 lg:grid-cols-3">
          {PRODUCT_SKUS.map((sku) => {
            const summary = SKU_SUMMARIES[sku];
            const motion = publicPurchaseMotionForSku(sku);
            const headline =
              sku === "mpa_property_manager"
                ? pricing.pmHeadline
                : sku === "mpa_facility_operations"
                  ? `${pricing.foHeadlineMonthly} or ${pricing.foHeadlineAnnual}`
                  : `${pricing.completeHeadlineMonthly} or ${pricing.completeHeadlineAnnual}`;
            const includes =
              sku === "mpa_complete_platform"
                ? pricing.completeIncludes
                : sku === "mpa_facility_operations"
                  ? pricing.foIncludes
                  : pricing.pmIncludes;
            return (
              <div key={sku} className="border-t border-[var(--mpa-color-border-default)] pt-5">
                <h3 className="font-display text-lg font-semibold">{summary.label}</h3>
                <p className="mt-2 font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
                  From {headline}
                </p>
                <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">{includes}</p>
                <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
                  {pricing.additionalCapacityLine}
                </p>
                <p className="mt-3 text-xs leading-5 text-[var(--mpa-color-text-muted)]">
                  {motion.explanation}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 space-y-3 border-t border-[var(--mpa-color-border-subtle)] pt-6 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
          <p>
            <span className="font-semibold text-[var(--mpa-color-text-primary)]">
              {pricing.trialTitle}.
            </span>{" "}
            {pricing.trialEligible}
          </p>
          <p>{pricing.trialIneligible}</p>
          <p>{pricing.unitDefinition}</p>
          <p>{pricing.capacityChange}</p>
          <p>{pricing.annualNote}</p>
        </div>

        <div className="flex flex-wrap gap-3 pt-4">
          <Link href="/pricing" className={marketingPrimaryCtaClass}>
            Open full pricing calculator
          </Link>
          <Link href={acquisitionHref("questionnaire")} className={marketingSecondaryCtaClass}>
            Get Started
          </Link>
        </div>
      </Section>

      <Section
        id="compare"
        tone="muted"
        eyebrow="Why choose M.P.A."
        title="A fair look at M.P.A. vs RentRedi-style tools."
        description="This is not a takedown. RentRedi serves real landlord and rent workflows. The question is whether you need a rent-centric tool — or a workflow-first property operations platform."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--mpa-color-border-default)]">
                <th scope="col" className="py-3 pr-4 text-left font-semibold">
                  Decision point
                </th>
                <th scope="col" className="px-3 py-3 text-left font-semibold text-[var(--mpa-color-brand-primary)]">
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
                    className="py-3 pr-4 text-left font-medium text-[var(--mpa-color-text-primary)]"
                  >
                    {row.topic}
                  </th>
                  <td className="px-3 py-3 text-[var(--mpa-color-text-secondary)]">{row.mpa}</td>
                  <td className="px-3 py-3 text-[var(--mpa-color-text-secondary)]">
                    {row.rentredi}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-5 text-[var(--mpa-color-text-muted)]">
          Comparison language describes M.P.A.&apos;s product positioning and publicly framed
          category differences. Always verify a competitor&apos;s current features and pricing on
          their site before you decide.
        </p>
      </Section>

      <Section
        id="trust"
        eyebrow="Why you can trust the path"
        title="Clarity before complexity."
        description="Conversion should feel calm: honest products, transparent price, secure checkout, then Guided Setup into Mission Control."
      >
        <ul className="grid gap-6 sm:grid-cols-2">
          {TRUST_POINTS.map((item) => (
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
        id="property-manager"
        eyebrow="Property Manager"
        title="Portfolio operations for professional teams"
        description="Mission Control, properties, residents, leasing, maintenance, vendors, financial operations, and customer portals."
      >
        <CapabilityList modules={pmModules} />
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href={acquisitionHref("pricing", "mpa_property_manager")}
            className={marketingPrimaryCtaClass}
          >
            Property Manager pricing
          </Link>
        </div>
      </Section>

      <Section
        id="facility-operations"
        tone="muted"
        eyebrow="Facility Operations"
        title="Facility product for building teams"
        description="Work coverage, assets, inventory, preventive maintenance, safety, compliance, and building systems."
      >
        <CapabilityList modules={foModules} />
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href={acquisitionHref("pricing", "mpa_facility_operations")}
            className={marketingPrimaryCtaClass}
          >
            Facility Operations pricing
          </Link>
        </div>
      </Section>

      <Section
        id="complete-platform"
        eyebrow="Complete Platform"
        title="Both product homes, one organization"
        description="Property Manager and Facility Operations together with shared documents, communications, search, and identity."
      >
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Complete Platform includes every module from Property Manager and Facility Operations.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href={acquisitionHref("pricing", "mpa_complete_platform")}
            className={marketingPrimaryCtaClass}
          >
            Complete Platform pricing
          </Link>
        </div>
      </Section>

      <Section
        id="comparison"
        tone="muted"
        eyebrow="Platform inclusion"
        title="See what each platform includes"
        description="Compare capabilities across Property Manager, Facility Operations, and Complete Platform."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--mpa-color-border-default)]">
                <th scope="col" className="py-2 pr-3 text-left font-semibold">
                  Capability
                </th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  Property Manager
                </th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  Facility Operations
                </th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  Complete
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.id} className="border-b border-[var(--mpa-color-border-subtle)]">
                  <th scope="row" className="py-2 pr-3 text-left font-normal">
                    {row.label}
                  </th>
                  <td className="px-3 py-2">
                    {row.pm ? (
                      <>
                        <span aria-hidden>●</span>
                        <span className="sr-only">Included</span>
                      </>
                    ) : (
                      <>
                        <span aria-hidden>—</span>
                        <span className="sr-only">Not included</span>
                      </>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {row.fo ? (
                      <>
                        <span aria-hidden>●</span>
                        <span className="sr-only">Included</span>
                      </>
                    ) : (
                      <>
                        <span aria-hidden>—</span>
                        <span className="sr-only">Not included</span>
                      </>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {row.complete ? (
                      <>
                        <span aria-hidden>●</span>
                        <span className="sr-only">Included</span>
                      </>
                    ) : (
                      <>
                        <span aria-hidden>—</span>
                        <span className="sr-only">Not included</span>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="border-b border-[var(--mpa-color-border-subtle)]">
                <th scope="row" className="py-2 pr-3 text-left font-normal">
                  {BACKGROUND_SCREENING_LABEL}
                </th>
                <td className="px-3 py-2">
                  <PlannedIntegrationCell />
                </td>
                <td className="px-3 py-2">
                  <PlannedIntegrationCell />
                </td>
                <td className="px-3 py-2">
                  <PlannedIntegrationCell />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <FutureIntegrationsNote className="mt-4 border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-4 py-3" />
      </Section>

      <Section id="faq" eyebrow="FAQ" title="Straight answers">
        <dl className="space-y-5">
          {[
            {
              q: "What is M.P.A.?",
              a: "M.P.A. is a workflow-first Property Operations Platform — not traditional property-management software organized as disconnected modules. It helps property owners and teams run day-to-day operations with less administrative work and clearer visibility."
            },
            {
              q: "What can I buy online today?",
              a: `Property Manager from ${pricing.pmHeadline}, Facility Operations from ${pricing.foHeadlineMonthly} or ${pricing.foHeadlineAnnual}, and Complete Platform from ${pricing.completeHeadlineMonthly} or ${pricing.completeHeadlineAnnual} — each includes up to ${pricing.includedUnits} managed units. ${pricing.additionalCapacityLine}`
            },
            {
              q: "Is there a free trial?",
              a: pricing.trialEligible
            },
            {
              q: "How does checkout work?",
              a: "Review pricing, answer a short questionnaire, confirm your managed-unit plan, then pay securely with Stripe. After checkout you create your account, complete Guided Setup, and enter Mission Control."
            },
            {
              q: "Are background screening integrations available?",
              a: "Professional Background Screening integration is planned. M.P.A. continues expanding its connected property operations ecosystem — this is not available in Version 1.0 today."
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
        eyebrow="Why start now"
        title="Every week of tool sprawl is another week of invisible operational cost."
        description="If you already feel the friction — work buried in messages, unclear maintenance status, owners asking for updates — starting with a clear platform path is simpler than waiting for the next scramble."
      >
        <ul className="grid gap-4 text-sm text-white/80 sm:grid-cols-3">
          <li>
            <p className="font-semibold text-white">Qualifying trial</p>
            <p className="mt-1">{pricing.trialTitle} for ≤{pricing.includedUnits} managed units.</p>
          </li>
          <li>
            <p className="font-semibold text-white">Transparent price</p>
            <p className="mt-1">See capacity and totals before Checkout.</p>
          </li>
          <li>
            <p className="font-semibold text-white">Guided path in</p>
            <p className="mt-1">Checkout → account → Guided Setup → Mission Control.</p>
          </li>
        </ul>
        <div className="flex flex-wrap gap-3 pt-4">
          {isAuthenticated ? (
            <Link href="/dashboard" className={marketingPrimaryCtaClass}>
              Open workspace
            </Link>
          ) : (
            <Link href={acquisitionHref("questionnaire")} className={marketingPrimaryCtaClass}>
              Get Started
            </Link>
          )}
          <a
            href="#how-it-works"
            className="inline-flex h-11 items-center justify-center rounded-md border border-white/35 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            See How It Works
          </a>
          <Link
            href="/pricing"
            className="inline-flex h-11 items-center justify-center rounded-md border border-white/35 bg-transparent px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            View Pricing
          </Link>
        </div>
      </Section>

      <Section
        id="enterprise"
        eyebrow="Enterprise Solutions"
        title="For very large organizations"
        description="Need custom contracts, SSO, integrations, or dedicated onboarding? Enterprise is an optional path — not a product and not a pricing tier."
      >
        <div className="flex flex-wrap gap-3">
          <Link href="/enterprise" className={marketingPrimaryCtaClass}>
            Explore Enterprise Solutions
          </Link>
          <Link href="/pricing" className={marketingSecondaryCtaClass}>
            Back to platform pricing
          </Link>
        </div>
      </Section>
    </MarketingChrome>
  );
}
