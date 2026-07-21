"use client";

import { useCallback, useEffect, type ReactNode } from "react";
import { ThemeProvider, ToastProvider, useTheme } from "@mpa/ui";
import { AuthSessionSync } from "../components/auth/auth-session-sync";
import { BrandSurfaceTone } from "../components/branding/brand-logo";
import {
  brandSurfaceToneForMode,
  persistThemeCookies,
  type ThemeMode,
  type ThemePreference
} from "../lib/theme/theme-sync";
import { initShellRuntimeTrace } from "../lib/debug/shell-runtime-trace";

export function AppProviders({
  children,
  initialMode,
  initialPreference
}: {
  children: ReactNode;
  initialMode: ThemeMode;
  initialPreference: ThemePreference;
}) {
  const onThemeCommit = useCallback((preference: ThemePreference, mode: ThemeMode) => {
    persistThemeCookies(preference, mode);
  }, []);

  useEffect(() => {
    initShellRuntimeTrace();
  }, []);

  return (
    <ThemeProvider
      darkModeEnabled
      initialMode={initialMode}
      initialPreference={initialPreference}
      onThemeCommit={onThemeCommit}
    >
      <ThemeAwareBrandSurface>
        <ToastProvider>
          <AuthSessionSync />
          {children}
        </ToastProvider>
      </ThemeAwareBrandSurface>
    </ThemeProvider>
  );
}

function ThemeAwareBrandSurface({ children }: { children: ReactNode }) {
  const { mode } = useTheme();
  return <BrandSurfaceTone tone={brandSurfaceToneForMode(mode)}>{children}</BrandSurfaceTone>;
}
