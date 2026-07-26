"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { themeCssVariables, type ThemeMode } from "../tokens/css-variables";

type ThemePreference = ThemeMode | "system";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  darkModeEnabled: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_STORAGE_KEY = "mpa:theme-preference";

function themeVariablesForMode(mode: ThemeMode): Record<string, string> {
  return themeCssVariables(mode);
}

function systemMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveMode(preference: ThemePreference, darkModeEnabled: boolean, defaultMode: ThemeMode): ThemeMode {
  const resolvedMode = preference === "system" ? systemMode() : preference;
  if (!darkModeEnabled && resolvedMode === "dark") return defaultMode;
  return resolvedMode;
}

export function ThemeProvider({
  children,
  defaultMode = "light",
  darkModeEnabled = true,
  /** SSR/client must share this value (cookie → layout → provider) to avoid logo hydration swaps. */
  initialMode,
  initialPreference,
  /** Persist cookies / analytics when theme commits (app shell). */
  onThemeCommit
}: {
  children: ReactNode;
  defaultMode?: ThemeMode;
  darkModeEnabled?: boolean;
  initialMode?: ThemeMode;
  initialPreference?: ThemePreference;
  onThemeCommit?: (preference: ThemePreference, mode: ThemeMode) => void;
}) {
  // Authoritative initial state from SSR cookies — do NOT re-read localStorage here
  // (that caused logo-dark → logo-light swaps on refresh).
  const [preference, setPreferenceState] = useState<ThemePreference>(
    () => initialPreference ?? "light"
  );
  const [mode, setModeState] = useState<ThemeMode>(
    () => initialMode ?? defaultMode
  );

  const applyPreference = useCallback(
    (nextPreference: ThemePreference) => {
      const nextMode = resolveMode(nextPreference, darkModeEnabled, defaultMode);
      setPreferenceState(nextPreference);
      setModeState(nextMode);
      onThemeCommit?.(nextPreference, nextMode);
    },
    [darkModeEnabled, defaultMode, onThemeCommit],
  );

  // DPX-003: resolve system preference on mount (SSR defaults system→light and must not stick).
  useEffect(() => {
    if (preference !== "system" || !darkModeEnabled) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const nextMode = media.matches ? "dark" : "light";
    setModeState((current) => {
      if (current === nextMode) return current;
      onThemeCommit?.(preference, nextMode);
      return nextMode;
    });
    const onChange = () => {
      const changed = media.matches ? "dark" : "light";
      setModeState(changed);
      onThemeCommit?.(preference, changed);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [darkModeEnabled, onThemeCommit, preference]);

  const cssVariables = useMemo(() => themeVariablesForMode(mode), [mode]);

  // Keep html data-theme/colorScheme + brand-surface in sync — CSS vars stay on the
  // wrapper to avoid RSC/html style fights wiping tokens during navigation (DPX-003).
  // data-brand-surface must match so loading logos pick default vs dark-mode asset.
  useEffect(() => {
    const tone = mode === "dark" ? "dark-surface" : "light-surface";
    document.documentElement.dataset["theme"] = mode;
    document.documentElement.style.colorScheme = mode;
    document.documentElement.setAttribute("data-brand-surface", tone);
    if (document.body) {
      document.body.setAttribute("data-brand-surface", tone);
    }
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      preference,
      darkModeEnabled,
      setMode: (nextMode) => {
        if (!darkModeEnabled && nextMode === "dark") return;
        try {
          window.localStorage.setItem(THEME_STORAGE_KEY, nextMode);
        } catch {
          // Non-fatal.
        }
        setPreferenceState(nextMode);
        setModeState(nextMode);
        onThemeCommit?.(nextMode, nextMode);
      },
      setPreference: (nextPreference) => {
        try {
          window.localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
        } catch {
          // Non-fatal.
        }
        applyPreference(nextPreference);
      }
    }),
    [applyPreference, darkModeEnabled, mode, onThemeCommit, preference],
  );
  const style = cssVariables as React.CSSProperties;

  return (
    <ThemeContext.Provider value={value}>
      <div data-theme={mode} style={style} suppressHydrationWarning>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
