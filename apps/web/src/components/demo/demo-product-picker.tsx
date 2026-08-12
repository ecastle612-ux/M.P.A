"use client";

import Link from "next/link";
import { useState } from "react";
import {
  DEMO_PRODUCTS,
  acquisitionHref,
  defaultDemoSurface,
  defaultPersonaForProduct,
  demoHonestyBanner,
  toDemoProductLabel,
  toSkuLabel,
  type DemoProductId
} from "@mpa/shared";
import {
  MarketingChrome,
  marketingPageMainClass,
  marketingPrimaryCtaClass,
  marketingSecondaryCtaClass
} from "../marketing/marketing-chrome";

const PRODUCT_BLURBS: Record<DemoProductId, string> = {
  mpa_property_manager:
    "Mission Control, properties, residents, leasing, maintenance, vendors, and financial operations.",
  mpa_facility_operations:
    "Facility Mission Control, corrective and domain work orders, assets, inventory, inspections, and compliance.",
  mpa_complete_platform:
    "Property Manager and Facility Operations together — one organization, two product homes."
};

export function DemoProductPicker({
  isAuthenticated = false,
  demoEnabled = true
}: {
  isAuthenticated?: boolean;
  demoEnabled?: boolean;
}) {
  const [busyProduct, setBusyProduct] = useState<DemoProductId | null>(null);

  function startDemo(product: DemoProductId) {
    if (!demoEnabled) return;
    setBusyProduct(product);
    const persona = defaultPersonaForProduct(product);
    const surface = defaultDemoSurface(product, persona);
    window.location.assign(
      `/api/demo/start?product=${encodeURIComponent(product)}&surface=${encodeURIComponent(surface)}`
    );
  }

  return (
    <MarketingChrome isAuthenticated={isAuthenticated} denseNav>
      <main className={marketingPageMainClass}>
        <header className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            M.P.A. Live Demo
          </p>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">
            See how M.P.A. brings property and facility operations together.
          </h1>
          <p className="text-base leading-7 text-[var(--mpa-color-text-secondary)]">
            Explore M.P.A. with a guided, read-only demo. Synthetic portfolio data only — no account,
            no payment, no real organization.
          </p>
        </header>

        {!demoEnabled ? (
          <section
            className="max-w-2xl space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)] p-5"
            role="status"
          >
            <h2 className="font-display text-xl font-semibold">Demo workspace unavailable here</h2>
            <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
              The immersive Live Demo runtime is not enabled in this environment. This is not the
              product catalog or pricing flow — when the demo is enabled, you explore Mission Control
              and real product surfaces with synthetic data.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href={acquisitionHref("questionnaire")} className={marketingPrimaryCtaClass}>
                Get Started
              </Link>
              <Link href="/pricing" className={marketingSecondaryCtaClass}>
                View Pricing
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={busyProduct !== null}
                onClick={() => void startDemo("mpa_property_manager")}
                className={marketingPrimaryCtaClass}
              >
                {busyProduct === "mpa_property_manager"
                  ? "Starting…"
                  : "Explore Mission Control"}
              </button>
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                Start here — Property Manager attention home with today&apos;s work.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-semibold">Choose a demo context</h2>
              <p className="max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
                Property Manager, Facility Operations, or Complete — each opens a dedicated demo
                workspace. This is separate from Get Started / pricing.
              </p>
              <ul className="grid gap-4 md:grid-cols-3">
                {DEMO_PRODUCTS.map((product) => {
                  const honesty = demoHonestyBanner(product);
                  return (
                    <li
                      key={product}
                      className="flex flex-col rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5"
                    >
                      <h3 className="font-display text-xl font-semibold">
                        {toDemoProductLabel(product)}
                      </h3>
                      <p className="mt-2 flex-1 text-sm text-[var(--mpa-color-text-secondary)]">
                        {PRODUCT_BLURBS[product]}
                      </p>
                      <p className="mt-2 text-xs text-[var(--mpa-color-text-muted)]">
                        {toSkuLabel(product)} · temporary session overlay
                      </p>
                      {honesty ? (
                        <p className="mt-2 text-xs text-[var(--mpa-color-text-muted)]">{honesty}</p>
                      ) : null}
                      <button
                        type="button"
                        disabled={busyProduct !== null}
                        aria-busy={busyProduct === product}
                        onClick={() => void startDemo(product)}
                        className={`${marketingPrimaryCtaClass} mt-4`}
                      >
                        {busyProduct === product ? "Starting…" : "Enter demo"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="max-w-2xl space-y-2 border-t border-[var(--mpa-color-border-subtle)] pt-6">
              <h2 className="font-display text-lg font-semibold">
                Ready to run your operation with M.P.A.?
              </h2>
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                Live Demo is for seeing the product. Get Started begins your plan evaluation — a
                different path.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href={acquisitionHref("questionnaire")} className={marketingPrimaryCtaClass}>
                  Get Started
                </Link>
                <Link href="/#differentiation" className={marketingSecondaryCtaClass}>
                  Compare platforms
                </Link>
              </div>
            </section>
          </>
        )}
      </main>
    </MarketingChrome>
  );
}
