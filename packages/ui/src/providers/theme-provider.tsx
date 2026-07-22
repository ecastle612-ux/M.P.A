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
import { canopyTokens } from "../tokens/canopy";

type ThemeMode = "light" | "dark";
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

const lightThemeVariables: Record<string, string> = {
  // Typography
  "--mpa-font-display": canopyTokens.font.display,
  "--mpa-font-sans": canopyTokens.font.sans,
  "--mpa-font-mono": canopyTokens.font.mono,

  // Core colors
  "--mpa-color-bg-app": canopyTokens.color.bg.app,
  "--mpa-color-bg-sidebar": canopyTokens.color.bg.sidebar,
  "--mpa-color-bg-sidebar-elevated": canopyTokens.color.bg.sidebarElevated,
  "--mpa-color-bg-surface": canopyTokens.color.bg.surface,
  "--mpa-color-bg-surface-elevated": canopyTokens.color.bg.surface,
  "--mpa-color-bg-surface-muted": canopyTokens.color.bg.surfaceMuted,
  "--mpa-color-bg-surface-sunken": canopyTokens.color.bg.sunken,
  "--mpa-color-bg-overlay": canopyTokens.color.bg.overlay,
  "--mpa-color-border-default": canopyTokens.color.border.default,
  "--mpa-color-border-subtle": canopyTokens.color.border.subtle,
  "--mpa-color-border-strong": canopyTokens.color.border.strong,
  "--mpa-color-border-focus": canopyTokens.color.border.focus,
  "--mpa-color-border-sidebar": canopyTokens.color.border.sidebar,
  "--mpa-color-text-primary": canopyTokens.color.text.primary,
  "--mpa-color-text-secondary": canopyTokens.color.text.secondary,
  "--mpa-color-text-muted": canopyTokens.color.text.muted,
  "--mpa-color-text-inverse": canopyTokens.color.text.inverse,
  "--mpa-color-text-sidebar": canopyTokens.color.text.sidebar,
  "--mpa-color-text-sidebar-active": canopyTokens.color.text.sidebarActive,
  "--mpa-color-text-link": canopyTokens.color.text.link,
  "--mpa-color-brand-primary": canopyTokens.color.brand.primary,
  "--mpa-color-brand-primary-hover": canopyTokens.color.brand.primaryHover,
  "--mpa-color-brand-primary-active": canopyTokens.color.brand.primaryActive,
  "--mpa-color-brand-primary-subtle": canopyTokens.color.brand.primarySubtle,
  "--mpa-color-brand-secondary": canopyTokens.color.brand.secondary,
  "--mpa-color-status-success": canopyTokens.color.status.success,
  "--mpa-color-status-success-subtle": canopyTokens.color.status.successSubtle,
  "--mpa-color-status-warning": canopyTokens.color.status.warning,
  "--mpa-color-status-warning-subtle": canopyTokens.color.status.warningSubtle,
  "--mpa-color-status-danger": canopyTokens.color.status.danger,
  "--mpa-color-status-danger-subtle": canopyTokens.color.status.dangerSubtle,
  "--mpa-color-status-info": canopyTokens.color.status.info,
  "--mpa-color-status-info-subtle": canopyTokens.color.status.infoSubtle,
  "--mpa-color-feedback-error": canopyTokens.color.text.danger,
  "--mpa-color-interactive-row-hover": "#F7F8FA",
  "--mpa-color-interactive-selected": canopyTokens.color.brand.primarySubtle,
  "--mpa-color-interactive-focus-ring": "#0F6B5640",
  "--mpa-color-interactive-disabled-bg": canopyTokens.color.bg.sunken,
  "--mpa-color-interactive-disabled-text": canopyTokens.color.border.strong,
  "--mpa-color-sidebar-accent": "#1FA87A",
  "--mpa-shadow-xs": "0 1px 2px rgb(18 21 26 / 0.04)",
  "--mpa-shadow-sm": "0 1px 3px rgb(18 21 26 / 0.06), 0 1px 2px rgb(18 21 26 / 0.04)",
  "--mpa-shadow-md": "0 4px 12px rgb(18 21 26 / 0.08), 0 2px 4px rgb(18 21 26 / 0.04)",
  "--mpa-shadow-lg": "0 12px 32px rgb(18 21 26 / 0.1), 0 4px 8px rgb(18 21 26 / 0.04)",
  "--mpa-shadow-focus": "0 0 0 3px var(--mpa-color-interactive-focus-ring)",
  "--mpa-radius-sm": canopyTokens.radius.sm,
  "--mpa-radius-md": canopyTokens.radius.md,
  "--mpa-radius-lg": canopyTokens.radius.lg,
  "--mpa-radius-xl": canopyTokens.radius.xl,
  "--mpa-space-1": canopyTokens.space[1],
  "--mpa-space-2": canopyTokens.space[2],
  "--mpa-space-3": canopyTokens.space[3],
  "--mpa-space-4": canopyTokens.space[4],
  "--mpa-space-6": canopyTokens.space[6],
  "--mpa-space-8": canopyTokens.space[8],
  "--mpa-duration-fast": canopyTokens.motion.duration.fast,
  "--mpa-duration-normal": canopyTokens.motion.duration.normal,
  "--mpa-duration-moderate": canopyTokens.motion.duration.moderate,
  "--mpa-motion-fast": canopyTokens.motion.duration.fast,
  "--mpa-motion-normal": canopyTokens.motion.duration.normal,
  "--mpa-motion-moderate": canopyTokens.motion.duration.moderate,
  "--mpa-ease-standard": canopyTokens.motion.easing.standard,
  "--mpa-easing-standard": canopyTokens.motion.easing.standard
};

