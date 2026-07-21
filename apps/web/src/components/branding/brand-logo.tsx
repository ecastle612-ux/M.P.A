"use client";

import { createContext, useContext, type ReactNode } from "react";
import { cn } from "@mpa/ui";
import {
  MPA_BRAND_NAME,
  MPA_BRAND_PRODUCT_LINE,
  MPA_BRAND_SYMBOL_CROP,
  MPA_BRAND_TAGLINE,
  MPA_LOGO_ASPECT_RATIO,
  logoPathForBackground,
  resolveBrandPresentation,
  type BrandLogoPurpose,
  type BrandLogoTone,
  type BrandMarkRole,
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
 * BR-001 / BR-002 / BR-002A — Sole approved React brand API.
 * Brand recognition takes priority over logo fidelity.
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
  const logoSrc = logoPathForBackground("auto", surfaceTone);
  const isDecorative = decorative || ariaHidden;
  const accessibleName = `${MPA_BRAND_NAME} ${MPA_BRAND_TAGLINE}`;

  // Solid Canopy ink — never rely on theme vars that can invert during SSR/theme sync.
  const textTone = surfaceTone === "dark-surface" ? "text-[#F3F4F6]" : "text-[#12151A]";
  const mutedTone = surfaceTone === "dark-surface" ? "text-white/80" : "text-[#4B5563]";
  const productTone = surfaceTone === "dark-surface" ? "text-white/55" : "text-[#6B7280]";

  const mark = (
    <BrandMark
      src={logoSrc}
      markPx={markPx}
      markRole={presentation.markRole}
      priority={priority}
      alt={isDecorative || showTypography ? "" : accessibleName}
      ariaHidden={isDecorative || showTypography || undefined}
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

function BrandMark({
  src,
  markPx,
  markRole,
  priority,
  alt,
  ariaHidden
}: {
  src: string;
  markPx: number;
  markRole: BrandMarkRole;
  priority: boolean;
  alt: string;
  ariaHidden: boolean | undefined;
}) {
  const cropHouse = markRole === "symbol" || markRole === "icon";
  const markHeight = Math.round(markPx * MPA_LOGO_ASPECT_RATIO);

  if (!cropHouse) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- BrandLogo owns approved branding assets.
      <img
        src={src}
        alt={alt}
        width={markPx}
        height={markHeight}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        aria-hidden={ariaHidden}
        className="block h-auto max-w-full shrink-0 object-contain"
        style={{ width: markPx, height: "auto" }}
        suppressHydrationWarning
      />
    );
  }

  const zoomed = Math.round(markPx * MPA_BRAND_SYMBOL_CROP.zoom);

  return (
    <span
      className="relative block shrink-0 overflow-hidden"
      style={{ width: markPx, height: markPx }}
      aria-hidden={ariaHidden}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- BrandLogo owns approved branding assets. */}
      <img
        src={src}
        alt={alt}
        width={zoomed}
        height={zoomed}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className="pointer-events-none absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2 object-cover"
        style={{
          width: zoomed,
          height: zoomed,
          objectPosition: `50% ${MPA_BRAND_SYMBOL_CROP.focusYPercent}%`
        }}
        suppressHydrationWarning
      />
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
