import type { Metadata } from "next";
import { MarketingShell } from "../../../../components/acquire/marketing-shell";
import { ResumeCheckoutLinks } from "../../../../components/acquire/resume-checkout-links";

export const metadata: Metadata = {
  title: "Checkout canceled",
  description: "Checkout was canceled. No charges were made.",
  robots: { index: false, follow: false }
};

export default function AcquireCanceledPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-6">
          <h1 className="font-display text-2xl font-semibold">Checkout canceled</h1>
          <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]">
            No charge was made and no organization was created. You can resume whenever you are ready.
          </p>
          <ResumeCheckoutLinks />
        </div>
      </div>
    </MarketingShell>
  );
}