const darkThemeVariables: Record<string, string> = {
  ...lightThemeVariables,
  "--mpa-color-bg-app": "#0B0D10",
  "--mpa-color-bg-surface": "#14181E",
  "--mpa-color-bg-surface-elevated": "#171C23",
  "--mpa-color-bg-surface-muted": "#1B2028",
  "--mpa-color-bg-surface-sunken": "#0F1318",
  "--mpa-color-bg-overlay": "#00000099",
  "--mpa-color-border-default": "#2A313C",
  "--mpa-color-border-subtle": "#202630",
  "--mpa-color-border-strong": "#4B5563",
  "--mpa-color-text-primary": "#F3F4F6",
  "--mpa-color-text-secondary": "#CBD5E1",
  "--mpa-color-text-muted": "#94A3B8",
  "--mpa-color-brand-primary": "#1FA87A",
  "--mpa-color-brand-primary-hover": "#32B98B",
  "--mpa-color-brand-primary-active": "#15825F",
  "--mpa-color-brand-primary-subtle": "#12352C",
  "--mpa-color-interactive-row-hover": "#1B2028",
  "--mpa-color-interactive-selected": "#12352C",
  "--mpa-color-interactive-disabled-bg": "#202630",
  "--mpa-color-interactive-disabled-text": "#64748B",
  "--mpa-color-status-success-subtle": "#12352C",
  "--mpa-color-status-warning-subtle": "#3A2A10",
  "--mpa-color-status-danger-subtle": "#3A1714",
  "--mpa-color-status-info-subtle": "#142A3A",
  "--mpa-shadow-xs": "0 1px 2px rgb(0 0 0 / 0.28)",
  "--mpa-shadow-sm": "0 1px 3px rgb(0 0 0 / 0.3), 0 1px 2px rgb(0 0 0 / 0.24)",
  "--mpa-shadow-md": "0 4px 12px rgb(0 0 0 / 0.34), 0 2px 4px rgb(0 0 0 / 0.24)",
  "--mpa-shadow-lg": "0 12px 32px rgb(0 0 0 / 0.42), 0 4px 8px rgb(0 0 0 / 0.26)"
};

function themeVariablesForMode(mode: ThemeMode): Record<string, string> {
  return mode === "dark" ? darkThemeVariables : lightThemeVariables;
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
    () => initialPreference ?? "system"
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

  // Keep html data-theme/colorScheme in sync — CSS vars stay on the wrapper to avoid
  // RSC/html style fights wiping tokens during navigation (DPX-003 theme Sev-1).
  useEffect(() => {
    document.documentElement.dataset["theme"] = mode;
    document.documentElement.style.colorScheme = mode;
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
