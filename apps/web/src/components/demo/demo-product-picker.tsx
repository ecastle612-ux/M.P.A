"use client";

import { useState } from "react";
import {
  DEMO_PRODUCTS,
  defaultDemoSurface,
  defaultPersonaForProduct,
  demoHonestyBanner,
  toDemoProductLabel,
  toSkuLabel,
  type DemoProductId
} from "@mpa/shared";
import { MarketingChrome, marketingPrimaryCtaClass } from "../marketing/marketing-chrome";

export function DemoProductPicker({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const [busyProduct, setBusyProduct] = useState<DemoProductId | null>(null);

  function startDemo(product: DemoProductId) {
    setBusyProduct(product);
    const persona = defaultPersonaForProduct(product);
    const surface = defaultDemoSurface(product, persona);
    // Full navigation through start route so durable session cookies are set
    // before the surface RSC runs (avoids blank pages on serverless).
    window.location.assign(
      `/api/demo/start?product=${encodeURIComponent(product)}&surface=${encodeURIComponent(surface)}`
    );
  }

  return (
    <MarketingChrome isAuthenticated={isAuthenticated} denseNav>
      <main className="mx-auto max-w-6xl space-y-8 px-4 pb-16 pt-10 md:px-6">
        <header className="max-w-2xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Live Demo
          </p>
          <h1 className="font-display text-3xl font-semibold">Experience M.P.A. without an account</h1>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            Controlled demonstration environments with shared synthetic datasets and a temporary
            session overlay. Not a trial — no payment, no real organization.
          </p>
        </header>

        <ul className="grid gap-4 md:grid-cols-3">
          {DEMO_PRODUCTS.map((product) => {
            const honesty = demoHonestyBanner(product);
            return (
              <li
                key={product}
                className="flex flex-col rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5"
              >
                <h2 className="font-display text-xl font-semibold">{toDemoProductLabel(product)}</h2>
                <p className="mt-2 flex-1 text-sm text-[var(--mpa-color-text-secondary)]">
                  Immersive {toSkuLabel(product)} experience with role switching and automatic reset.
                </p>
                {honesty ? (
                  <p className="mt-3 text-xs text-[var(--mpa-color-text-muted)]">{honesty}</p>
                ) : null}
                <button
                  type="button"
                  disabled={busyProduct !== null}
                  onClick={() => void startDemo(product)}
                  className={`${marketingPrimaryCtaClass} mt-4`}
                >
                  {busyProduct === product ? "Starting…" : "Enter demo"}
                </button>
              </li>
            );
          })}
        </ul>
      </main>
    </MarketingChrome>
  );
}
