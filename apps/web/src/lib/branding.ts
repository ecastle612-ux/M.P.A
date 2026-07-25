export {
  MPA_BRAND_NAME,
  MPA_BRAND_TAGLINE,
  MPA_BRAND_PRODUCT_LINE,
  MPA_BRAND_EMBEDDED_TEXT_MIN_PX,
  MPA_BRAND_MIN_MARK_PX,
  MPA_LOGO_ASPECT_RATIO,
  MPA_LOGO_DARK_PATH,
  MPA_LOGO_DARK_WEBP_PATH,
  MPA_LOGO_INTRINSIC_SIZE,
  MPA_LOGO_LIGHT_PATH,
  MPA_LOGO_LIGHT_WEBP_PATH,
  MPA_LOGO_WIDTH,
  brandMetadataIconEntries,
  logoPathForBackground,
  logoPathForTone,
  logoWebpPathForTone,
  resolveBrandAssetUrl,
  resolveBrandPresentation,
  type BrandLogoPurpose,
  type BrandLogoTone,
  type BrandMarkRole,
  type BrandNameScale,
  type BrandPresentation,
  type BrandPresentationMode,
  type BrandSurfaceTone
} from "@mpa/shared";

/**
 * PWA / favicon paths — default (light-theme) logo only.
 * Filenames are versioned (`mpa-mark-*`) so stale black install icons cannot linger by URL.
 */
export const MPA_APP_ICON_192_PATH = "/icons/mpa-mark-192.png";
export const MPA_APP_ICON_512_PATH = "/icons/mpa-mark-512.png";
export const MPA_FAVICON_32_PATH = "/icons/mpa-favicon-32.png";
export const MPA_FAVICON_16_PATH = "/icons/mpa-favicon-16.png";
export const MPA_APPLE_TOUCH_ICON_PATH = "/icons/mpa-apple-touch.png";

export const MPA_PWA_ICON_SIZES = [16, 32, 48, 64, 128, 192, 256, 512] as const;

export function mpaMarkIconPath(size: (typeof MPA_PWA_ICON_SIZES)[number]): string {
  return `/icons/mpa-mark-${size}.png`;
}
