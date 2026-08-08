import Link from "next/link";
import type { ReactNode } from "react";
import { acquisitionHref } from "@mpa/shared";

const primaryCtaClass =
  "inline-flex h-10 items-center justify-center rounded-md bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--mpa-color-brand-primary-hover,#0C5A48)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)]";

const ghostCtaClass =
  "inline-flex h-10 items-center justify-center rounded-md px-3 text-sm font-medium text-[var(--mpa-color-text-secondary)] transition-colors hover:bg-[var(--mpa-color-bg-subtle,#F7F8FA)] hover:text-[var(--mpa-color-text-primary)]";

const heroNavLinkClass =
  "rounded-md px-3 py-2 text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white";

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
      <header
        className={
          denseNav
            ? "sticky top-0 z-30 border-b border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)]/95 backdrop-blur"
            : "absolute inset-x-0 top-0 z-20"
        }
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6">
          <Link
            href="/"
            className={`font-display text-sm font-semibold tracking-wide ${
              denseNav ? "text-[var(--mpa-color-text-primary)]" : "text-white/90"
            }`}
          >
            My Property Assistant
          </Link>
          <nav aria-label="Public" className="flex flex-wrap items-center gap-1 md:gap-2">
            {publicNav.map((item) => (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                className={denseNav ? ghostCtaClass : heroNavLinkClass}
              >
                {item.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <Link href="/dashboard" className={primaryCtaClass}>
                Open workspace
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className={
                    denseNav
                      ? ghostCtaClass
                      : "rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/18"
                  }
                >
                  Sign In
                </Link>
                <Link href="/modules" className={primaryCtaClass}>
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      {children}
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
