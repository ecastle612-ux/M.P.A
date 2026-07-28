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

const title = "Property & facility operations platform";
const description = `${MPA_BRAND_NAME} is a modular SaaS platform for professional property and facility operations — subscribe, set up, and run the portfolio.`;

export const metadata: Metadata = {
  title,
  description,
  robots: marketingRobots(),
  alternates: { canonical: "/" },
  openGraph: marketingOpenGraph({ title, description, path: "/" }),
  twitter: marketingTwitter({ title, description })
};

export default function LandingPage() {
  const jsonLd = landingSoftwareApplicationJsonLd();

  return (
    <MarketingShell currentPath="/">
      <AcqFunnelPageView eventName={ACQ_FUNNEL_EVENTS.landingViewed} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="relative isolate min-h-[min(92dvh,880px)] overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--mpa-color-brand-primary)_28%,transparent),transparent_55%),linear-gradient(165deg,var(--mpa-color-bg-app)_0%,color-mix(in_srgb,#0b1220_8%,var(--mpa-color-bg-app))_45%,var(--mpa-color-bg-app)_100%)]"
          aria-hidden
        />
        <div
          className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-[linear-gradient(to_top,var(--mpa-color-bg-app),transparent)]"
          aria-hidden
        />
        <div className="mx-auto flex min-h-[min(92dvh,880px)] max-w-6xl flex-col justify-end px-4 pb-16 pt-24 sm:px-6 sm:pb-24">
          <p className="font-display text-4xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)] sm:text-6xl md:text-7xl">
            {MPA_BRAND_NAME}
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-2xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)] sm:text-3xl">
            Professional property and facility operations in one modular subscription.
          </h1>
          <p className="mt-4 max-w-xl text-base text-[var(--mpa-color-text-secondary)] sm:text-lg">
            Built for operating teams who need clarity, accountability, and software that does the work — not
            another marketing brochure.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/modules"
              className="inline-flex h-11 min-h-11 items-center justify-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-5 text-sm font-semibold text-[var(--mpa-color-text-inverse)] shadow-[var(--mpa-shadow-xs)] hover:bg-[var(--mpa-color-brand-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
            >
              Choose modules
            </Link>
            <Link
              href="/tour"
              className="inline-flex h-11 min-h-11 items-center justify-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-5 text-sm font-semibold text-[var(--mpa-color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
            >
              Optional tour
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">What M.P.A. solves</h2>
        <p className="mt-3 max-w-2xl text-[var(--mpa-color-text-secondary)]">
          Property managers and facility operators lose time to fragmented tools, unclear ownership, and
          spreadsheet handoffs. {MPA_BRAND_NAME} gives one private organization, entitled modules, and a Guided
          Setup path from purchase to production dashboard.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Who it serves</h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {[
            {
              title: "Property Operations teams",
              body: "Portfolio, leasing, residents, maintenance, and vendor coordination under one Professional Property Operations platform."
            },
            {
              title: "Facility Operations teams",
              body: "Floor work, preventive maintenance, inventory, and inspections under a Professional Facility Operations platform."
            }
          ].map((item) => (
            <li
              key={item.title}
              className="rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-5"
            >
              <h3 className="font-display text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Modular subscription</h2>
        <p className="mt-3 max-w-2xl text-[var(--mpa-color-text-secondary)]">
          Start with Property Operations, Facility Operations, or both. Then choose Professional or Business.
          Enterprise works with sales. Team accounts stay invitation-only.
        </p>
        <ul className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Modules first",
              body: "Decide your operating surface before you compare plan capacity and price."
            },
            {
              title: "Automatic provision",
              body: "After Checkout, we create your organization and admin credentials — then Guided Setup."
            },
            {
              title: "Customer outcomes",
              body: "Reach an Administrator dashboard with the modules you purchased — not a crowded all-access menu."
            }
          ].map((item) => (
            <li
              key={item.title}
              className="rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-5"
            >
              <h3 className="font-display text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">{item.body}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/modules"
            className="inline-flex h-11 items-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-semibold text-[var(--mpa-color-text-inverse)]"
          >
            Choose modules
          </Link>
          <Link
            href="/pricing"
            className="inline-flex h-11 items-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] px-4 text-sm font-semibold"
          >
            Pricing
          </Link>
          <Link
            href="/contact-sales"
            className="inline-flex h-11 items-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] px-4 text-sm font-semibold"
          >
            Enterprise / Contact sales
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
