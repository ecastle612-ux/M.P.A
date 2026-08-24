import Link from "next/link";
import { exampleFoundingCommission } from "@mpa/shared";
import {
  MarketingChrome,
  marketingNarrowMainClass,
  marketingPrimaryCtaClass,
  marketingSecondaryCtaClass
} from "./marketing-chrome";
import { PartnersApplicationForm } from "./partners-application-form";

const cardClass =
  "rounded-lg border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5 shadow-[0_1px_0_rgba(18,21,26,0.04)]";

const STEPS = [
  {
    title: "Join the M.P.A. Partner Program",
    body: "Apply and become an approved M.P.A. partner."
  },
  {
    title: "Introduce M.P.A.",
    body: "Share your unique referral link with property owners, managers, and organizations."
  },
  {
    title: "Customer Subscribes",
    body: "When an attributed customer becomes a paying M.P.A. subscriber, the referral becomes commission-eligible."
  },
  {
    title: "Earn Commission",
    body: "Earn a percentage of qualifying M.P.A. subscription revenue actually collected."
  },
  {
    title: "Grow Together",
    body: "As M.P.A.'s service network develops, Certified Service Partners may also receive physical-service opportunities from participating M.P.A. customers. Service opportunities are not guaranteed."
  }
];

const SERVICE_EXAMPLES = [
  "maintenance",
  "repairs",
  "turnovers",
  "inspections",
  "cleaning",
  "landscaping",
  "HVAC",
  "plumbing",
  "electrical",
  "other approved property services"
];

