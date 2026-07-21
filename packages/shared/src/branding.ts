/**
 * BR-001 / ADR-021 — Permanent brand rendering source of truth.
 * Feature code must use <BrandLogo purpose="…" /> (or helpers below), never raw paths.
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

/** Amendment B — embedded wordmark becomes unreadable below this mark width. */
export const MPA_BRAND_EMBEDDED_TEXT_MIN_PX = 80;

/** Rule 6 floors. */
export const MPA_BRAND_MIN_MARK_PX = {
  icon: 48,
  navigation: 80,
  authentication: 160,
  splash: 220
} as const;

/**
 * @deprecated Prefer BrandLogoPurpose + resolveBrandPresentation. Kept for email height math during migration.
 */
export const MPA_LOGO_WIDTH = {
  sidebarCollapsed: 48,
  sidebarExpanded: 88,
  navigation: 80,
  login: 160,
  loading: 96,
  mobile: 48,
  email: 112,
  pdf: 96,
  inline: 80
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

/** Amendment A presentation modes. */
export type BrandPresentationMode = "hero" | "standard" | "compact" | "icon";

export type BrandPresentation = {
  purpose: BrandLogoPurpose;
  mode: BrandPresentationMode;
  /** Square mark width in CSS pixels. */
  markPx: number;
  showBrandName: boolean;
  showTagline: boolean;
  showProductLine: boolean;
  /** True when typography lockup accompanies (or replaces sole reliance on) the mark. */
  useLockup: boolean;
  layout: "stack" | "inline";
  /** Icon-only is forbidden for login/drawer product chrome. */
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
        showBrandName: true,
        showTagline: true,
        showProductLine: true,
        useLockup: true,
        layout: "stack",
        allowsIconOnly: false
      };
    case "sidebar":
      if (collapsed) {
        return compactPresentation(purpose, MPA_BRAND_MIN_MARK_PX.icon);
      }
      return {
        purpose,
        mode: "standard",
        markPx: MPA_BRAND_MIN_MARK_PX.navigation,
        showBrandName: true,
        showTagline: true,
        showProductLine: false,
        useLockup: true,
        layout: "inline",
        allowsIconOnly: false
      };
    case "drawer":
    case "header":
      return compactPresentation(purpose, collapsed ? MPA_BRAND_MIN_MARK_PX.icon : MPA_BRAND_MIN_MARK_PX.navigation);
    case "loading":
      return {
        purpose,
        mode: "compact",
        markPx: MPA_LOGO_WIDTH.loading,
        showBrandName: true,
        showTagline: false,
        showProductLine: false,
        useLockup: MPA_LOGO_WIDTH.loading < MPA_BRAND_EMBEDDED_TEXT_MIN_PX,
        layout: "stack",
        allowsIconOnly: false
      };
    case "email":
      return {
        purpose,
        mode: "standard",
        markPx: MPA_LOGO_WIDTH.email,
        showBrandName: false,
        showTagline: false,
        showProductLine: false,
        useLockup: MPA_LOGO_WIDTH.email < MPA_BRAND_EMBEDDED_TEXT_MIN_PX,
        layout: "inline",
        allowsIconOnly: false
      };
    case "pdf":
      return {
        purpose,
        mode: "compact",
        markPx: MPA_LOGO_WIDTH.pdf,
        showBrandName: false,
        showTagline: false,
        showProductLine: false,
        useLockup: MPA_LOGO_WIDTH.pdf < MPA_BRAND_EMBEDDED_TEXT_MIN_PX,
        layout: "inline",
        allowsIconOnly: false
      };
    case "browser":
      return {
        purpose,
        mode: "icon",
        markPx: MPA_BRAND_MIN_MARK_PX.icon,
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

function compactPresentation(purpose: BrandLogoPurpose, markPx: number): BrandPresentation {
  const safeMark = Math.max(markPx, MPA_BRAND_MIN_MARK_PX.icon);
  // Amendment B: never rely on embedded text below 80px — always lockup in compact UI.
  return {
    purpose,
    mode: "compact",
    markPx: safeMark,
    showBrandName: true,
    showTagline: false,
    showProductLine: false,
    useLockup: true,
    layout: "inline",
    allowsIconOnly: false
  };
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
