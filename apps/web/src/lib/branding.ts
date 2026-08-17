/**
 * Approved M.P.A. brand asset paths (Canopy / BR-001 source assets).
 * UI should prefer these paths over inventing alternate artwork.
 */

export const MPA_BRAND_NAME = "M.P.A.";
export const MPA_BRAND_TAGLINE = "My Property Assistant";

/** Dark navy mark for light surfaces. */
export const MPA_LOGO_DARK_PATH = "/branding/logo-dark.png";
/** Light mark for dark surfaces. */
export const MPA_LOGO_LIGHT_PATH = "/branding/logo-light.png";
export const MPA_LOGO_DARK_WEBP_PATH = "/branding/logo-dark.webp";
export const MPA_LOGO_LIGHT_WEBP_PATH = "/branding/logo-light.webp";
/** Official dark mark on a mist plate for email clients that invert CSS backgrounds. */
export const MPA_EMAIL_LOGO_LOCKUP_PATH = "/branding/logo-email-lockup.png";

export const MPA_APP_ICON_192_PATH = "/icons/mpa-mark-192.png";
export const MPA_APP_ICON_512_PATH = "/icons/mpa-mark-512.png";
export const MPA_FAVICON_32_PATH = "/icons/mpa-favicon-32.png";
export const MPA_FAVICON_16_PATH = "/icons/mpa-favicon-16.png";
export const MPA_APPLE_TOUCH_ICON_PATH = "/icons/mpa-apple-touch.png";

export const MPA_PWA_ICON_SIZES = [16, 32, 48, 64, 128, 192, 256, 512] as const;

export function mpaMarkIconPath(size: (typeof MPA_PWA_ICON_SIZES)[number]): string {
  return `/icons/mpa-mark-${size}.png`;
}

/** Choose the approved lockup for the surrounding surface tone. */
export function logoPathForSurface(surface: "light" | "dark"): string {
  return surface === "dark" ? MPA_LOGO_LIGHT_PATH : MPA_LOGO_DARK_PATH;
}

export function logoWebpPathForSurface(surface: "light" | "dark"): string {
  return surface === "dark" ? MPA_LOGO_LIGHT_WEBP_PATH : MPA_LOGO_DARK_WEBP_PATH;
}
