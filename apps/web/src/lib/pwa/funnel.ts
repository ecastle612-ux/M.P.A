/**
 * PMX-004 Phase 2 — installation funnel events (secret-free).
 * Emits via existing trackEvent → structured analytics_event logs.
 */

import { trackEvent } from "../observability/analytics";
import type { PwaPlatform } from "./platform";

export const PWA_FUNNEL_EVENTS = {
  landing: "pwa_funnel_landing",
  installPromptViewed: "pwa_funnel_install_prompt_viewed",
  installAccepted: "pwa_funnel_install_accepted",
  installed: "pwa_funnel_installed",
  notificationsGranted: "pwa_funnel_notifications_granted",
  cameraGranted: "pwa_funnel_camera_granted",
  setupCompleted: "pwa_funnel_setup_completed"
} as const;

export type PwaFunnelEventName = (typeof PWA_FUNNEL_EVENTS)[keyof typeof PWA_FUNNEL_EVENTS];

export type PwaFunnelProps = {
  platform: PwaPlatform;
  standalone: boolean;
  role?: string | null;
  organizationId?: string | null;
};

const emittedSession = new Set<string>();

function sessionKey(eventName: string, organizationId: string | null | undefined): string {
  return `${eventName}:${organizationId ?? "none"}`;
}

function baseProps(props: PwaFunnelProps): Record<string, string | number | boolean | null> {
  return {
    platform: props.platform,
    standalone: props.standalone,
    role: props.role ?? null,
    // Org id only (no email/phone/PII).
    organizationId: props.organizationId ?? null
  };
}

/** Fire once per browser session per org (idempotent landing / stage markers). */
export function emitPwaFunnelEvent(
  eventName: PwaFunnelEventName,
  props: PwaFunnelProps,
  options?: { oncePerSession?: boolean }
): void {
  const once = options?.oncePerSession ?? true;
  const key = sessionKey(eventName, props.organizationId);
  if (once && emittedSession.has(key)) return;
  if (once) emittedSession.add(key);
  trackEvent({
    eventName,
    properties: baseProps(props)
  });
}

/** Test helper — clear session dedupe. */
export function resetPwaFunnelSessionForTests(): void {
  emittedSession.clear();
}
