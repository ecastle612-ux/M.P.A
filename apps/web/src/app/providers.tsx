"use client";

import type { ReactNode } from "react";
import { ThemeProvider, ToastProvider } from "@mpa/ui";
import { AuthSessionSync } from "../components/auth/auth-session-sync";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider darkModeEnabled={false}>
      <ToastProvider>
        <AuthSessionSync />
        {children}
      </ToastProvider>
    </ThemeProvider>
  );
}
