"use client";

import React, { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { canopyTokens } from "../tokens/canopy";

type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  darkModeEnabled: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  defaultMode = "light",
  darkModeEnabled = false
}: {
  children: ReactNode;
  defaultMode?: ThemeMode;
  darkModeEnabled?: boolean;
}) {
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      darkModeEnabled,
      setMode: (nextMode) => {
        if (!darkModeEnabled && nextMode === "dark") return;
        setModeState(nextMode);
      }
    }),
    [darkModeEnabled, mode],
  );

  const cssVariables: Record<string, string> = {
    // Typography
    "--mpa-font-display": canopyTokens.font.display,
    "--mpa-font-sans": canopyTokens.font.sans,
    "--mpa-font-mono": canopyTokens.font.mono,

    // Core colors
    "--mpa-color-bg-app": canopyTokens.color.bg.app,
    "--mpa-color-bg-sidebar": canopyTokens.color.bg.sidebar,
    "--mpa-color-bg-sidebar-elevated": canopyTokens.color.bg.sidebarElevated,
    "--mpa-color-bg-surface": canopyTokens.color.bg.surface,
    "--mpa-color-bg-surface-muted": canopyTokens.color.bg.surfaceMuted,
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
    "--mpa-color-brand-primary": canopyTokens.color.brand.primary,
    "--mpa-color-brand-primary-hover": canopyTokens.color.brand.primaryHover,
    "--mpa-color-brand-primary-active": canopyTokens.color.brand.primaryActive,
    "--mpa-color-brand-primary-subtle": canopyTokens.color.brand.primarySubtle,
    "--mpa-color-status-success": canopyTokens.color.status.success,
    "--mpa-color-status-warning": canopyTokens.color.status.warning,
    "--mpa-color-status-danger": canopyTokens.color.status.danger,
    "--mpa-color-status-info": canopyTokens.color.status.info,
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
    "--mpa-motion-fast": canopyTokens.motion.duration.fast,
    "--mpa-motion-normal": canopyTokens.motion.duration.normal,
    "--mpa-motion-moderate": canopyTokens.motion.duration.moderate,
    "--mpa-ease-standard": canopyTokens.motion.easing.standard
  };
  const style = cssVariables as React.CSSProperties;

  return (
    <ThemeContext.Provider value={value}>
      <div data-theme={mode} style={style}>
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
