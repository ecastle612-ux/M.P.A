export const MPA_BRAND_NAME = "M.P.A.";
export const MPA_BRAND_TAGLINE = "My Property Assistant";

/** Official production logo — single source of truth. Do not duplicate or regenerate. */
export const MPA_LOGO_PATH = "/branding/mpa-logo.svg";

export const MPA_APP_ICON_192_PATH = "/icons/icon-192.png";
export const MPA_APP_ICON_512_PATH = "/icons/icon-512.png";
export const MPA_FAVICON_32_PATH = "/icons/favicon-32.png";
export const MPA_FAVICON_16_PATH = "/icons/favicon-16.png";
export const MPA_APPLE_TOUCH_ICON_PATH = "/icons/apple-touch-icon.png";

/** Square logo viewBox from official SVG (187.5 × 187.5). */
export const MPA_LOGO_ASPECT_RATIO = 1;

/** Intrinsic dimensions from official SVG width/height attributes. */
export const MPA_LOGO_INTRINSIC_SIZE = 250;

export const MPA_LOGO_WIDTH = {
  sidebarCollapsed: 34,
  /** Icon mark height in sidebar header (layout-only; paired with object-view-box). */
  sidebarMark: 34,
  sidebarExpanded: 180,
  login: 260,
  loading: 80,
  mobile: 32
} as const;
