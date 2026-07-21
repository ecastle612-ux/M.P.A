/**
 * BR-002 runtime stability — single theme source for SSR + client.
 * Cookie is authoritative for SSR; localStorage stays for client preference UX.
 */

export const THEME_PREFERENCE_STORAGE_KEY = "mpa:theme-preference";
export const THEME_MODE_COOKIE = "mpa-theme-mode";
export const THEME_PREFERENCE_COOKIE = "mpa-theme-preference";

export type ThemeMode = "light" | "dark";
export type ThemePreference = ThemeMode | "system";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isThemeMode(value: string | undefined | null): value is ThemeMode {
  return value === "light" || value === "dark";
}

export function isThemePreference(value: string | undefined | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function resolveThemeMode(preference: ThemePreference, systemIsDark: boolean): ThemeMode {
  if (preference === "system") return systemIsDark ? "dark" : "light";
  return preference;
}

export function brandSurfaceToneForMode(mode: ThemeMode): "light-surface" | "dark-surface" {
  return mode === "dark" ? "dark-surface" : "light-surface";
}

/** Cookie write for browser (ThemeProvider / beforeInteractive). */
export function persistThemeCookies(preference: ThemePreference, mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${THEME_MODE_COOKIE}=${mode}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
  document.cookie = `${THEME_PREFERENCE_COOKIE}=${preference}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

/** Inline script: must stay in sync with ThemeProvider resolution rules. */
export function buildThemeInitScript(): string {
  return `try{var pk="${THEME_PREFERENCE_STORAGE_KEY}";var p=localStorage.getItem(pk);if(p!=="light"&&p!=="dark"&&p!=="system")p="system";var m=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches)?"dark":"light";document.documentElement.dataset.theme=m;document.documentElement.style.colorScheme=m;var s=location.protocol==="https:"?"; Secure":"";document.cookie="${THEME_MODE_COOKIE}="+m+"; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax"+s;document.cookie="${THEME_PREFERENCE_COOKIE}="+p+"; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax"+s;}catch(_){document.documentElement.dataset.theme="light";document.documentElement.style.colorScheme="light";}`;
}
