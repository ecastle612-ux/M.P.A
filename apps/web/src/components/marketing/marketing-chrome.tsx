import Link from "next/link";
import type { ReactNode } from "react";
import { acquisitionHref } from "@mpa/shared";
import { SiteLogo } from "../branding/site-logo";

const primaryCtaClass =
  "inline-flex h-10 items-center justify-center rounded-md bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--mpa-color-brand-primary-hover,#0C5A48)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)] focus-visible:ring-offset-2";

const ghostCtaClass =
  "inline-flex h-10 items-center justify-center rounded-md px-3 text-sm font-medium text-[var(--mpa-color-text-secondary)] transition-colors hover:bg-[var(--mpa-color-bg-subtle,#F7F8FA)] hover:text-[var(--mpa-color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)]";

const heroNavLinkClass =
  "rounded-md px-3 py-2 text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";

const publicNav = [
  { href: "/", label: "Home" },
  { href: "/demo", label: "Live Demo" },
  { href: "/modules", label: "Modules" },
  { href: "/pricing", label: "Pricing" },
  {
    href: acquisitionHref("checkout", {
      sku: "mpa_property_manager",
      billingCycle: "monthly"
    }),
    label: "Confirm Plan"
  },
  { href: "/enterprise", label: "Enterprise" }
] as const;

function PublicNavLinks({
  denseNav,
  className
}: {
  denseNav: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      {publicNav.map((item) => (
        <Link
          key={`${item.label}-${item.href}`}
          href={item.href}
          className={denseNav ? ghostCtaClass : heroNavLinkClass}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

function AuthNavLinks({
  isAuthenticated,
  denseNav,
  stacked = false
}: {
  isAuthenticated: boolean;
  denseNav: boolean;
  stacked?: boolean;
}) {
  if (isAuthenticated) {
    return (
      <Link href="/dashboard" className={`${primaryCtaClass} ${stacked ? "w-full" : ""}`}>
        Open workspace
      </Link>
    );
  }

  return (
    <div className={stacked ? "flex flex-col gap-2" : "flex flex-wrap items-center gap-1 md:gap-2"}>
      <Link
        href="/login"
        className={
          denseNav
            ? ghostCtaClass
            : "rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        }
      >
        Sign In
      </Link>
      <Link href="/modules" className={`${primaryCtaClass} ${stacked ? "w-full" : ""}`}>
        Get Started
      </Link>
    </div>
  );
}

export function MarketingChrome({
  children,
  isAuthenticated = false,
  denseNav = false
}: {
  children: ReactNode;
  isAuthenticated?: boolean;
  denseNav?: boolean;
}) {
  return (
    <div className="min-h-screen bg-[var(--mpa-color-bg-app)] text-[var(--mpa-color-text-primary)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-[var(--mpa-color-text-primary)] focus:shadow-lg"
      >
        Skip to content
      </a>
      <header
        className={
          denseNav
            ? "sticky top-0 z-30 border-b border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)]/95 backdrop-blur"
            : "absolute inset-x-0 top-0 z-20"
        }
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 md:px-6">
          <SiteLogo surface={denseNav ? "light" : "dark"} />

          {/* Desktop / large tablet — single row */}
          <nav
            aria-label="Public"
            className="hidden items-center gap-1 lg:flex lg:gap-2"
          >
            <PublicNavLinks denseNav={denseNav} className="flex items-center gap-1 lg:gap-2" />
            <AuthNavLinks isAuthenticated={isAuthenticated} denseNav={denseNav} />
          </nav>

          {/* Phone / mid widths — collapsible (PP-008 / PP-012) */}
          <details className="relative lg:hidden">
            <summary
              className={
                denseNav
                  ? "cursor-pointer list-none rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm font-semibold text-[var(--mpa-color-text-primary)] marker:content-none [&::-webkit-details-marker]:hidden"
                  : "cursor-pointer list-none rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm font-semibold text-white marker:content-none [&::-webkit-details-marker]:hidden"
              }
            >
              Menu
            </summary>
            <div
              className={
                denseNav
                  ? "absolute right-0 z-40 mt-2 flex w-[min(18rem,calc(100vw-2rem))] flex-col gap-1 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-3 shadow-lg"
                  : "absolute right-0 z-40 mt-2 flex w-[min(18rem,calc(100vw-2rem))] flex-col gap-1 rounded-md border border-white/20 bg-[#0B1F1A]/95 p-3 shadow-lg backdrop-blur"
              }
            >
              <nav aria-label="Public menu" className="flex flex-col gap-1">
                <PublicNavLinks
                  denseNav={denseNav}
                  className="flex flex-col gap-1 [&_a]:w-full [&_a]:justify-start"
                />
              </nav>
              <div className="mt-2 border-t border-[var(--mpa-color-border-subtle)] pt-2">
                <AuthNavLinks
                  isAuthenticated={isAuthenticated}
                  denseNav={denseNav}
                  stacked
                />
              </div>
            </div>
          </details>
        </div>
      </header>
      <div id="main-content">{children}</div>
      <footer className="border-t border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-[var(--mpa-color-text-secondary)] md:px-6">
          <p>© {new Date().getFullYear()} My Property Assistant</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/" className="hover:text-[var(--mpa-color-text-primary)]">
              Home
            </Link>
            <Link href="/demo" className="hover:text-[var(--mpa-color-text-primary)]">
              Live Demo
            </Link>
            <Link href="/modules" className="hover:text-[var(--mpa-color-text-primary)]">
              Modules
            </Link>
            <Link href="/pricing" className="hover:text-[var(--mpa-color-text-primary)]">
              Pricing
            </Link>
            <Link
              href={acquisitionHref("checkout", {
                sku: "mpa_property_manager",
                billingCycle: "monthly"
              })}
              className="hover:text-[var(--mpa-color-text-primary)]"
            >
              Confirm Plan
            </Link>
            <Link href="/enterprise" className="hover:text-[var(--mpa-color-text-primary)]">
              Enterprise
            </Link>
            <Link href="/login" className="hover:text-[var(--mpa-color-text-primary)]">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export const marketingPrimaryCtaClass =
  "inline-flex h-11 items-center justify-center rounded-md bg-[var(--mpa-color-brand-primary)] px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--mpa-color-brand-primary-hover,#0C5A48)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)] focus-visible:ring-offset-2";

export const marketingSecondaryCtaClass =
  "inline-flex h-11 items-center justify-center rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-5 text-sm font-semibold text-[var(--mpa-color-text-primary)] transition-colors duration-200 hover:bg-[var(--mpa-color-bg-subtle,#F7F8FA)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)]";

export const marketingHeroSecondaryCtaClass =
  "inline-flex h-11 items-center justify-center rounded-md border border-white/35 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";

export const marketingPageMainClass =
  "mx-auto max-w-6xl space-y-8 px-4 pb-16 pt-10 motion-safe:animate-[mpa-rise_500ms_ease-out] md:px-6";

export const marketingNarrowMainClass =
  "mx-auto max-w-3xl space-y-8 px-4 pb-16 pt-10 motion-safe:animate-[mpa-rise_500ms_ease-out] md:px-6";
