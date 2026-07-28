import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "../branding/brand-logo";
import { BrandSurfaceTone } from "../branding/brand-surface-tone";
import { MPA_BRAND_NAME } from "../../lib/branding";

export { marketingRobots, acquireNoindexRobots } from "../../lib/acquire/seo";

const NAV = [
  { href: "/overview", label: "Product" },
  { href: "/modules", label: "Modules" },
  { href: "/tour", label: "Tour" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact-sales", label: "Contact sales" }
] as const;

export function MarketingShell({
  children,
  currentPath
}: {
  children: ReactNode;
  currentPath?: string;
}) {
  return (
    <BrandSurfaceTone tone="light-surface">
      <div className="min-h-[100dvh] bg-[var(--mpa-color-bg-app)] text-[var(--mpa-color-text-primary)]">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-[var(--mpa-color-bg-surface)] focus:px-3 focus:py-2 focus:shadow-[var(--mpa-shadow-md)]"
        >
          Skip to content
        </a>
        <header className="sticky top-0 z-40 border-b border-[var(--mpa-color-border-subtle)] bg-[color-mix(in_srgb,var(--mpa-color-bg-app)_92%,transparent)] backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
            <Link href="/" className="min-w-0 shrink-0" aria-label={`${MPA_BRAND_NAME} home`}>
              <BrandLogo purpose="header" />
            </Link>
            <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
              {NAV.map((item) => {
                const active = currentPath === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-[var(--mpa-radius-md)] px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)] ${
                      active
                        ? "text-[var(--mpa-color-brand-primary)]"
                        : "text-[var(--mpa-color-text-secondary)] hover:text-[var(--mpa-color-text-primary)]"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden rounded-[var(--mpa-radius-md)] px-3 py-2 text-sm font-medium text-[var(--mpa-color-text-secondary)] hover:text-[var(--mpa-color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)] sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                href="/modules"
                className="inline-flex h-11 min-h-11 items-center justify-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-semibold text-[var(--mpa-color-text-inverse)] shadow-[var(--mpa-shadow-xs)] hover:bg-[var(--mpa-color-brand-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
              >
                Choose modules
              </Link>
            </div>
          </div>
          <nav
            aria-label="Mobile primary"
            className="flex gap-1 overflow-x-auto border-t border-[var(--mpa-color-border-subtle)] px-2 py-2 md:hidden"
          >
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-[var(--mpa-radius-md)] px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="shrink-0 rounded-[var(--mpa-radius-md)] px-3 py-2 text-sm text-[var(--mpa-color-text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus)]"
            >
              Sign in
            </Link>
          </nav>
        </header>
        <main id="main">{children}</main>
        <footer className="border-t border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)]">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-display text-lg font-semibold">{MPA_BRAND_NAME}</p>
              <p className="mt-1 max-w-sm text-sm text-[var(--mpa-color-text-secondary)]">
                Modular property and facility operations OS — choose modules, subscribe, set up, and run.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--mpa-color-text-secondary)]">
              <Link href="/overview" className="hover:text-[var(--mpa-color-text-primary)]">
                Product
              </Link>
              <Link href="/modules" className="hover:text-[var(--mpa-color-text-primary)]">
                Modules
              </Link>
              <Link href="/tour" className="hover:text-[var(--mpa-color-text-primary)]">
                Tour
              </Link>
              <Link href="/pricing" className="hover:text-[var(--mpa-color-text-primary)]">
                Pricing
              </Link>
              <Link href="/contact-sales" className="hover:text-[var(--mpa-color-text-primary)]">
                Contact sales
              </Link>
              <Link href="/login" className="hover:text-[var(--mpa-color-text-primary)]">
                Sign in
              </Link>
            </div>
          </div>
          <div className="border-t border-[var(--mpa-color-border-subtle)] py-4 text-center text-xs text-[var(--mpa-color-text-muted)]">
            © {new Date().getFullYear()} {MPA_BRAND_NAME}. Team accounts are invitation-only.
          </div>
        </footer>
      </div>
    </BrandSurfaceTone>
  );
}
