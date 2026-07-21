"use client";

import { createContext, useContext, type ReactNode } from "react";
import { cn } from "@mpa/ui";
import {
  MPA_BRAND_EMBEDDED_TEXT_MIN_PX,
  MPA_BRAND_NAME,
  MPA_BRAND_PRODUCT_LINE,
  MPA_BRAND_TAGLINE,
  MPA_LOGO_ASPECT_RATIO,
  logoPathForBackground,
  resolveBrandPresentation,
  type BrandLogoPurpose,
  type BrandLogoTone,
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
  /** Collapse chrome (sidebar / drawer scroll). */
  collapsed?: boolean | undefined;
  priority?: boolean | undefined;
  decorative?: boolean | undefined;
  className?: string | undefined;
  "aria-hidden"?: boolean | undefined;
};

/**
 * BR-001 — Sole approved React API for M.P.A. branding.
 * Screens pass a purpose; this component owns asset, mode, size, theme, type, spacing.
 */
export function BrandLogo({
  purpose,
  collapsed = false,
  priority = false,
  decorative = false,
  className,
  "aria-hidden": ariaHidden
}: BrandLogoProps) {
  if (purpose === "browser") {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "[BR-001] purpose=\"browser\" is for favicon/PWA/launcher only — do not render BrandLogo on product UI."
      );
    }
  }

  const surfaceTone = useContext(BrandSurfaceToneContext);
  const presentation = resolveBrandPresentation(purpose, { collapsed });
  const markPx = presentation.markPx;
  // Amendment B: never present embedded-text mark alone below 80px.
  const showLockup =
    presentation.mode !== "icon" &&
    (presentation.showBrandName ||
      presentation.useLockup ||
      markPx < MPA_BRAND_EMBEDDED_TEXT_MIN_PX);
  const logoSrc = logoPathForBackground("auto", surfaceTone);
  const isDecorative = decorative || ariaHidden;
  const markHeight = Math.round(markPx * MPA_LOGO_ASPECT_RATIO);
  const accessibleName = `${MPA_BRAND_NAME} ${MPA_BRAND_TAGLINE}`;

  const mark = (
    // eslint-disable-next-line @next/next/no-img-element -- BR-001 BrandLogo owns approved branding assets.
    <img
      src={logoSrc}
      alt={isDecorative || showLockup ? "" : accessibleName}
      width={markPx}
      height={markHeight}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      aria-hidden={isDecorative || showLockup || undefined}
      className="block h-auto max-w-full shrink-0 object-contain"
      style={{ width: markPx, height: "auto" }}
    />
  );

  if (presentation.mode === "icon" || !showLockup) {
    return (
      <span className={cn("inline-flex shrink-0 items-center", className)} aria-label={isDecorative ? undefined : accessibleName}>
        {mark}
      </span>
    );
  }

  const textTone =
    surfaceTone === "dark-surface"
      ? "text-[var(--mpa-color-text-inverse)]"
      : "text-[var(--mpa-color-text-primary)]";
  const mutedTone =
    surfaceTone === "dark-surface" ? "text-white/75" : "text-[var(--mpa-color-text-secondary)]";
  const productTone =
    surfaceTone === "dark-surface" ? "text-white/55" : "text-[var(--mpa-color-text-muted)]";

  if (presentation.layout === "stack") {
    return (
      <span
        className={cn("inline-flex flex-col items-center gap-2 text-center", className)}
        aria-label={isDecorative ? undefined : accessibleName}
        aria-hidden={isDecorative || undefined}
      >
        {mark}
        {presentation.showBrandName ? (
          <span className="space-y-0.5">
            <span className={cn("block font-display text-xl font-semibold tracking-tight sm:text-2xl", textTone)}>
              {MPA_BRAND_NAME}
            </span>
            {presentation.showTagline ? (
              <span className={cn("block text-xs sm:text-sm", mutedTone)}>{MPA_BRAND_TAGLINE}</span>
            ) : null}
            {presentation.showProductLine ? (
              <span
                className={cn(
                  "block text-[10px] font-medium uppercase tracking-[0.12em] sm:text-[11px]",
                  productTone
                )}
              >
                {MPA_BRAND_PRODUCT_LINE}
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <span
      className={cn("inline-flex min-w-0 items-center gap-2.5", className)}
      aria-label={isDecorative ? undefined : accessibleName}
      aria-hidden={isDecorative || undefined}
    >
      {mark}
      <span className="min-w-0 leading-tight">
        {presentation.showBrandName ? (
          <span className={cn("block font-display text-base font-semibold tracking-tight", textTone)}>
            {MPA_BRAND_NAME}
          </span>
        ) : null}
        {presentation.showTagline ? (
          <span className={cn("block truncate text-xs", mutedTone)}>{MPA_BRAND_TAGLINE}</span>
        ) : null}
      </span>
    </span>
  );
}
