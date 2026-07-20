export const MPA_BRAND_NAME = "M.P.A.";
export const MPA_BRAND_TAGLINE = "My Property Assistant";

export type BrandSurfaceTone = "light-surface" | "dark-surface";
export type BrandLogoTone = BrandSurfaceTone | "auto";

export const MPA_LOGO_LIGHT_PATH = "/branding/logo-light.png";
export const MPA_LOGO_DARK_PATH = "/branding/logo-dark.png";

export const MPA_LOGO_ASPECT_RATIO = 1;
export const MPA_LOGO_INTRINSIC_SIZE = 512;

export const MPA_LOGO_WIDTH = {
  sidebarCollapsed: 56,
  sidebarExpanded: 140,
  navigation: 96,
  login: 260,
  loading: 128,
  mobile: 56,
  email: 112,
  pdf: 96,
  inline: 96
} as const;

export function logoPathForTone(tone: BrandSurfaceTone): string {
  return tone === "dark-surface" ? MPA_LOGO_LIGHT_PATH : MPA_LOGO_DARK_PATH;
}

export function logoPathForBackground(tone: BrandLogoTone, fallbackTone: BrandSurfaceTone = "light-surface"): string {
  return logoPathForTone(tone === "auto" ? fallbackTone : tone);
}
