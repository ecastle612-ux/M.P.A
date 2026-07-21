/**
 * BR-001 / ADR-021 — Single brand rendering API.
 * BR-002 / ADR-022 / BR-002A — Purpose-optimized, perception-first presentation.
 * Brand recognition takes priority over logo fidelity.
 */

export const MPA_BRAND_NAME = "M.P.A.";
export const MPA_BRAND_TAGLINE = "My Property Assistant";
export const MPA_BRAND_PRODUCT_LINE = "Property Operations OS";

export type BrandSurfaceTone = "light-surface" | "dark-surface";
export type BrandLogoTone = BrandSurfaceTone | "auto";

/** ADR-019 approved assets — branding system only. */
export const MPA_LOGO_LIGHT_PATH = "/branding/logo-light.png";
export const MPA_LOGO_DARK_PATH = "/branding/logo-dark.png";

export const MPA_LOGO_ASPECT_RATIO = 1;
export const MPA_LOGO_INTRINSIC_SIZE = 512;

/** Embedded wordmark in PNG is not trusted below this display width. */
export const MPA_BRAND_EMBEDDED_TEXT_MIN_PX = 80;

/**
 * ADR-019 assets include house + baked-in wordmark.
 * For markRole symbol/icon, crop to the house region so UI never shows faint PNG text.
 * Values are calibrated against logo-dark/logo-light content bbox (house ≈ y 27%–56%).
 */
export const MPA_BRAND_SYMBOL_CROP = {
  /** CSS object-position Y — house center in the 512 asset. */
  focusYPercent: 39,
  /** Zoom factor inside the square viewport (clips bottom wordmark). */
  zoom: 2.35
} as const;

/** Display floors for hero/display marks. */
export const MPA_BRAND_MIN_MARK_PX = {
  icon: 48,
  symbol: 52,
  navigation: 80,
  authentication: 160,
  splash: 220
} as const;

/**
 * @deprecated Prefer BrandLogoPurpose + resolveBrandPresentation.
 */
export const MPA_LOGO_WIDTH = {
  sidebarCollapsed: 48,
  sidebarExpanded: 56,
  navigation: 56,
  login: 160,
  loading: 96,
  mobile: 48,
  email: 56,
  pdf: 56,
  inline: 52
} as const;

export type BrandLogoPurpose =
  | "login"
  | "marketing"
  | "splash"
  | "onboarding"
  | "sidebar"
  | "drawer"
  | "header"
  | "loading"
  | "email"
  | "pdf"
  | "browser";

export type BrandPresentationMode = "hero" | "standard" | "compact" | "icon" | "loading";

/** How the mark is used — symbol never relies on embedded PNG text. */
export type BrandMarkRole = "display" | "symbol" | "icon";

export type BrandNameScale = "hero" | "large" | "standard" | "compact";

export type BrandPresentation = {
  purpose: BrandLogoPurpose;
  mode: BrandPresentationMode;
  markPx: number;
  markRole: BrandMarkRole;
  brandNameScale: BrandNameScale;
  showBrandName: boolean;
  showTagline: boolean;
  showProductLine: boolean;
  useLockup: boolean;
  layout: "stack" | "inline";
  allowsIconOnly: boolean;
};

export function logoPathForTone(tone: BrandSurfaceTone): string {
  return tone === "dark-surface" ? MPA_LOGO_LIGHT_PATH : MPA_LOGO_DARK_PATH;
}

export function logoPathForBackground(tone: BrandLogoTone, fallbackTone: BrandSurfaceTone = "light-surface"): string {
  return logoPathForTone(tone === "auto" ? fallbackTone : tone);
}

