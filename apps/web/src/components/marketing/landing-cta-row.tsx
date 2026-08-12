import Link from "next/link";
import { acquisitionHref } from "@mpa/shared";
import {
  marketingHeroSecondaryCtaClass,
  marketingPrimaryCtaClass,
  marketingSecondaryCtaClass
} from "./marketing-chrome";

type LandingCtaRowProps = {
  isAuthenticated?: boolean;
  variant?: "hero" | "light";
  showJourneyHint?: boolean;
  className?: string;
};

export function LandingCtaRow({
  isAuthenticated = false,
  variant = "light",
  showJourneyHint = false,
  className = ""
}: LandingCtaRowProps) {
  const secondaryClass =
    variant === "hero" ? marketingHeroSecondaryCtaClass : marketingSecondaryCtaClass;
  const pricingClass =
    variant === "hero"
      ? "text-sm font-medium text-white/85 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      : "inline-flex h-11 items-center text-sm font-semibold text-[var(--mpa-color-brand-primary)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)]";

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-3">
        {isAuthenticated ? (
          <Link href="/dashboard" className={marketingPrimaryCtaClass}>
            Open workspace
          </Link>
        ) : (
          <Link href={acquisitionHref("questionnaire")} className={marketingPrimaryCtaClass}>
            Get Started
          </Link>
        )}
        <Link href="/demo" className={secondaryClass}>
          See Live Demo
        </Link>
        <Link href="/pricing" className={pricingClass}>
          View Pricing
        </Link>
      </div>
      {showJourneyHint && !isAuthenticated ? (
        <p
          className={
            variant === "hero"
              ? "max-w-xl text-xs leading-5 text-white/70 md:text-sm"
              : "max-w-xl text-xs leading-5 text-[var(--mpa-color-text-secondary)] md:text-sm"
          }
        >
          After Get Started: choose your product → confirm your plan → start your trial if eligible
          (≤500 units; card required) → Guided Setup → Mission Control.
        </p>
      ) : null}
    </div>
  );
}
