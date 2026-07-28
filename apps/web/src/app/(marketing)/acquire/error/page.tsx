import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "../../../../components/acquire/marketing-shell";

export const metadata: Metadata = {
  title: "Checkout error",
  description: "Something went wrong with Checkout. Try again or contact sales.",
  robots: { index: false, follow: false }
};

export default async function AcquireErrorPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const reason = typeof params["reason"] === "string" ? params["reason"] : "unknown";
  const copy =
    reason === "expired"
      ? "This Checkout session expired. Start a new session from modules — nothing was charged."
      : reason === "subscription_exists"
        ? "An open subscription already exists for this email. Sign in to manage billing, or use a different work email for a new organization."
        : reason === "payment_failed"
          ? "Payment did not go through. No organization was created. Update your payment method and try Checkout again."
          : reason === "duplicate_org"
            ? "An organization for this company may already exist. Sign in with your admin email, or contact sales if you need help."
            : "We could not complete Checkout. No organization was created. You can try again from module selection.";

  return (
    <MarketingShell>
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-6">
          <h1 className="font-display text-2xl font-semibold">Checkout could not continue</h1>
          <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">{copy}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/modules"
              className="inline-flex h-11 items-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-semibold text-[var(--mpa-color-text-inverse)]"
            >
              Choose modules
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] px-4 text-sm font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/contact-sales"
              className="inline-flex h-11 items-center px-2 text-sm font-medium underline-offset-4 hover:underline"
            >
              Contact sales
            </Link>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
