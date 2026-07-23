"use client";

import type { ReactNode } from "react";
import { BrandLogo, BrandSurfaceTone } from "./brand-logo";

/**
 * UX-005 — Premium auth presentation shell.
 * Presentation only; does not alter authentication behavior.
 */
export function AuthBrandShell({
  children,
  eyebrow = "My Property Assistant",
  headline = "Property operations, clarified.",
  support = "Run portfolios with one operating system for people, places, money, and maintenance."
}: {
  children: ReactNode;
  eyebrow?: string;
  headline?: string;
  support?: string;
}) {
  return (
    <BrandSurfaceTone tone="dark-surface">
      <div className="relative flex min-h-screen w-full overflow-hidden bg-[var(--mpa-color-bg-app)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(1200px 600px at 10% -10%, color-mix(in srgb, var(--mpa-color-brand-primary) 22%, transparent), transparent 55%), radial-gradient(900px 500px at 90% 10%, color-mix(in srgb, var(--mpa-color-brand-secondary) 16%, transparent), transparent 50%), linear-gradient(165deg, #0f1419 0%, #152019 42%, #1a2420 100%)"
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "48px 48px"
          }}
        />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-stretch gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:px-10 lg:py-12">
          <section className="hidden flex-col justify-center text-[var(--mpa-color-text-inverse)] lg:flex">
            <div className="mb-10 transition-transform duration-500 ease-out">
              <BrandLogo purpose="login" priority />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--mpa-color-text-inverse)]/70">{eyebrow}</p>
            <h1 className="mt-3 max-w-lg font-display text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              {headline}
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--mpa-color-text-inverse)]/75">{support}</p>
            <ul className="mt-10 space-y-3 text-sm text-[var(--mpa-color-text-inverse)]/65">
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--mpa-color-sidebar-accent)]" />
                Operations, residents, and facility history in one workspace
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--mpa-color-sidebar-accent)]" />
                Built for property managers who live in the product all day
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--mpa-color-sidebar-accent)]" />
                Private Beta · Design Partner ready
              </li>
            </ul>
          </section>

          <section className="flex flex-col items-center justify-center">
            <div className="mb-6 flex w-full max-w-md flex-col items-center lg:hidden">
              <BrandLogo purpose="login" priority />
              <p className="mt-4 text-center text-sm text-[var(--mpa-color-text-inverse)]/80">{headline}</p>
            </div>

            <div className="mpa-auth-card w-full max-w-md rounded-[var(--mpa-radius-xl)] border border-white/10 bg-[var(--mpa-color-bg-surface)] p-6 shadow-[var(--mpa-shadow-lg)] sm:p-8">
              {children}
            </div>
          </section>
        </div>
      </div>
    </BrandSurfaceTone>
  );
}
