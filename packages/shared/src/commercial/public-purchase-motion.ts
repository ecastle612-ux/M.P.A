import { FO_READY } from "./commerce-flags";
import type { ProductSku } from "./skus";

/**
 * Public commercial purchase motion for Option B pricing transparency.
 * Display prices for all three products; Checkout remains FO_READY-gated.
 */
export type PublicPurchaseMotion =
  | {
      kind: "self_serve";
      ctaLabel: string;
      availabilityLabel: string;
      explanation: string;
    }
  | {
      kind: "early_access";
      ctaLabel: string;
      availabilityLabel: string;
      explanation: string;
    }
  | {
      kind: "consultation";
      ctaLabel: string;
      availabilityLabel: string;
      explanation: string;
    };

export function publicPurchaseMotionForSku(sku: ProductSku): PublicPurchaseMotion {
  if (sku === "mpa_property_manager") {
    return {
      kind: "self_serve",
      ctaLabel: "Confirm Property Manager",
      availabilityLabel: "Available online today",
      explanation:
        "Property Manager supports self-service Stripe Checkout with live Monthly and Annual Prices."
    };
  }

  if (sku === "mpa_facility_operations") {
    return {
      kind: "early_access",
      ctaLabel: "Request Early Access",
      availabilityLabel: FO_READY ? "Self-service checkout" : "Early access · not online yet",
      explanation: FO_READY
        ? "Facility Operations self-service checkout is available."
        : "Self-service purchasing will be available after FO_READY certification. Request Early Access to talk with our team."
    };
  }

  return {
    kind: "consultation",
    ctaLabel: "Request Consultation",
    availabilityLabel: FO_READY ? "Self-service checkout" : "Consultation · not online yet",
    explanation: FO_READY
      ? "Complete Platform self-service checkout is available."
      : "Online purchasing will become available after Facility Operations reaches production readiness. Request a consultation for Complete Platform today."
  };
}