export function resolveBrandPresentation(
  purpose: BrandLogoPurpose,
  options: { collapsed?: boolean } = {}
): BrandPresentation {
  const collapsed = Boolean(options.collapsed);

  switch (purpose) {
    case "login":
    case "marketing":
    case "onboarding":
      return {
        purpose,
        mode: "hero",
        markPx: MPA_BRAND_MIN_MARK_PX.authentication,
        markRole: "display",
        brandNameScale: "hero",
        showBrandName: true,
        showTagline: true,
        showProductLine: true,
        useLockup: true,
        layout: "stack",
        allowsIconOnly: false
      };
    case "splash":
      return {
        purpose,
        mode: "hero",
        markPx: MPA_BRAND_MIN_MARK_PX.splash,
        markRole: "display",
        brandNameScale: "hero",
        showBrandName: true,
        showTagline: true,
        showProductLine: true,
        useLockup: true,
        layout: "stack",
        allowsIconOnly: false
      };
    case "sidebar":
      if (collapsed) {
        return {
          purpose,
          mode: "compact",
          markPx: MPA_BRAND_MIN_MARK_PX.symbol,
          markRole: "symbol",
          brandNameScale: "compact",
          showBrandName: true,
          showTagline: false,
          showProductLine: false,
          useLockup: true,
          layout: "inline",
          allowsIconOnly: false
        };
      }
      return {
        purpose,
        mode: "standard",
        markPx: MPA_BRAND_MIN_MARK_PX.symbol,
        markRole: "symbol",
        brandNameScale: "standard",
        showBrandName: true,
        showTagline: true,
        showProductLine: false,
        useLockup: true,
        layout: "inline",
        allowsIconOnly: false
      };
    case "drawer":
      // BR-002 / BR-002A: typography carries the brand — do not scale artwork for wordmark.
      if (collapsed) {
        return {
          purpose,
          mode: "compact",
          markPx: MPA_BRAND_MIN_MARK_PX.symbol,
          markRole: "symbol",
          brandNameScale: "large",
          showBrandName: true,
          showTagline: false,
          showProductLine: false,
          useLockup: true,
          layout: "inline",
          allowsIconOnly: false
        };
      }
      return {
        purpose,
        mode: "compact",
        markPx: 64,
        markRole: "symbol",
        brandNameScale: "large",
        showBrandName: true,
        showTagline: true,
        showProductLine: false,
        useLockup: true,
        layout: "stack",
        allowsIconOnly: false
      };
    case "header":
      return {
        purpose,
        mode: "compact",
        markPx: MPA_BRAND_MIN_MARK_PX.symbol,
        markRole: "symbol",
        brandNameScale: "large",
        showBrandName: true,
        showTagline: false,
        showProductLine: false,
        useLockup: true,
        layout: "inline",
        allowsIconOnly: false
      };
    case "loading":
      // BR-002A: elegant house mark only — never tiny full-logo wordmark.
      return {
        purpose,
        mode: "loading",
        markPx: MPA_LOGO_WIDTH.loading,
        markRole: "symbol",
        brandNameScale: "compact",
        showBrandName: false,
        showTagline: false,
        showProductLine: false,
        useLockup: false,
        layout: "stack",
        allowsIconOnly: true
      };
    case "email":
      return {
        purpose,
        mode: "standard",
        markPx: MPA_LOGO_WIDTH.email,
        markRole: "symbol",
        brandNameScale: "standard",
        showBrandName: true,
        showTagline: true,
        showProductLine: false,
        useLockup: true,
        layout: "inline",
        allowsIconOnly: false
      };
    case "pdf":
      return {
        purpose,
        mode: "compact",
        markPx: MPA_LOGO_WIDTH.pdf,
        markRole: "symbol",
        brandNameScale: "compact",
        showBrandName: false,
        showTagline: false,
        showProductLine: false,
        useLockup: false,
        layout: "inline",
        allowsIconOnly: true
      };
    case "browser":
      return {
        purpose,
        mode: "icon",
        markPx: MPA_BRAND_MIN_MARK_PX.icon,
        markRole: "icon",
        brandNameScale: "compact",
        showBrandName: false,
        showTagline: false,
        showProductLine: false,
        useLockup: false,
        layout: "inline",
        allowsIconOnly: true
      };
    default: {
      const _exhaustive: never = purpose;
      return _exhaustive;
    }
  }
}

/** Non-React channels (email/PDF) — purpose + surface tone only. */
export function resolveBrandAssetUrl(
  purpose: BrandLogoPurpose,
  surfaceTone: BrandSurfaceTone = "light-surface"
): { src: string; width: number; height: number; alt: string } {
  const presentation = resolveBrandPresentation(purpose);
  const width = presentation.markPx;
  return {
    src: logoPathForTone(surfaceTone),
    width,
    height: Math.round(width * MPA_LOGO_ASPECT_RATIO),
    alt: `${MPA_BRAND_NAME} ${MPA_BRAND_TAGLINE}`
  };
}

/** Metadata / favicon entries — browser purpose only (not UI BrandLogo). */
export function brandMetadataIconEntries(): Array<{
  url: string;
  type: string;
  sizes: string;
  media: string;
}> {
  return [
    {
      url: MPA_LOGO_DARK_PATH,
      type: "image/png",
      sizes: "512x512",
      media: "(prefers-color-scheme: light)"
    },
    {
      url: MPA_LOGO_LIGHT_PATH,
      type: "image/png",
      sizes: "512x512",
      media: "(prefers-color-scheme: dark)"
    }
  ];
}
