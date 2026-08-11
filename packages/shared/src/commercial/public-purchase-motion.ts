import { COMPLETE_READY, FO_READY } from "./commerce-flags";
import type { ProductSku } from "./skus";

/**
 * Public commercial purchase motion.
 * All three products are self-serve when FO_READY / COMPLETE_READY are true.
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
      ctaLabel: "Get started with Property Manager",
      availabilityLabel: "Available",
      explanation:
        "$59/month includes up to 500 managed units. Additional Unit Capacity is +$39/month or +$468/year per additional 500 units. Annual = monthly × 12."
    };
  }

  if (sku === "mpa_facility_operations") {
    if (FO_READY) {
      return {
        kind: "self_serve",
        ctaLabel: "Get started with Facility Operations",
        availabilityLabel: "Available",
        explanation:
          "$59/month or $590/year includes up to 500 managed units. Additional Unit Capacity is +$39/month or +$468/year per additional 500 units."
      };
    }
    return {
      kind: "early_access",
      ctaLabel: "Request Early Access",
      availabilityLabel: "Not online · gated",
      explanation:
        "Facility Operations is not available for online purchase yet ($59/month or $590/year when online). Request Early Access to talk with our team."
    };
  }

  if (COMPLETE_READY) {
    return {
      kind: "self_serve",
      ctaLabel: "Get started with Complete Platform",
      availabilityLabel: "Available",
      explanation:
        "$109/month or $1,308/year includes up to 500 managed units. Additional Unit Capacity is +$39/month or +$468/year per additional 500 units. Annual = monthly × 12."
    };
  }

  return {
    kind: "consultation",
    ctaLabel: "Request Consultation",
    availabilityLabel: "Not online · gated",
    explanation:
      "Complete Platform is not available for online purchase yet. When online, pricing follows unit-volume ($109/month base + Additional Unit Capacity). Request a consultation today."
  };
}
