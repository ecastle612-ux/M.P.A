/** COM-002 plan tiers and billing cycles (Slice A). */

export const PLAN_TIERS = ["professional", "business", "enterprise"] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export const SELF_SERVE_PLAN_TIERS = ["professional", "business"] as const;
export type SelfServePlanTier = (typeof SELF_SERVE_PLAN_TIERS)[number];

export const BILLING_CYCLES = ["monthly", "annual"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export function isPlanTier(value: unknown): value is PlanTier {
  return typeof value === "string" && (PLAN_TIERS as readonly string[]).includes(value);
}

export function isSelfServePlanTier(value: unknown): value is SelfServePlanTier {
  return typeof value === "string" && (SELF_SERVE_PLAN_TIERS as readonly string[]).includes(value);
}

export function isBillingCycle(value: unknown): value is BillingCycle {
  return typeof value === "string" && (BILLING_CYCLES as readonly string[]).includes(value);
}

export function toPlanTierLabel(tier: PlanTier): string {
  switch (tier) {
    case "professional":
      return "Professional";
    case "business":
      return "Business";
    case "enterprise":
      return "Enterprise";
    default:
      return "Unknown";
  }
}

export function toBillingCycleLabel(cycle: BillingCycle): string {
  return cycle === "monthly" ? "Monthly" : "Annual";
}

/** Binding seat limits (COM-002 A7). Enterprise is custom (null = contract). */
export const SEAT_LIMITS: Record<PlanTier, number | null> = {
  professional: 5,
  business: 25,
  enterprise: null
};

/** Binding property limits (COM-002 A7). */
export const PROPERTY_LIMITS: Record<PlanTier, number | null> = {
  professional: 25,
  business: 150,
  enterprise: null
};
