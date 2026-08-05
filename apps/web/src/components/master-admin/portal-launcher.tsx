"use client";

import { WorkspaceLauncher } from "../workspace/workspace-launcher";
import { PORTAL_LAUNCHER_GROUPS } from "../../lib/master-admin/portal-launcher-catalog";

/**
 * Backward-compatible alias — NAV-001 / ARCH-001.
 * Prefer `WorkspaceLauncher` for new hosts; this reuses the same framework + catalog.
 */
export function PortalLauncher({
  title = "Workspace Launcher",
  description = "One-click access to every role and dashboard. View As and Test Mode use existing Master Admin tooling — production permissions stay unchanged.",
  embedded = false
}: {
  title?: string;
  description?: string;
  embedded?: boolean;
}) {
  return (
    <WorkspaceLauncher
      groups={PORTAL_LAUNCHER_GROUPS}
      title={title}
      description={description}
      embedded={embedded}
    />
  );
}
