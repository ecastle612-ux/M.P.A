"use client";

import type { ReactNode } from "react";
import { ThemeProvider, ToastProvider, useTheme } from "@mpa/ui";
import { AuthSessionSync } from "../components/auth/auth-session-sync";
import { BrandSurfaceTone } from "../components/branding/logo";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider darkModeEnabled>
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
  return <BrandSurfaceTone tone={mode === "dark" ? "dark-surface" : "light-surface"}>{children}</BrandSurfaceTone>;
}