export function PartnersPage({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const example = exampleFoundingCommission();
  const monthly = example.monthlyCommissionUsd.toFixed(2);
  const twelve = example.twelveMonthCommissionUsd.toFixed(2);

  return (
    <MarketingChrome isAuthenticated={isAuthenticated} denseNav>
      <main className={marketingNarrowMainClass}>
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            M.P.A. Partner Program
          </p>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">
            Grow Your Property Service Business With M.P.A.
          </h1>
          <p className="text-lg leading-7 text-[var(--mpa-color-text-secondary)]">
            You handle the physical work. M.P.A. powers the software behind it.
          </p>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            M.P.A. partners can use existing customer relationships to introduce M.P.A. while gaining
            access to software tools and future service opportunities. Partners remain independent
            businesses — not employees, agents, franchisees, or guaranteed representatives of M.P.A.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#apply" className={marketingPrimaryCtaClass}>
              Apply to become a partner
            </a>
            <a href="#how-it-works" className={marketingSecondaryCtaClass}>
              How the partnership works
            </a>
          </div>
        </header>

        <section className={cardClass} aria-labelledby="who-heading">
          <h2 id="who-heading" className="font-display text-2xl font-semibold">
            Built for the physical side of property operations
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            The Partner Program is designed primarily for companies that provide real-world property
            and facility services, while M.P.A. provides the software infrastructure — operations,
            work orders, documentation, attachments, receipts, vendor management, and financial
            tools where entitled.
          </p>
          <ul className="mt-4 grid gap-2 text-sm text-[var(--mpa-color-text-secondary)] sm:grid-cols-2">
            <li>Maintenance and property service companies</li>
            <li>Handyman and turnover / make-ready companies</li>
            <li>Cleaning and inspection companies</li>
            <li>Landscaping and snow companies</li>
            <li>HVAC, plumbing, and electrical service companies</li>
            <li>Facility-service and property-management organizations</li>
          </ul>
        </section>

        <section id="how-it-works" className="space-y-4" aria-labelledby="how-heading">
          <h2 id="how-heading" className="font-display text-2xl font-semibold">
            How the partnership works
          </h2>
          <ol className="grid gap-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className={cardClass}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
                  Step {index + 1}
                </p>
                <h3 className="mt-1 font-display text-lg font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={cardClass} aria-labelledby="founding-heading">
          <h2 id="founding-heading" className="font-display text-2xl font-semibold">
            Founding Partner commission
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            Approved Founding Partners earn <strong>{example.percent}%</strong> commission on
            qualifying M.P.A. subscription revenue collected from referred customers for their first{" "}
            <strong>{example.months} paid months</strong>.
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            Commission is calculated from subscription revenue actually collected by M.P.A. It is
            not guaranteed income. Free accounts, complimentary tester periods, refunded payments,
            chargebacks, failed payments, taxes, and fraudulent or self-referral activity are not
            commissionable. This is not a lifetime commission.
          </p>
          <div className="mt-4 rounded-md bg-[var(--mpa-color-bg-subtle,#F7F8FA)] p-4 text-sm leading-6">
            <p className="font-semibold">Example only — not guaranteed earnings</p>
            <p className="mt-1 text-[var(--mpa-color-text-secondary)]">
              A partner refers a customer who purchases an eligible M.P.A. subscription for $
              {example.monthlyUsd}/month. At {example.percent}% commission, the partner earns $
              {monthly} for each qualifying paid month. Over {example.months} qualifying paid
              months: up to ${twelve}. If the customer&apos;s subscription changes, commission is
              based on the actual eligible subscription revenue collected.
            </p>
          </div>
          <p className="mt-3 text-sm font-semibold">No upfront Partner Program fee.</p>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            Partner software access and customer subscription pricing remain governed by their
            applicable M.P.A. plan or offer.
          </p>
        </section>

        <section className={cardClass} aria-labelledby="payout-heading">
          <h2 id="payout-heading" className="font-display text-2xl font-semibold">
            Payout timing
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            <li>Commissions accrue after qualifying subscription payments are successfully collected.</li>
            <li>Payouts are subject to validation.</li>
            <li>Refunded or charged-back amounts are not commissionable.</li>
            <li>Payout timing and method are communicated to approved partners.</li>
          </ul>
          <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">
            M.P.A. does not advertise or offer instant payouts. Commission tracking is not automatic
            money movement.
          </p>
        </section>

        <section className={cardClass} aria-labelledby="network-heading">
          <h2 id="network-heading" className="font-display text-2xl font-semibold">
            Reciprocal service opportunities
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            Eligible Certified Service Partners may receive service opportunities as the M.P.A.
            Partner Network expands. Examples include {SERVICE_EXAMPLES.join(", ")}.
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            M.P.A. does not guarantee leads, jobs, volume, territories, or revenue.
          </p>
        </section>

        <section className={cardClass} aria-labelledby="portal-heading">
          <h2 id="portal-heading" className="font-display text-2xl font-semibold">
            Your Company. Your Customers. Powered by M.P.A.
          </h2>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-muted)]">
            Planned — not Production-live
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            Certified Service Partners are planned to receive branded customer request portals such
            as <code className="text-xs">my-property-assistant.com/request/your-company</code>.
            Customers will eventually be able to submit maintenance and service requests,
            descriptions, photos and videos, and property or unit information through that
            partner-specific URL.
          </p>
        </section>

        <section className={cardClass} aria-labelledby="founding-program-heading">
          <h2 id="founding-program-heading" className="font-display text-2xl font-semibold">
            Founding Partner Program
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            Because the program is being introduced during M.P.A.&apos;s early growth period, early
            approved partners can help shape the Partner Program, provide product and workflow
            feedback, receive early access to partner capabilities, establish their company within
            the developing M.P.A. Partner Network, and participate under the initial Founding
            Partner commission structure.
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            Founding participation is not permanent exclusivity and does not include protected
            territories.
          </p>
        </section>

        <section id="apply" className="space-y-4" aria-labelledby="apply-heading">
          <h2 id="apply-heading" className="font-display text-2xl font-semibold">
            Apply to Become an M.P.A. Partner
          </h2>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            Tell us about your company. M.P.A. reviews every application. Partner type is assigned
            by M.P.A. after review.
          </p>
          <div className={cardClass}>
            <PartnersApplicationForm />
          </div>
        </section>

        <section id="program-terms" className="space-y-2 text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
          <h2 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
            Partner Program notes
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Partners are independent businesses. Approval is required.</li>
            <li>Commissions apply only to qualifying collected subscription revenue.</li>
            <li>Service opportunities are not guaranteed.</li>
            <li>M.P.A. may review fraudulent or invalid referrals.</li>
            <li>Program terms may apply and can be updated as the program matures.</li>
          </ul>
          <p>
            Full Partner Program Terms will be published here. Existing site{" "}
            <Link href="/terms" className="underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline">
              Privacy
            </Link>{" "}
            continue to apply to M.P.A. software.
          </p>
        </section>
      </main>
    </MarketingChrome>
  );
}
