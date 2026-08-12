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
 * Live Demo → acquisition.
 * Primary path is Get Started (/get-started), not checkout or /modules.
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

/** Landing differentiation anchor — separate from Get Started. */
export function demoComparePlatformsHref(): string {
  return "/#differentiation";
}
