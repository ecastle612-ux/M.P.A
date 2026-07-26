/**
 * PMX-004 Phase 3 — status bar / splash colors aligned to package + Canopy tokens.
 * Light theme-color = approved Canopy brand navy (`#0D2645`).
 * Dark theme-color / backgrounds = dark `--mpa-color-bg-app` (`#0B0D10`).
 * Splash light background = light `--mpa-color-bg-app` (`#F3F4F6`).
 */

export const MPA_PWA_THEME_COLOR_LIGHT = "#0D2645";
export const MPA_PWA_THEME_COLOR_DARK = "#0B0D10";
export const MPA_PWA_BACKGROUND_COLOR_LIGHT = "#F3F4F6";
export const MPA_PWA_BACKGROUND_COLOR_DARK = "#0B0D10";

export type NativeShellThemeMode = "light" | "dark";

export function themeColorForMode(mode: NativeShellThemeMode): string {
  return mode === "dark" ? MPA_PWA_THEME_COLOR_DARK : MPA_PWA_THEME_COLOR_LIGHT;
}

export function backgroundColorForMode(mode: NativeShellThemeMode): string {
  return mode === "dark" ? MPA_PWA_BACKGROUND_COLOR_DARK : MPA_PWA_BACKGROUND_COLOR_LIGHT;
}

/** Keep `<meta name="theme-color">` + html background in sync with resolved mode (cold start + toggles). */
export function syncNativeShellThemeChrome(mode: NativeShellThemeMode): void {
  if (typeof document === "undefined") return;
  const color = themeColorForMode(mode);
  const background = backgroundColorForMode(mode);

  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", color);
  document.documentElement.style.backgroundColor = background;
  if (document.body) {
    document.body.style.backgroundColor = background;
  }
}
