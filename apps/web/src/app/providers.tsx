"use client";

import type { ReactNode } from "react";
import { ThemeProvider, ToastProvider } from "@mpa/ui";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider darkModeEnabled={false}>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}
