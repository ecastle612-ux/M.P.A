import { acquisitionHref } from "../commercial/acquisition";
import type { DemoProductId } from "./products";

export type DemoConversionCta = "start_subscription" | "request_enterprise" | "schedule_consultation";

function withDemoAttribution(href: string, demoSessionId?: string): string {
  if (!demoSessionId) {
    return href;
  }
  const join = href.includes("?") ? "&" : "?";
  return `${href}${join}demo_session_id=${encodeURIComponent(demoSessionId)}`;
}

/**
 * Premium conversion path from Live Demo → commercial funnel.
 * Primary path is Get Started → questionnaire (authoritative acquisition).
 * Carries selected product via `intent` when supported.
 */
export function demoConversionHref(
  product: DemoProductId,
  cta: DemoConversionCta,
  demoSessionId?: string
): string {
  if (cta === "schedule_consultation" || cta === "request_enterprise") {
    return withDemoAttribution(acquisitionHref("enterprise", product), demoSessionId);
  }

  // Authoritative funnel: /get-started → questionnaire → quote → Confirm Plan → Checkout.
  // Do not bypass into /checkout from Live Demo.
  return withDemoAttribution(
    acquisitionHref("questionnaire", {
      sku: product,
      billingCycle: "monthly"
    }),
    demoSessionId
  );
}

export function demoConversionLabel(product: DemoProductId, cta: DemoConversionCta): string {
  void product;
  if (cta === "schedule_consultation") {
    return "Schedule Consultation";
  }
  if (cta === "request_enterprise") {
    return "Enterprise Solutions";
  }
  return "Get Started";
}

export function primaryDemoConversionCta(product: DemoProductId): DemoConversionCta {
  void product;
  return "start_subscription";
}
