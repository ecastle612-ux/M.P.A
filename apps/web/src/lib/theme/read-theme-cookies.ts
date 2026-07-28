import { cookies } from "next/headers";
import {
  DEFAULT_THEME_PREFERENCE,
  THEME_MODE_COOKIE,
  THEME_PREFERENCE_COOKIE,
  isThemeMode,
  isThemePreference,
  type ThemeMode,
  type ThemePreference
} from "./theme-sync";

export type ServerThemeState = {
  mode: ThemeMode;
  preference: ThemePreference;
};

/**
 * Authoritative SSR theme. First visit (no cookies) defaults to light.
 * Subsequent requests use the cookie written by beforeInteractive / ThemeProvider.
 */
export async function readServerThemeState(): Promise<ServerThemeState> {
  const jar = await cookies();
  const modeRaw = jar.get(THEME_MODE_COOKIE)?.value;
  const preferenceRaw = jar.get(THEME_PREFERENCE_COOKIE)?.value;

  const preference: ThemePreference = isThemePreference(preferenceRaw)
    ? preferenceRaw
    : DEFAULT_THEME_PREFERENCE;
  const mode: ThemeMode = isThemeMode(modeRaw)
    ? modeRaw
    : preference === "light" || preference === "dark"
      ? preference
      : "light";

  return { mode, preference };
}
