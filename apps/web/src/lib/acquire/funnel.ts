/**
 * ACQ-001 Slice C — acquisition funnel analytics (secret-free).
 * Emits via existing trackEvent → structured analytics_event logs.
 * SoT: docs/115-acq-001-self-service-customer-acquisition/12-analytics.md
 */

import { trackEvent } from "../observability/analytics";

export const ACQ_FUNNEL_EVENTS = {
  landingViewed: "acq.landing_viewed",
  overviewViewed: "acq.overview_viewed",
  modulesViewed: "acq.modules_viewed",
  tourStarted: "acq.tour_started",
  tourStep: "acq.tour_step",
  tourCompleted: "acq.tour_completed",
  tourSkipped: "acq.tour_skipped",
  pricingViewed: "acq.pricing_viewed",
  moduleSelected: "acq.module_selected",
  planSelected: "acq.plan_selected",
  checkoutStarted: "acq.checkout_started",
  checkoutCanceled: "acq.checkout_canceled",
  checkoutSuccessReturned: "acq.checkout_success_returned",
  provisionReady: "acq.provision_ready",
  provisionDelayed: "acq.provision_delayed",
  provisionFailed: "acq.provision_failed",
  contactSalesSubmitted: "acq.contact_sales_submitted",
  loginFromSuccess: "acq.login_from_success",
  guidedSetupStarted: "acq.guided_setup_started",
  guidedSetupCompleted: "acq.guided_setup_completed"
} as const;

export type AcqFunnelEventName = (typeof ACQ_FUNNEL_EVENTS)[keyof typeof ACQ_FUNNEL_EVENTS];

export type AcqFunnelProps = Record<string, string | number | boolean | null | undefined>;

const emittedSession = new Set<string>();

function sessionKey(eventName: string, dedupeKey?: string | null): string {
  return `${eventName}:${dedupeKey ?? "once"}`;
}

/** Strip accidental PII keys — never emit email, name, company, or card data. */
export function sanitizeAcqFunnelProps(props: AcqFunnelProps = {}): Record<string, string | number | boolean | null> {
  const blocked = new Set([
    "email",
    "workEmail",
    "work_email",
    "contactEmail",
    "name",
    "company",
    "companyName",
    "password",
    "card",
    "phone"
  ]);
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(props)) {
    if (blocked.has(key)) continue;
    if (value === undefined) continue;
    out[key] = value;
  }
  return out;
}

export function emitAcqFunnelEvent(
  eventName: AcqFunnelEventName,
  props: AcqFunnelProps = {},
  options?: { oncePerSession?: boolean; dedupeKey?: string | null }
): void {
  const once = options?.oncePerSession ?? false;
  const key = sessionKey(eventName, options?.dedupeKey ?? null);
  if (once && emittedSession.has(key)) return;
  if (once) emittedSession.add(key);
  trackEvent({
    eventName,
    properties: sanitizeAcqFunnelProps(props)
  });
}

export function resetAcqFunnelSessionForTests(): void {
  emittedSession.clear();
}

/** Coarse portfolio band for Contact Sales (no free-text size). */
export function portfolioBandFromInput(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "unspecified";
  const n = Number.parseInt(digits, 10);
  if (!Number.isFinite(n)) return "unspecified";
  if (n < 10) return "1_9";
  if (n < 50) return "10_49";
  if (n < 200) return "50_199";
  return "200_plus";
}
