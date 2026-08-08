import Link from "next/link";
import type { ReactNode } from "react";
import {
  SKU_SUMMARIES,
  PRODUCT_SKUS,
  PROPERTY_LIMITS,
  SEAT_LIMITS,
  acquisitionHref,
  marketingModulesForOwner,
  marketingModulesForSku,
  requiresEnterpriseMotion,
  skuComparisonRows
} from "@mpa/shared";
import {
  MarketingChrome,
  marketingHeroSecondaryCtaClass,
  marketingPrimaryCtaClass,
  marketingSecondaryCtaClass
} from "./marketing-chrome";
import { marketingModuleDescription } from "./marketing-module-copy";

function Section({
  id,
  eyebrow,
  title,
  description,
  children
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="mx-auto max-w-6xl space-y-6 px-4 py-14 md:px-6 md:py-16">
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

function CapabilityList({
  modules,
  note
}: {
  modules: ReturnType<typeof marketingModulesForOwner>;
  note?: string;
}) {
  return (
    <div className="space-y-3">
      {note ? <p className="text-sm text-[var(--mpa-color-text-secondary)]">{note}</p> : null}
      <ul className="grid gap-3 sm:grid-cols-2">
        {modules.map((module) => (
          <li
            key={module.id}
            className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 py-3"
          >
            <h3 className="font-medium text-[var(--mpa-color-text-primary)]">{module.label}</h3>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              {marketingModuleDescription(module.id, module.description)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PublicLandingPage({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const pmModules = marketingModulesForOwner("property_manager");
  const foModules = marketingModulesForOwner("facility_operations");
  const sharedModules = marketingModulesForOwner("shared_platform");
  const comparison = skuComparisonRows();

  return (
    <MarketingChrome isAuthenticated={isAuthenticated}>
      <a
        href="#overview"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to platform overview
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
          className="absolute inset-0 opacity-[0.22] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px] motion-safe:animate-[mpa-grid-drift_28s_linear_infinite]"
        />
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 w-full max-w-3xl bg-[radial-gradient(ellipse_at_70%_40%,rgba(255,255,255,0.16),transparent_55%)]"
        />
        <svg
          aria-hidden
          className="absolute bottom-0 right-0 h-[70%] w-[min(720px,90vw)] text-white/15 motion-safe:animate-[mpa-rise_900ms_ease-out]"
          viewBox="0 0 720 520"
          fill="currentColor"
        >
          <rect x="80" y="160" width="140" height="360" />
          <rect x="240" y="90" width="170" height="430" />
          <rect x="430" y="140" width="150" height="380" />
          <rect x="600" y="210" width="100" height="310" />
        </svg>
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-28 md:px-6 md:pb-24">
          <div className="max-w-2xl space-y-5 motion-safe:animate-[mpa-rise_700ms_ease-out]">
            <p className="font-display text-4xl font-semibold tracking-tight text-white md:text-6xl">
              M.P.A.
            </p>
            <h1 className="max-w-xl font-display text-2xl font-semibold leading-tight text-white/95 md:text-3xl">
              Property operations, calm and complete.
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-white/80 md:text-lg">
              One enterprise platform for portfolio operations, facility products, and shared
              collaboration — built for professional teams.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              {isAuthenticated ? (
                <Link href="/dashboard" className={marketingPrimaryCtaClass}>
                  Open workspace
                </Link>
              ) : (
                <Link href={acquisitionHref("modules")} className={marketingPrimaryCtaClass}>
                  Get Started
                </Link>
              )}
              <Link href="/demo" className={marketingHeroSecondaryCtaClass}>
                Live Demo
              </Link>
              <Link href="/enterprise" className={marketingHeroSecondaryCtaClass}>
                Request Enterprise
              </Link>
              {!isAuthenticated ? (
                <Link href="/login" className={marketingHeroSecondaryCtaClass}>
                  Sign In
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <Section
        id="overview"
        eyebrow="Platform overview"
        title="Three commercial products. One operating system."
        description="Property Manager, Facility Operations, and Complete Platform share documents, communications, search, and identity — without duplicating homes."
      >
        <ul className="grid gap-4 md:grid-cols-3">
          {PRODUCT_SKUS.map((sku) => {
            const summary = SKU_SUMMARIES[sku];
            return (
              <li
                key={sku}
                className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5"
              >
                <h3 className="font-display text-xl font-semibold">{summary.label}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
                  {summary.description}
                </p>
                <Link
                  href={acquisitionHref("pricing", sku)}
                  className="mt-4 inline-flex text-sm font-semibold text-[var(--mpa-color-brand-primary)]"
                >
                  Compare this plan →
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section
        id="property-manager"
        eyebrow="Property Manager"
        title="Portfolio operations for professional teams"
        description="After you create your account and complete Guided Setup, Property Manager gives your team Mission Control, portfolio desks, financial operations, and customer portals."
      >
        <CapabilityList modules={pmModules} />
      </Section>

      <Section
        id="facility-operations"
        eyebrow="Facility Operations"
        title="Facility product for building teams"
        description="Facility Operations is available through Enterprise — not self-service checkout. Capital Projects are not offered today."
      >
        <CapabilityList
          modules={foModules}
          note="Our team activates Facility capabilities with your organization during Enterprise implementation."
        />
        <div className="pt-4">
          <Link
            href={acquisitionHref("enterprise", "mpa_facility_operations")}
            className={marketingSecondaryCtaClass}
          >
            Request Enterprise
          </Link>
        </div>
      </Section>

      <Section
        id="complete-platform"
        eyebrow="Complete Platform"
        title="Side-by-side plan comparison"
        description="Complete Platform combines Property Manager and Facility Operations — one organization, two product homes, and a shared platform foundation."
      >
        <div className="overflow-x-auto rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)]">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead className="bg-[var(--mpa-color-bg-subtle,#F7F8FA)]">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Capability</th>
                <th className="px-3 py-2 text-left font-semibold">Property Manager</th>
                <th className="px-3 py-2 text-left font-semibold">Facility Operations</th>
                <th className="px-3 py-2 text-left font-semibold">Complete</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.id} className="border-t border-[var(--mpa-color-border-subtle)]">
                  <td className="px-3 py-2">{row.label}</td>
                  <td className="px-3 py-2">{row.pm ? "●" : "—"}</td>
                  <td className="px-3 py-2">{row.fo ? "●" : "—"}</td>
                  <td className="px-3 py-2">{row.complete ? "●" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Complete Platform is available through Enterprise. Property Manager and Facility Operations
          homes are activated together during implementation.
        </p>
        <Link
          href={acquisitionHref("enterprise", "mpa_complete_platform")}
          className={marketingSecondaryCtaClass}
        >
          Request Enterprise
        </Link>
      </Section>

      <Section
        id="financial-operations"
        eyebrow="Financial Operations"
        title="Operational money — not a general ledger"
        description="Property Manager financial operations cover resident charges and ledgers, rent collection (card or manual), collections and late fees, vendor invoice approval, property money views, and owner summaries."
      >
        <ul className="grid gap-2 text-sm text-[var(--mpa-color-text-secondary)] md:grid-cols-2">
          {[
            "Financial Operations Command Center",
            "Resident billing & rent collection",
            "Collections desk & late fees",
            "Vendor invoice approval path",
            "Property money views",
            "Owner financial summary + CSV"
          ].map((item) => (
            <li
              key={item}
              className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2"
            >
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="portals"
        eyebrow="Portals"
        title="Resident, owner, and vendor access"
        description="Role portals are included with Property Manager and Complete Platform — not sold as separate products."
      >
        <ul className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Resident Portal",
              body: "Lease-linked tenant home with billing and maintenance handoffs."
            },
            {
              title: "Owner Portal",
              body: "Portfolio visibility for occupancy, cash, and maintenance attention."
            },
            {
              title: "Vendor Portal",
              body: "Assigned work-order updates after vendor assignment from Maintenance."
            }
          ].map((portal) => (
            <li
              key={portal.title}
              className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5"
            >
              <h3 className="font-display text-lg font-semibold">{portal.title}</h3>
              <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">{portal.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="mission-control"
        eyebrow="Mission Control & Assistant"
        title="Start every day from ranked attention"
        description="Mission Control is the trusted home for what needs attention — not an analytics dashboard. The Assistant surfaces clear next-action guidance from your operational signals."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5">
            <h3 className="font-semibold">Mission Control</h3>
            <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
              Immediate attention, waiting queues, recommended actions, and a clear next step for
              Property Manager. Facility Operations includes its own Mission Control home once your
              plan is active.
            </p>
          </div>
          <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5">
            <h3 className="font-semibold">M.P.A. Assistant</h3>
            <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
              Briefings and next-action guidance grounded in your desks — practical recommendations,
              not speculation.
            </p>
          </div>
        </div>
      </Section>

      <Section
        id="shared-platform"
        eyebrow="Shared platform"
        title="Documents, communications, search, audit, notifications"
        description="Shared capabilities available across your entitled products."
      >
        <CapabilityList modules={sharedModules} />
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Search / ⌘K", body: "Command search across the modules your plan includes." },
            { title: "Audit & timeline", body: "Event trails on property, lease, finance, and work orders." },
            { title: "Notifications", body: "Alerts for maintenance, payments, and inbox activity." },
            {
              title: "Master Admin",
              body: "M.P.A. operator headquarters — not a customer product."
            }
          ].map((item) => (
            <li
              key={item.title}
              className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4"
            >
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="mt-1 text-xs leading-5 text-[var(--mpa-color-text-secondary)]">{item.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="pricing"
        eyebrow="Pricing preview"
        title="Property Manager self-serve. Facility and Complete via Enterprise."
        description="Choose Professional or Business for Property Manager, then confirm and pay securely with Stripe. Facility Operations and Complete Platform follow the Enterprise path — not self-service checkout."
      >
        <ul className="grid gap-4 md:grid-cols-3">
          {PRODUCT_SKUS.map((sku) => {
            const summary = SKU_SUMMARIES[sku];
            const count = marketingModulesForSku(sku).length;
            const enterprise = requiresEnterpriseMotion(sku);
            return (
              <li
                key={sku}
                className="flex flex-col rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5"
              >
                <h3 className="font-display text-xl font-semibold">{summary.label}</h3>
                <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">{summary.description}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
                  {count} included modules
                </p>
                {enterprise ? (
                  <>
                    <p className="mt-1 text-lg font-semibold text-[var(--mpa-color-text-primary)]">
                      Enterprise path
                    </p>
                    <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                      Sales-led implementation — no public Stripe Checkout.
                    </p>
                    <Link
                      href={acquisitionHref("enterprise", sku)}
                      className={`${marketingPrimaryCtaClass} mt-4`}
                    >
                      Request Enterprise
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-lg font-semibold text-[var(--mpa-color-text-primary)]">
                      Professional · Business
                    </p>
                    <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                      {SEAT_LIMITS.professional}–{SEAT_LIMITS.business} seats ·{" "}
                      {PROPERTY_LIMITS.professional}–{PROPERTY_LIMITS.business} properties · Stripe
                      Checkout
                    </p>
                    <Link
                      href={acquisitionHref("pricing", sku)}
                      className={`${marketingPrimaryCtaClass} mt-4`}
                    >
                      Compare plans
                    </Link>
                    <Link
                      href={acquisitionHref("checkout", {
                        sku,
                        planTier: "professional",
                        billingCycle: "monthly"
                      })}
                      className={`${marketingSecondaryCtaClass} mt-2`}
                    >
                      Confirm Plan
                    </Link>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </Section>

      <Section
        id="demo"
        eyebrow="Demo CTA"
        title="Try the Live Demo before you subscribe"
        description="Explore Property Manager, Facility Operations, and Complete Platform with demonstration data — no account and no payment."
      >
        <div className="flex flex-wrap gap-3">
          <Link href="/demo" className={marketingPrimaryCtaClass}>
            Open Live Demo
          </Link>
          <Link
            href={acquisitionHref("pricing", "mpa_property_manager")}
            className={marketingSecondaryCtaClass}
          >
            Subscribe to Property Manager
          </Link>
        </div>
      </Section>

      <Section
        id="enterprise"
        eyebrow="Enterprise CTA"
        title="Facility Operations and Complete Platform"
        description="High-touch Enterprise path: consultation, proposal, contract, then implementation. Never uses public self-serve Checkout."
      >
        <div className="flex flex-wrap gap-3">
          <Link href="/enterprise" className={marketingPrimaryCtaClass}>
            Request Enterprise
          </Link>
          <Link
            href={acquisitionHref("enterprise", "mpa_facility_operations")}
            className={marketingSecondaryCtaClass}
          >
            Facility Operations
          </Link>
          <Link
            href={acquisitionHref("enterprise", "mpa_complete_platform")}
            className={marketingSecondaryCtaClass}
          >
            Complete Platform
          </Link>
        </div>
      </Section>

      <Section
        id="journey"
        eyebrow="Customer journey"
        title="From landing to Mission Control"
        description="Self-serve Property Manager path — or fork to Enterprise when Facility or Complete is required."
      >
        <ol className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          {[
            "Choose modules",
            "Compare Professional / Business",
            "Confirm Plan",
            "Stripe Checkout",
            "Claim workspace",
            "Guided Setup → Mission Control"
          ].map((step, index) => (
            <li
              key={step}
              className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 py-3 text-sm"
            >
              <span className="text-xs font-semibold text-[var(--mpa-color-text-muted)]">
                Step {index + 1}
              </span>
              <p className="mt-1 font-medium">{step}</p>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-3">
          <Link href={acquisitionHref("modules")} className={marketingPrimaryCtaClass}>
            Get started
          </Link>
          <Link href="/demo" className={marketingSecondaryCtaClass}>
            Live Demo
          </Link>
          <Link href="/enterprise" className={marketingSecondaryCtaClass}>
            Request Enterprise
          </Link>
        </div>
      </Section>

      <Section
        id="security"
        eyebrow="Enterprise security"
        title="Access control that protects every organization"
        description="M.P.A. is built so teams only see the products and modules included in their plan."
      >
        <ul className="grid gap-3 md:grid-cols-2">
          {[
            "Plan-based access on every customer workspace",
            "Search only shows modules included in your plan",
            "Customers cannot change their own subscription plan",
            "Operator tools are reserved for M.P.A. staff",
            "Payment credentials stay on secure servers",
            "Multi-tenant organization membership model"
          ].map((item) => (
            <li
              key={item}
              className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 py-3 text-sm"
            >
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="faq" eyebrow="FAQ" title="Straight answers">
        <dl className="space-y-4">
          {[
            {
              q: "Is Capital Projects available?",
              a: "No. Capital Projects are not part of current customer offers."
            },
            {
              q: "Can I buy online with a credit card today?",
              a: "Yes for Property Manager Professional and Business — Confirm Plan opens secure Stripe Checkout, then automatic workspace provisioning. Facility Operations and Complete Platform use Request Enterprise, not public Checkout."
            },
            {
              q: "What happens after payment?",
              a: "Stripe confirms the subscription, provisioning prepares your organization, you claim ownership with the checkout email, complete Guided Setup, and enter Mission Control."
            },
            {
              q: "Is Master Admin something customers buy?",
              a: "No. Master Admin is M.P.A. operator headquarters — not a customer product."
            }
          ].map((item) => (
            <div
              key={item.q}
              className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-4"
            >
              <dt className="font-semibold">{item.q}</dt>
              <dd className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{item.a}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <section className="border-t border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-10 md:px-6">
          <div>
            <h2 className="font-display text-2xl font-semibold">Ready when you are.</h2>
            <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
              Modules → Pricing → Confirm Plan → Stripe Checkout — or try the Live Demo first.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={acquisitionHref("modules")} className={marketingPrimaryCtaClass}>
              Choose Modules
            </Link>
            <Link href="/demo" className={marketingSecondaryCtaClass}>
              Live Demo
            </Link>
            <Link href="/enterprise" className={marketingSecondaryCtaClass}>
              Request Enterprise
            </Link>
          </div>
        </div>
      </section>
    </MarketingChrome>
  );
}
