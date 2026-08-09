import Link from "next/link";
import type { ReactNode } from "react";
import {
  SKU_SUMMARIES,
  PRODUCT_SKUS,
  acquisitionHref,
  marketingModulesForOwner,
  marketingModulesForSku,
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
  modules
}: {
  modules: ReturnType<typeof marketingModulesForOwner>;
}) {
  return (
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
  );
}

function productCheckoutHref(sku: ProductSku) {
  return acquisitionHref("checkout", {
    sku,
    billingCycle: "monthly"
  });
}

export function PublicLandingPage({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const pmModules = marketingModulesForOwner("property_manager");
  const foModules = marketingModulesForOwner("facility_operations");
  const comparison = skuComparisonRows();

  return (
    <MarketingChrome isAuthenticated={isAuthenticated}>
      <a
        href="#choose-platform"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to choose your platform
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
              Choose Property Manager, Facility Operations, or Complete Platform — then monthly or
              annual billing.
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
              <Link href="/pricing" className={marketingHeroSecondaryCtaClass}>
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Section
        id="choose-platform"
        eyebrow="Choose Your Platform"
        title="Three platforms. One operating system."
        description="Start with the product that matches your team."
      >
        <ul className="grid gap-4 md:grid-cols-3">
          {PRODUCT_SKUS.map((sku) => {
            const summary = SKU_SUMMARIES[sku];
            return (
              <li
                key={sku}
                className="flex flex-col rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5"
              >
                <h3 className="font-display text-xl font-semibold">{summary.label}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
                  {summary.description}
                </p>
                <p className="mt-4 text-xs text-[var(--mpa-color-text-muted)]">
                  {marketingModulesForSku(sku).length} included modules
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    href={acquisitionHref("pricing", sku)}
                    className={marketingPrimaryCtaClass}
                  >
                    View pricing
                  </Link>
                  <Link href={productCheckoutHref(sku)} className={marketingSecondaryCtaClass}>
                    Confirm Plan
                  </Link>
                </div>
              </li>
            );
          })}
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
        eyebrow="Feature comparison"
        title="See what each platform includes"
        description="Compare capabilities across Property Manager, Facility Operations, and Complete Platform."
      >
        <div className="overflow-x-auto rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)]">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead className="bg-[var(--mpa-color-bg-subtle,#F7F8FA)]">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
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
                <tr key={row.id} className="border-t border-[var(--mpa-color-border-subtle)]">
                  <th scope="row" className="px-3 py-2 text-left font-normal">
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
              <tr className="border-t border-[var(--mpa-color-border-subtle)]">
                <th scope="row" className="px-3 py-2 text-left font-normal">
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
        <FutureIntegrationsNote className="mt-4 rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)] px-4 py-3" />
      </Section>

      <Section id="faq" eyebrow="FAQ" title="Straight answers">
        <dl className="space-y-4">
          {[
            {
              q: "What can I buy?",
              a: "Property Manager, Facility Operations, or Complete Platform — each with monthly or annual billing."
            },
            {
              q: "Are background screening integrations available?",
              a: "Professional Background Screening integration is planned. M.P.A. continues expanding its connected property operations ecosystem — this is not available in Version 1.0 today."
            },
            {
              q: "How does checkout work?",
              a: "Choose your platform and billing cycle, confirm your plan, then pay securely with Stripe where self-service checkout is supported. Your workspace is prepared after payment."
            },
            {
              q: "What is Enterprise?",
              a: "Enterprise is an optional purchasing and onboarding path for very large organizations that need custom contracts, SSO, integrations, or dedicated onboarding — not a separate product."
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
