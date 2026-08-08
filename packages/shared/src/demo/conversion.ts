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
 * Carries selected product via `intent` (Slice A acquisition).
 */
export function demoConversionHref(
  product: DemoProductId,
  cta: DemoConversionCta,
  demoSessionId?: string
): string {
  if (cta === "schedule_consultation" || cta === "request_enterprise") {
    return withDemoAttribution(acquisitionHref("enterprise", product), demoSessionId);
  }

  return withDemoAttribution(
    acquisitionHref("checkout", {
      sku: product,
      planTier: "professional",
      billingCycle: "monthly"
    }),
    demoSessionId
  );
}

export function demoConversionLabel(_product: DemoProductId, cta: DemoConversionCta): string {
  if (cta === "schedule_consultation") {
    return "Schedule Consultation";
  }
  if (cta === "request_enterprise") {
    return "Enterprise Solutions";
  }
  return "Start Subscription";
}

export function primaryDemoConversionCta(_product: DemoProductId): DemoConversionCta {
  return "start_subscription";
}
