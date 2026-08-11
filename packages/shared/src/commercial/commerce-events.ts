/**
 * Commercial / audit / analytics event names (COM-002 Slice A).
 * Emitters in later slices should reuse these constants — no string drift.
 */

export const COMMERCE_ANALYTICS_EVENTS = {
  landing_viewed: "commerce.landing_viewed",
  questionnaire_viewed: "commerce.questionnaire_viewed",
  questionnaire_submitted: "commerce.questionnaire_submitted",
  modules_viewed: "commerce.modules_viewed",
  product_selected: "commerce.product_selected",
  pricing_viewed: "commerce.pricing_viewed",
  plan_selected: "commerce.plan_selected",
  cycle_selected: "commerce.cycle_selected",
  confirm_plan_viewed: "commerce.confirm_plan_viewed",
  confirm_plan_continued: "commerce.confirm_plan_continued",
  enterprise_redirected: "commerce.enterprise_redirected",
  enterprise_request_viewed: "commerce.enterprise_request_viewed",
  enterprise_request_submitted: "commerce.enterprise_request_submitted",
  self_serve_blocked_fo: "commerce.self_serve_blocked_fo"
} as const;

export const COMMERCE_AUDIT_EVENTS = {
  offer_resolved: "commerce.audit.offer_resolved",
  offer_rejected_not_self_serve: "commerce.audit.offer_rejected_not_self_serve",
  funnel_transition: "commerce.audit.funnel_transition",
  catalog_inspected: "commerce.audit.catalog_inspected",
  quote_created: "commerce.audit.quote_created",
  quote_rejected_tamper: "commerce.audit.quote_rejected_tamper",
  quote_expired: "commerce.audit.quote_expired",
  acquisition_snapshot_created: "commerce.audit.acquisition_snapshot_created"
} as const;

export type CommerceAnalyticsEvent =
  (typeof COMMERCE_ANALYTICS_EVENTS)[keyof typeof COMMERCE_ANALYTICS_EVENTS];

export type CommerceAuditEvent =
  (typeof COMMERCE_AUDIT_EVENTS)[keyof typeof COMMERCE_AUDIT_EVENTS];

export type CommerceEventPayload = {
  event: CommerceAnalyticsEvent | CommerceAuditEvent;
  productSku?: string;
  planTier?: string;
  billingCycle?: string | null;
  offerId?: string;
  fromState?: string;
  toState?: string;
  at: string;
};

export function createCommerceEvent(
  event: CommerceEventPayload["event"],
  fields: Omit<CommerceEventPayload, "event" | "at"> = {}
): CommerceEventPayload {
  return {
    event,
    ...fields,
    at: new Date().toISOString()
  };
}
