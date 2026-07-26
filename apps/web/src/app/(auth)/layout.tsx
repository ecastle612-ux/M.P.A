import type { ReactNode } from "react";

/**
 * M0-PERF Option B — minimal auth shell.
 * No ThemeProvider, ToastProvider, AuthSessionSync, or service worker registration.
 * Theme tokens come from root html[data-theme] + globals.css.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div data-mpa-shell="auth" data-brand-surface="dark-surface">
      {children}
    </div>
  );
}