/**
 * M0-PERF Option B — post-login shell provider entry.
 * Keeps Theme/Toast out of the auth-route import graph.
 */
export { ThemeProvider, useTheme } from "./providers/theme-provider";
export { ToastProvider, useToast } from "./primitives/toast";
