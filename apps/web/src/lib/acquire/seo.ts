/**
 * ACQ-001 Slice C — SEO helpers for public acquisition surfaces.
 */

import type { Metadata } from "next";
import { MPA_BRAND_NAME, MPA_BRAND_TAGLINE } from "../branding";
import { serverEnv } from "../env/server-env";

export const ACQ_INDEXABLE_PATHS = [
  "/",
  "/overview",
  "/tour",
  "/pricing",
  "/contact-sales"
] as const;

export const ACQ_NOINDEX_PATHS = [
  "/acquire/start",
  "/acquire/success",
  "/acquire/canceled",
  "/acquire/error"
] as const;

export function marketingRobots() {
  return { index: true, follow: true } as const;
}

export function acquireNoindexRobots() {
  return { index: false, follow: false } as const;
}

export function marketingOpenGraph(input: {
  title: string;
  description: string;
  path: string;
}): NonNullable<Metadata["openGraph"]> {
  const base = serverEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return {
    type: "website",
    locale: "en_US",
    siteName: MPA_BRAND_NAME,
    title: `${input.title} | ${MPA_BRAND_NAME}`,
    description: input.description,
    url: `${base}${input.path === "/" ? "" : input.path}`
  };
}

export function marketingTwitter(input: {
  title: string;
  description: string;
}): NonNullable<Metadata["twitter"]> {
  return {
    card: "summary_large_image",
    title: `${input.title} | ${MPA_BRAND_NAME}`,
    description: input.description
  };
}

/** SoftwareApplication JSON-LD for the public landing page (no secrets). */
export function landingSoftwareApplicationJsonLd(): Record<string, unknown> {
  const base = serverEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: MPA_BRAND_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: `${MPA_BRAND_NAME} — ${MPA_BRAND_TAGLINE}`,
    url: base,
    offers: {
      "@type": "AggregateOffer",
      url: `${base}/pricing`,
      priceCurrency: "USD",
      lowPrice: "0",
      offerCount: 3
    }
  };
}
