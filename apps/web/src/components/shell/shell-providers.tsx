import type { ReactNode } from "react";
import { AppProviders } from "./app-providers";
import { RegisterServiceWorker } from "../pwa/register-service-worker";
import { readServerThemeState } from "../../lib/theme/read-theme-cookies";

/**
 * M0-PERF Option B — mount Theme/Toast/AuthSessionSync/SW only on post-login shells.
 * Auth routes intentionally omit this wrapper so login avoids the shared provider graph.
 */
export async function ShellProviders({ children }: { children: ReactNode }) {
  const theme = await readServerThemeState();

  return (
    <AppProviders initialMode={theme.mode} initialPreference={theme.preference}>
      <RegisterServiceWorker />
      {children}
    </AppProviders>
  );
}
