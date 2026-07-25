/**
 * BR-002 runtime stability — single theme source for SSR + client.
 * Cookie is authoritative for SSR; localStorage stays for client preference UX.
 */

export const THEME_PREFERENCE_STORAGE_KEY = "mpa:theme-preference";
export const THEME_MODE_COOKIE = "mpa-theme-mode";
export const THEME_PREFERENCE_COOKIE = "mpa-theme-preference";

export type ThemeMode = "light" | "dark";
export type ThemePreference = ThemeMode | "system";

/** First-visit default when no cookie/localStorage preference exists. */
export const DEFAULT_THEME_PREFERENCE: ThemePreference = "light";

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

/** Keep logo tone in sync with theme on html + body (loaders read these before React). */
export function applyDocumentBrandSurface(mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  const tone = brandSurfaceToneForMode(mode);
  document.documentElement.dataset["theme"] = mode;
  document.documentElement.style.colorScheme = mode;
  document.documentElement.setAttribute("data-brand-surface", tone);
  if (document.body) {
    document.body.setAttribute("data-brand-surface", tone);
  }
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
  // Prefer localStorage, then cookie preference, then DEFAULT_THEME_PREFERENCE (light).
  // Also sets data-brand-surface so loading logos match theme before React hydrates.
  return `try{var pk="${THEME_PREFERENCE_STORAGE_KEY}";var p=localStorage.getItem(pk);function cookieVal(n){var m=document.cookie.match(new RegExp("(?:^|; )"+n+"=([^;]*)"));return m?decodeURIComponent(m[1]):"";}if(p!=="light"&&p!=="dark"&&p!=="system"){var cp=cookieVal("${THEME_PREFERENCE_COOKIE}");p=(cp==="light"||cp==="dark"||cp==="system")?cp:"${DEFAULT_THEME_PREFERENCE}";}var cm=cookieVal("${THEME_MODE_COOKIE}");var m=(p==="light"||p==="dark")?p:(cm==="light"||cm==="dark")?cm:(p==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):"light");var bs=m==="dark"?"dark-surface":"light-surface";document.documentElement.dataset.theme=m;document.documentElement.style.colorScheme=m;document.documentElement.setAttribute("data-brand-surface",bs);if(document.body)document.body.setAttribute("data-brand-surface",bs);var s=location.protocol==="https:"?"; Secure":"";document.cookie="${THEME_MODE_COOKIE}="+m+"; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax"+s;document.cookie="${THEME_PREFERENCE_COOKIE}="+p+"; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax"+s;try{localStorage.setItem(pk,p);}catch(_){}}catch(_){document.documentElement.dataset.theme="light";document.documentElement.style.colorScheme="light";document.documentElement.setAttribute("data-brand-surface","light-surface");}`;
}
