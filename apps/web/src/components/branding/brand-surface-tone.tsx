"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { BrandLogoTone, BrandSurfaceTone as BrandSurfaceToneValue } from "../../lib/branding";

/**
 * null = no explicit provider — BrandLogo falls back to document theme
 * (`data-theme` / `data-brand-surface`) so loaders outside AppProviders match.
 */
const BrandSurfaceToneContext = createContext<BrandSurfaceToneValue | null>(null);

export function BrandSurfaceTone({
  tone,
  children
}: {
  tone: BrandLogoTone;
  children: ReactNode;
}) {
  const resolvedTone = tone === "auto" ? "light-surface" : tone;
  return <BrandSurfaceToneContext.Provider value={resolvedTone}>{children}</BrandSurfaceToneContext.Provider>;
}

/**
 * Prefer html[data-theme] (set by beforeInteractive theme script + ThemeProvider).
 * Fall back to data-brand-surface. Default: light-surface → default logo.
 */
export function readDocumentBrandSurface(): BrandSurfaceToneValue {
  if (typeof document === "undefined") return "light-surface";
  const theme =
    document.documentElement?.getAttribute("data-theme") ??
    document.body?.getAttribute("data-theme");
  if (theme === "dark") return "dark-surface";
  if (theme === "light") return "light-surface";
  const raw =
    document.documentElement?.getAttribute("data-brand-surface") ??
    document.body?.getAttribute("data-brand-surface");
  return raw === "dark-surface" ? "dark-surface" : "light-surface";
}

function subscribeDocumentBrandSurface(onStoreChange: () => void): () => void {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") {
    return () => undefined;
  }
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme", "data-brand-surface"]
  });
  if (document.body) {
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-theme", "data-brand-surface"]
    });
  }
  return () => observer.disconnect();
}

/** Resolved surface for BrandLogo — provider wins; else live document theme. */
export function useResolvedBrandSurfaceTone(): BrandSurfaceToneValue {
  const provided = useContext(BrandSurfaceToneContext);
  const fromDocument = useSyncExternalStore(
    subscribeDocumentBrandSurface,
    readDocumentBrandSurface,
    () => "light-surface" as const
  );
  return provided ?? fromDocument;
}

export function useBrandSurfaceTone(): BrandSurfaceToneValue {
  return useResolvedBrandSurfaceTone();
}

export { BrandSurfaceToneContext };
