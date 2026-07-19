"use client";

import type { ReactNode } from "react";
import { ThemeProvider, ToastProvider } from "@mpa/ui";
import { AuthSessionSync } from "../components/auth/auth-session-sync";
import { ErrorMonitor } from "../components/observability/error-monitor";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider darkModeEnabled={false}>
      <ToastProvider>
        <ErrorMonitor />
        <AuthSessionSync />
        {children}
      </ToastProvider>
    </ThemeProvider>
  );
}
