"use client";

import { createContext, useContext, type ReactNode } from "react";
import { cn } from "@mpa/ui";
import {
  MPA_BRAND_NAME,
  MPA_BRAND_PRODUCT_LINE,
  MPA_BRAND_TAGLINE,
  MPA_LOGO_ASPECT_RATIO,
  logoPathForTone,
  resolveBrandPresentation,
  type BrandLogoPurpose,
  type BrandLogoTone,
  type BrandNameScale,
  type BrandSurfaceTone
} from "../../lib/branding";

const BrandSurfaceToneContext = createContext<BrandSurfaceTone>("light-surface");

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

export function useBrandSurfaceTone(): BrandSurfaceTone {
  return useContext(BrandSurfaceToneContext);
}

export type BrandLogoProps = {
  purpose: BrandLogoPurpose;
  collapsed?: boolean | undefined;
  priority?: boolean | undefined;
  decorative?: boolean | undefined;
  className?: string | undefined;
  "aria-hidden"?: boolean | undefined;
};

/**
 * Two logos only:
 * - light surface → /branding/logo-dark.png
 * - dark surface  → /branding/logo-light.png
 *
 * Purpose only controls size/lockup. Never invent a third asset.
 */
export function BrandLogo({
  purpose,
  collapsed = false,
  priority = false,
  decorative = false,
  className,
  "aria-hidden": ariaHidden
}: BrandLogoProps) {
  if (purpose === "browser" && process.env.NODE_ENV !== "production") {
    console.error(
      '[BR-001] purpose="browser" is for favicon/PWA/launcher only — do not render BrandLogo on product UI.'
    );
  }

  const surfaceTone = useContext(BrandSurfaceToneContext);
  const presentation = resolveBrandPresentation(purpose, { collapsed });
  const markPx = presentation.markPx;
  const showTypography =
    presentation.showBrandName || presentation.showTagline || presentation.showProductLine;
  // Explicit: light chrome → logo-dark; dark chrome → logo-light.
  const logoSrc = logoPathForTone(surfaceTone);
  const isDecorative = decorative || ariaHidden;
  const markHeight = Math.round(markPx * MPA_LOGO_ASPECT_RATIO);
  const accessibleName = `${MPA_BRAND_NAME} ${MPA_BRAND_TAGLINE}`;

  const textTone = surfaceTone === "dark-surface" ? "text-[var(--mpa-color-text-inverse)]" : "text-[var(--mpa-color-text-primary)]";
  const mutedTone = surfaceTone === "dark-surface" ? "text-[var(--mpa-color-text-inverse)]/80" : "text-[var(--mpa-color-text-secondary)]";
  const productTone = surfaceTone === "dark-surface" ? "text-[var(--mpa-color-text-inverse)]/55" : "text-[var(--mpa-color-text-muted)]";

  const mark = (
    // eslint-disable-next-line @next/next/no-img-element -- BrandLogo owns approved branding assets.
    <img
      src={logoSrc}
      alt={isDecorative || showTypography ? "" : accessibleName}
      width={markPx}
      height={markHeight}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      aria-hidden={isDecorative || showTypography || undefined}
      className="block h-auto max-w-full shrink-0 object-contain"
      style={{ width: markPx, height: "auto" }}
      suppressHydrationWarning
    />
  );

  if (!showTypography) {
    return (
      <span
        className={cn("inline-flex shrink-0 items-center justify-center", className)}
        aria-label={isDecorative ? undefined : accessibleName}
      >
        {mark}
      </span>
    );
  }

  const nameClass = brandNameClassName(presentation.brandNameScale, textTone);

  if (presentation.layout === "stack") {
    return (
      <span
        className={cn("inline-flex flex-col items-center gap-2.5 text-center", className)}
        aria-label={isDecorative ? undefined : accessibleName}
        aria-hidden={isDecorative || undefined}
      >
        {mark}
        <span className="space-y-1">
          {presentation.showBrandName ? <span className={cn("block", nameClass)}>{MPA_BRAND_NAME}</span> : null}
          {presentation.showTagline ? (
            <span className={cn("block text-sm font-medium tracking-tight sm:text-[15px]", mutedTone)}>
              {MPA_BRAND_TAGLINE}
            </span>
          ) : null}
          {presentation.showProductLine ? (
            <span
              className={cn(
                "block pt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
                productTone
              )}
            >
              {MPA_BRAND_PRODUCT_LINE}
            </span>
          ) : null}
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn("inline-flex min-w-0 items-center gap-2.5 sm:gap-3", className)}
      aria-label={isDecorative ? undefined : accessibleName}
      aria-hidden={isDecorative || undefined}
    >
      {mark}
      <span className="min-w-0 leading-tight">
        {presentation.showBrandName ? <span className={cn("block", nameClass)}>{MPA_BRAND_NAME}</span> : null}
        {presentation.showTagline ? (
          <span className={cn("mt-0.5 block truncate text-xs font-medium sm:text-sm", mutedTone)}>
            {MPA_BRAND_TAGLINE}
          </span>
        ) : null}
      </span>
    </span>
  );
}

function brandNameClassName(scale: BrandNameScale, textTone: string): string {
  switch (scale) {
    case "hero":
      return cn("font-display text-2xl font-semibold tracking-tight sm:text-3xl", textTone);
    case "large":
      return cn("font-display text-xl font-semibold tracking-tight sm:text-2xl", textTone);
    case "standard":
      return cn("font-display text-lg font-semibold tracking-tight", textTone);
    case "compact":
    default:
      return cn("font-display text-base font-semibold tracking-tight", textTone);
  }
}
