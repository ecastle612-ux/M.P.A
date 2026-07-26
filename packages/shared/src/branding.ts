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

/**
 * ADR-019 approved assets — branding system only. PNG kept for email/PDF/legacy.
 *
 * Filenames describe ink color of the mark (not the theme name):
 * - logo-dark = default / light-theme logo (dark navy mark on light surfaces)
 * - logo-light = dark-mode logo (light mark on dark surfaces)
 */
export const MPA_LOGO_LIGHT_PATH = "/branding/logo-light.png";
export const MPA_LOGO_DARK_PATH = "/branding/logo-dark.png";
/** M0-PERF-001 — WebP delivery for browser UI (PNG remains fallback). */
export const MPA_LOGO_LIGHT_WEBP_PATH = "/branding/logo-light.webp";
export const MPA_LOGO_DARK_WEBP_PATH = "/branding/logo-dark.webp";

export const MPA_LOGO_ASPECT_RATIO = 1;
export const MPA_LOGO_INTRINSIC_SIZE = 512;

/** Embedded wordmark in PNG is not trusted below this display width. */
export const MPA_BRAND_EMBEDDED_TEXT_MIN_PX = 80;

/** Display floors for hero/display marks. */
export const MPA_BRAND_MIN_MARK_PX = {
  icon: 64,
  symbol: 68,
  navigation: 112,
  authentication: 208,
  splash: 280
} as const;

/**
 * @deprecated Prefer BrandLogoPurpose + resolveBrandPresentation.
 */
export const MPA_LOGO_WIDTH = {
  sidebarCollapsed: 64,
  sidebarExpanded: 72,
  navigation: 72,
  login: 208,
  loading: 208,
  mobile: 112,
  email: 72,
  pdf: 72,
  inline: 68
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

/** Light theme → default logo (logo-dark). Dark theme → dark-mode logo (logo-light). */
export function logoPathForTone(tone: BrandSurfaceTone): string {
  return tone === "dark-surface" ? MPA_LOGO_LIGHT_PATH : MPA_LOGO_DARK_PATH;
}

/** Light theme → default logo WebP. Dark theme → dark-mode logo WebP. */
export function logoWebpPathForTone(tone: BrandSurfaceTone): string {
  return tone === "dark-surface" ? MPA_LOGO_LIGHT_WEBP_PATH : MPA_LOGO_DARK_WEBP_PATH;
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
      // Full approved logo carries name/tagline; theme surface picks light vs dark asset.
      return {
        purpose,
        mode: "hero",
        markPx: MPA_BRAND_MIN_MARK_PX.authentication,
        markRole: "display",
        brandNameScale: "hero",
        showBrandName: false,
        showTagline: false,
        showProductLine: false,
        useLockup: false,
        layout: "stack",
        allowsIconOnly: true
      };
    case "splash":
      return {
        purpose,
        mode: "hero",
        markPx: MPA_BRAND_MIN_MARK_PX.splash,
        markRole: "display",
        brandNameScale: "hero",
        showBrandName: false,
        showTagline: false,
        showProductLine: false,
        useLockup: false,
        layout: "stack",
        allowsIconOnly: true
      };
    case "sidebar":
      // Dark sidebar always uses logo-light via BrandSurfaceTone; show full approved logo.
      if (collapsed) {
        return {
          purpose,
          mode: "compact",
          markPx: MPA_BRAND_MIN_MARK_PX.navigation,
          markRole: "display",
          brandNameScale: "compact",
          showBrandName: false,
          showTagline: false,
          showProductLine: false,
          useLockup: false,
          layout: "inline",
          allowsIconOnly: true
        };
      }
      return {
        purpose,
        mode: "standard",
        markPx: MPA_BRAND_MIN_MARK_PX.navigation,
        markRole: "display",
        brandNameScale: "standard",
        showBrandName: false,
        showTagline: false,
        showProductLine: false,
        useLockup: false,
        layout: "inline",
        allowsIconOnly: true
      };
    case "drawer":
      if (collapsed) {
        return {
          purpose,
          mode: "compact",
          markPx: MPA_BRAND_MIN_MARK_PX.navigation,
          markRole: "display",
          brandNameScale: "large",
          showBrandName: false,
          showTagline: false,
          showProductLine: false,
          useLockup: false,
          layout: "inline",
          allowsIconOnly: true
        };
      }
      return {
        purpose,
        mode: "compact",
        markPx: 128,
        markRole: "display",
        brandNameScale: "large",
        showBrandName: false,
        showTagline: false,
        showProductLine: false,
        useLockup: false,
        layout: "stack",
        allowsIconOnly: true
      };
    case "header":
      // Mobile/portal header: full theme logo only (light → logo-dark, dark → logo-light).
      return {
        purpose,
        mode: "compact",
        markPx: MPA_BRAND_MIN_MARK_PX.navigation,
        markRole: "display",
        brandNameScale: "large",
        showBrandName: false,
        showTagline: false,
        showProductLine: false,
        useLockup: false,
        layout: "inline",
        allowsIconOnly: true
      };
    case "loading":
      // Full theme logo — same asset switch as every other surface.
      return {
        purpose,
        mode: "loading",
        markPx: MPA_LOGO_WIDTH.loading,
        markRole: "display",
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
