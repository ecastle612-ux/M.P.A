import Link from "next/link";
import { acquisitionHref } from "@mpa/shared";
import {
  MarketingChrome,
  marketingPageMainClass,
  marketingPrimaryCtaClass,
  marketingSecondaryCtaClass
} from "../marketing/marketing-chrome";

/** Honest empty state when Live Demo runtime is disabled (e.g. Production without DEMO_ENABLED). */
export function DemoUnavailablePage({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  return (
    <MarketingChrome isAuthenticated={isAuthenticated} denseNav>
      <main className={marketingPageMainClass}>
        <header className="max-w-2xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Live Demo
          </p>
          <h1 className="font-display text-3xl font-semibold">Live Demo is temporarily unavailable</h1>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            The interactive demonstration environment is not enabled in this deployment right now.
            This is not the acquisition path — when Live Demo is online, it opens an isolated
            synthetic product experience (no payment, no real organization).
          </p>
        </header>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href={acquisitionHref("questionnaire")} className={marketingPrimaryCtaClass}>
            Get Started
          </Link>
          <Link href="/pricing" className={marketingSecondaryCtaClass}>
            Compare Platforms
          </Link>
          <Link href="/" className={marketingSecondaryCtaClass}>
            Back to home
          </Link>
        </div>
      </main>
    </MarketingChrome>
  );
}
