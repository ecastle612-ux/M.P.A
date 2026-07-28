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

const title = "Property operations OS";
const description = `${MPA_BRAND_NAME} helps professional property managers run maintenance, leasing, facilities, and team operations from one subscription.`;

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
            The operations OS for professional property managers.
          </h1>
          <p className="mt-4 max-w-xl text-base text-[var(--mpa-color-text-secondary)] sm:text-lg">
            Subscribe, set up your workspace, and run maintenance, leasing, and facilities without spreadsheet
            chaos.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/pricing"
              className="inline-flex h-11 min-h-11 items-center justify-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-5 text-sm font-semibold text-[var(--mpa-color-text-inverse)] shadow-[var(--mpa-shadow-xs)] hover:bg-[var(--mpa-color-brand-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
            >
              See pricing
            </Link>
            <Link
              href="/tour"
              className="inline-flex h-11 min-h-11 items-center justify-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-5 text-sm font-semibold text-[var(--mpa-color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
            >
              Take the tour
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Built for operating teams</h2>
        <p className="mt-3 max-w-2xl text-[var(--mpa-color-text-secondary)]">
          One private organization per subscription. Invite your team within seat limits. Modules follow your
          plan — not a crowded all-access menu.
        </p>
        <ul className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Self-serve start",
              body: "Trial, Professional, or Business from public pricing. Enterprise works with sales."
            },
            {
              title: "Automatic provision",
              body: "After Checkout, we create your organization and admin credentials — then Guided Setup."
            },
            {
              title: "Invitation-only team",
              body: "Coworkers join by invite. There is no open registration for staff accounts."
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
    </MarketingShell>
  );
}
