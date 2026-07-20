"use client";

import { createContext, useContext, type ReactNode } from "react";
import { cn } from "@mpa/ui";
import {
  type BrandSurfaceTone,
  type BrandLogoTone,
  MPA_BRAND_NAME,
  MPA_BRAND_TAGLINE,
  MPA_LOGO_ASPECT_RATIO,
  MPA_LOGO_WIDTH,
  logoPathForBackground
} from "../../lib/branding";

export type LogoSize = keyof typeof MPA_LOGO_WIDTH;

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

export function Logo({
  size,
  tone = "auto",
  className,
  priority = false,
  decorative = false,
  "aria-hidden": ariaHidden
}: {
  /** Preset width from UX-007 design tokens. */
  size?: LogoSize;
  /** Background tone. Prefer surface providers; explicit values are for non-inherited surfaces. */
  tone?: BrandLogoTone;
  className?: string;
  priority?: boolean;
  decorative?: boolean;
  "aria-hidden"?: boolean;
}) {
  const surfaceTone = useContext(BrandSurfaceToneContext);
  const displayWidth = size ? MPA_LOGO_WIDTH[size] : MPA_LOGO_WIDTH.sidebarExpanded;
  const displayHeight = Math.round(displayWidth * MPA_LOGO_ASPECT_RATIO);
  const logoSrc = logoPathForBackground(tone, surfaceTone);
  const isDecorative = decorative || ariaHidden;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- UX-007 logo primitive controls approved branding assets.
    <img
      src={logoSrc}
      alt={isDecorative ? "" : `${MPA_BRAND_NAME} ${MPA_BRAND_TAGLINE}`}
      width={displayWidth}
      height={displayHeight}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      aria-hidden={isDecorative || undefined}
      className={cn("block h-auto max-w-full shrink-0 object-contain", className)}
    />
  );
}
