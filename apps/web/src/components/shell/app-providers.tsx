"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, type ReactNode } from "react";
import { ThemeProvider, ToastProvider, useTheme } from "@mpa/ui/shell";
import { BrandSurfaceTone } from "../branding/brand-surface-tone";
import {
  applyDocumentBrandSurface,
  brandSurfaceToneForMode,
  persistThemeCookies,
  type ThemeMode,
  type ThemePreference
} from "../../lib/theme/theme-sync";

/** Post-login only — never mounted under (auth). */
const AuthSessionSync = dynamic(
  () => import("../auth/auth-session-sync").then((m) => ({ default: m.AuthSessionSync })),
  { ssr: false }
);

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
    // Defer debug tracing — never on the critical path.
    const start = () => {
      void import("../../lib/debug/shell-runtime-trace").then((m) => {
        m.initShellRuntimeTrace();
      });
    };
    const ric = window.requestIdleCallback;
    if (typeof ric === "function") {
      const id = ric.call(window, start, { timeout: 4000 });
      return () => window.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(start, 2000);
    return () => window.clearTimeout(t);
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
  const tone = brandSurfaceToneForMode(mode);

  useEffect(() => {
    applyDocumentBrandSurface(mode);
  }, [mode]);

  return <BrandSurfaceTone tone={tone}>{children}</BrandSurfaceTone>;
}
