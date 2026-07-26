/**
 * PMX-004 Phase 2 — lazy camera readiness (no onboarding pre-prompt).
 */

import { emitPwaFunnelEvent, PWA_FUNNEL_EVENTS } from "./funnel";
import { markChecklist } from "./onboarding-storage";
import type { PwaPlatform } from "./platform";

export async function queryCameraPermissionState(): Promise<PermissionState | "unsupported"> {
  if (typeof window === "undefined" || !navigator.permissions?.query) {
    return "unsupported";
  }
  try {
    const result = await navigator.permissions.query({ name: "camera" as PermissionName });
    return result.state;
  } catch {
    return "unsupported";
  }
}

export function markCameraReadyFromIntent(options: {
  organizationId: string | null | undefined;
  platform: PwaPlatform;
  standalone: boolean;
  role?: string | null;
}): void {
  markChecklist(options.organizationId, { cameraReady: true });
  emitPwaFunnelEvent(
    PWA_FUNNEL_EVENTS.cameraGranted,
    {
      platform: options.platform,
      standalone: options.standalone,
      role: options.role ?? null,
      organizationId: options.organizationId ?? null
    },
    { oncePerSession: true }
  );
}

/** Sync checklist from Permissions API without prompting. */
export async function syncCameraReadyFromPermissions(options: {
  organizationId: string | null | undefined;
  platform: PwaPlatform;
  standalone: boolean;
  role?: string | null;
}): Promise<boolean> {
  const state = await queryCameraPermissionState();
  if (state !== "granted") return false;
  markCameraReadyFromIntent(options);
  return true;
}
