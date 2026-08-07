import Link from "next/link";
import { SKU_SUMMARIES, PRODUCT_SKUS } from "@mpa/shared";

const primaryCtaClass =
  "inline-flex h-11 items-center justify-center rounded-md bg-[var(--mpa-color-brand-primary)] px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--mpa-color-brand-primary-hover,#0C5A48)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)] focus-visible:ring-offset-2";

const secondaryCtaClass =
  "inline-flex h-11 items-center justify-center rounded-md border border-white/35 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

export function PublicLandingPage({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  return (
    <div className="min-h-screen bg-[var(--mpa-color-bg-app)] text-[var(--mpa-color-text-primary)]">
      <a
        href="#modules"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to modules
      </a>

      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <p className="font-display text-sm font-semibold tracking-wide text-white/90">
            My Property Assistant
          </p>
          <nav aria-label="Public" className="flex flex-wrap items-center gap-2">
            <Link
              href="/portal"
              className="rounded-md px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
            >
              Customer Portal
            </Link>
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/18"
              >
                Open workspace
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/18"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </header>

      <section
        aria-label="Homepage hero"
        className="relative isolate flex min-h-[100svh] items-end overflow-hidden"
      >
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(145deg,#0B1F1A_0%,#0F6B56_42%,#1A2330_100%)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.22] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px] motion-safe:animate-[mpa-grid-drift_28s_linear_infinite]"
        />
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 w-full max-w-3xl bg-[radial-gradient(ellipse_at_70%_40%,rgba(255,255,255,0.16),transparent_55%)]"
        />
        <svg
          aria-hidden
          className="absolute bottom-0 right-0 h-[70%] w-[min(720px,90vw)] text-white/15 motion-safe:animate-[mpa-rise_900ms_ease-out]"
          viewBox="0 0 720 520"
          fill="currentColor"
        >
          <rect x="80" y="160" width="140" height="360" />
          <rect x="240" y="90" width="170" height="430" />
          <rect x="430" y="140" width="150" height="380" />
          <rect x="600" y="210" width="100" height="310" />
          <rect x="105" y="190" width="18" height="28" className="opacity-40" />
          <rect x="140" y="190" width="18" height="28" className="opacity-40" />
          <rect x="275" y="130" width="22" height="34" className="opacity-40" />
          <rect x="315" y="130" width="22" height="34" className="opacity-40" />
          <rect x="465" y="175" width="20" height="30" className="opacity-40" />
          <rect x="505" y="175" width="20" height="30" className="opacity-40" />
        </svg>
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-28 md:px-6 md:pb-24">
          <div className="max-w-2xl space-y-5 motion-safe:animate-[mpa-rise_700ms_ease-out]">
            <p className="font-display text-4xl font-semibold tracking-tight text-white md:text-6xl">
              M.P.A.
            </p>
            <h1 className="max-w-xl font-display text-2xl font-semibold leading-tight text-white/95 md:text-3xl">
              Property operations, calm and complete.
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-white/80 md:text-lg">
              Run portfolios, facilities, and shared operations from one professional platform.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              {isAuthenticated ? (
                <Link href="/dashboard" className={primaryCtaClass}>
                  Open workspace
                </Link>
              ) : (
                <Link href="/login?mode=sign_up" className={primaryCtaClass}>
                  Get Started
                </Link>
              )}
              <a href="#modules" className={secondaryCtaClass}>
                Choose Modules
              </a>
              {!isAuthenticated ? (
                <Link href="/login" className={secondaryCtaClass}>
                  Sign In
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section
        id="modules"
        aria-labelledby="modules-heading"
        className="mx-auto max-w-6xl space-y-6 px-4 py-16 md:px-6 md:py-20"
      >
        <div className="max-w-2xl space-y-2">
          <h2
            id="modules-heading"
            className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)] md:text-3xl"
          >
            Choose your commercial modules
          </h2>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)] md:text-base">
            Start with the product you need. After you create an account, Guided Setup locks in your
            organization and plan.
          </p>
        </div>
        <ul className="grid gap-4 md:grid-cols-3">
          {PRODUCT_SKUS.map((sku, index) => {
            const summary = SKU_SUMMARIES[sku];
            return (
              <li key={sku}>
                <Link
                  href={`/login?mode=sign_up&intent=${encodeURIComponent(sku)}`}
                  className="group flex h-full flex-col justify-between rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5 transition-colors duration-200 hover:border-[var(--mpa-color-brand-primary)] hover:bg-[var(--mpa-color-bg-subtle,#F7F8FA)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)]"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                      Commercial product
                    </p>
                    <h3 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
                      {summary.label}
                    </h3>
                    <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
                      {summary.description}
                    </p>
                  </div>
                  <p className="mt-5 text-sm font-semibold text-[var(--mpa-color-brand-primary)] transition-transform duration-200 group-hover:translate-x-0.5">
                    Continue to Get Started →
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <footer className="border-t border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-[var(--mpa-color-text-secondary)] md:px-6">
          <p>© {new Date().getFullYear()} My Property Assistant</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/login" className="hover:text-[var(--mpa-color-text-primary)]">
              Sign In
            </Link>
            <Link href="/portal" className="hover:text-[var(--mpa-color-text-primary)]">
              Customer Portal
            </Link>
            <a href="#modules" className="hover:text-[var(--mpa-color-text-primary)]">
              Choose Modules
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
