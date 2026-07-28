import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "../../../components/acquire/marketing-shell";
import { ContactSalesForm } from "../../../components/acquire/contact-sales-form";
import { MPA_BRAND_NAME } from "../../../lib/branding";
import {
  marketingOpenGraph,
  marketingRobots,
  marketingTwitter
} from "../../../lib/acquire/seo";

const title = "Contact sales";
const description = `Talk to ${MPA_BRAND_NAME} sales about Enterprise plans, custom limits, and assisted onboarding.`;

export const metadata: Metadata = {
  title,
  description,
  robots: marketingRobots(),
  alternates: { canonical: "/contact-sales" },
  openGraph: marketingOpenGraph({ title, description, path: "/contact-sales" }),
  twitter: marketingTwitter({ title, description })
};

export default function ContactSalesPage() {
  return (
    <MarketingShell currentPath="/contact-sales">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Contact sales</h1>
          <p className="mt-4 text-[var(--mpa-color-text-secondary)]">
            Enterprise customers remain sales-assisted. Tell us about your portfolio and we will schedule the
            right conversation.
          </p>
          <p className="mt-4 text-sm text-[var(--mpa-color-text-secondary)]">
            Looking for Professional or Business?{" "}
            <Link href="/pricing" className="font-medium text-[var(--mpa-color-brand-primary)] underline-offset-4 hover:underline">
              Start self-serve from pricing
            </Link>
            .
          </p>
        </div>
        <ContactSalesForm />
      </div>
    </MarketingShell>
  );
}
