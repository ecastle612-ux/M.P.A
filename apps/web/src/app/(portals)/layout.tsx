import type { ReactNode } from "react";
import { ShellProviders } from "../../components/shell/shell-providers";

/**
 * M0-PERF Option B — portal routes share post-login providers.
 * Auth routes under (auth) intentionally skip this group.
 */
export default async function PortalsLayout({ children }: { children: ReactNode }) {
  return <ShellProviders>{children}</ShellProviders>;
}
