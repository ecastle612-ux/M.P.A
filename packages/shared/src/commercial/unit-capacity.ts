/**
 * Slice 4 — Additional Unit Capacity payment gate (server domain).
 *
 * Operational capacity is granted only after explicit authorization.
 * Stripe quantity changes use next-period semantics (proration_behavior=none).
 * Never trusts client-supplied unit counts, prices, blocks, or Stripe Price IDs.
 */

import type { BillingCycle } from "./plans";
import {
  ADDITIONAL_UNIT_BLOCK_ANNUAL_USD,
  ADDITIONAL_UNIT_BLOCK_MONTHLY_USD,
  UNIT_BLOCK_SIZE,
  additionalUnitBlocks,
  authorizedUnitCapacity,
  baseAnnualUsdForModule,
  baseMonthlyUsdForModule,
  isUnitVolumeModule,
  monthlyUnitVolumePriceUsd,
  type UnitVolumeModule
} from "./unit-volume";
import { COMPLETE_READY, FO_READY } from "./commerce-flags";
import { formatUsdAmount } from "./pricing-display";
import type { ProductSku } from "./skus";

export const UNIT_CAPACITY_STATUSES = [
  "within_capacity",
  "requires_authorization",
  "authorized_pending_period",
  "sync_required"
] as const;

export type UnitCapacityStatus = (typeof UNIT_CAPACITY_STATUSES)[number];

/** Client must not supply commercial capacity fields — server recalculates. */
export const FORBIDDEN_CLIENT_CAPACITY_FIELDS = [
  "managedUnits",
  "managed_units",
  "actualUnits",
  "actual_units",
  "declaredUnits",
  "declared_units",
  "additionalBlocks",
  "additional_blocks",
  "authorizedCapacity",
  "authorized_capacity",
  "authorizedUnitCapacity",
  "requiredBlocks",
  "required_blocks",
  "monthlyAmount",
  "monthly_amount",
  "annualAmount",
  "annual_amount",
  "currentPrice",
  "newPrice",
  "stripePriceId",
  "stripe_price_id",
  "priceId",
  "price_id",
  "line_items",
  "lineItems",
  "trial_eligible",
  "trialEligible",
  "trial_period_days",
  "quantity"
] as const;

export type CapacityAuditEntry = {
  at: string;
  organizationId: string;
  stripeSubscriptionId: string | null;
  previousCapacity: number;
  requestedCapacity: number;
  actualUnits: number;
  previousAdditionalBlocks: number;
  newAdditionalBlocks: number;
  previousRecurringMonthlyUsd: number;
  newRecurringMonthlyUsd: number;
  billingInterval: BillingCycle;
  billingPeriodEnd: string | null;
  quoteId: string | null;
  source: string;
  idempotencyKey?: string;
  eventId?: string;
};

export type UnitCapacitySnapshot = {
  module: UnitVolumeModule;
  billingInterval: BillingCycle;
  declaredUnits: number | null;
  actualUnits: number;
  authorizedCapacity: number;
  additionalBlocks: number;
  requiredBlocks: number;
  requiredCapacity: number;
  pendingAdditionalBlocks: number | null;
  pendingAuthorizedCapacity: number | null;
  currentBillingAmountMonthlyUsd: number;
  nextBillingAmountMonthlyUsd: number;
  additionalCapacityCostMonthlyUsd: number;
  capacityStatus: UnitCapacityStatus;
  effectiveAt: "next_billing_period";
  nextBillingPeriodEnd: string | null;
  trialActive: boolean;
  /** Set when trialing and projected/actual units exceed included 500. */
  trialCapacityNote: string | null;
};

export type CapacityGatePresentation = {
  title: "Additional Unit Capacity Required";
  headline: string;
  supporting: string;
  currentUnits: number;
  currentCapacity: number;
  requiredCapacity: number;
  currentPriceLabel: string;
  newPriceLabel: string;
  additionalCapacityLabel: string;
  effectiveLabel: string;
  ctaLabel: "Authorize Additional Capacity";
  trialNote: string | null;
  snapshot: UnitCapacitySnapshot;
};

export type NextPeriodStripeCapacityAction =
  | {
      kind: "update_quantity";
      subscriptionItemId: string;
      quantity: number;
      prorationBehavior: "none";
    }
  | {
      kind: "create_item";
      priceEnvKey: string;
      quantity: number;
      prorationBehavior: "none";
    }
  | {
      kind: "delete_item";
      subscriptionItemId: string;
      prorationBehavior: "none";
    }
  | {
      kind: "noop";
      reason: string;
    };

function normalizeUnits(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

export function findForbiddenClientCapacityFields(
  body: Record<string, unknown> | null | undefined
): string[] {
  if (!body) return [];
  return FORBIDDEN_CLIENT_CAPACITY_FIELDS.filter((key) => key in body);
}

/** Resolve operational authorized capacity; default = included 500-unit block. */
export function resolveAuthorizedUnitCapacity(input: {
  authorizedUnitCapacity?: number | null;
  authorizedAdditionalBlocks?: number | null;
}): number {
  if (
    input.authorizedUnitCapacity != null &&
    Number.isFinite(input.authorizedUnitCapacity) &&
    input.authorizedUnitCapacity > 0
  ) {
    return Math.floor(input.authorizedUnitCapacity);
  }
  if (
    input.authorizedAdditionalBlocks != null &&
    Number.isFinite(input.authorizedAdditionalBlocks)
  ) {
    return authorizedUnitCapacity(input.authorizedAdditionalBlocks);
  }
  return UNIT_BLOCK_SIZE;
}

export function recurringMonthlyUsd(input: {
  module: UnitVolumeModule;
  additionalBlocks: number;
}): number {
  return (
    baseMonthlyUsdForModule(input.module) +
    ADDITIONAL_UNIT_BLOCK_MONTHLY_USD * Math.max(0, input.additionalBlocks)
  );
}

/** Selected recurring amount for the billing interval (annual base is 20% prepaid). */
export function recurringSelectedUsd(input: {
  module: UnitVolumeModule;
  additionalBlocks: number;
  billingInterval: BillingCycle;
}): number {
  const blocks = Math.max(0, Math.floor(input.additionalBlocks));
  if (input.billingInterval === "annual") {
    return baseAnnualUsdForModule(input.module) + ADDITIONAL_UNIT_BLOCK_ANNUAL_USD * blocks;
  }
  return recurringMonthlyUsd({ module: input.module, additionalBlocks: blocks });
}

export function priceLabelUsd(amountMonthly: number, billingInterval: BillingCycle): string {
  if (billingInterval === "annual") {
    return `${formatUsdAmount(amountMonthly * 12)}/year`;
  }
  return `${formatUsdAmount(amountMonthly)}/month`;
}

export function priceLabelForBlocks(input: {
  module: UnitVolumeModule;
  additionalBlocks: number;
  billingInterval: BillingCycle;
}): string {
  const amount = recurringSelectedUsd(input);
  return input.billingInterval === "annual"
    ? `${formatUsdAmount(amount)}/year`
    : `${formatUsdAmount(amount)}/month`;
}

export function formatAdditionalCapacityCostLabel(
  monthlyUsd: number,
  billingInterval: BillingCycle
): string {
  if (billingInterval === "annual") {
    // Block annual remains monthly × 12 (no 20% discount on Additional Unit Capacity).
    return `+$${Math.max(0, monthlyUsd) * 12}/year`;
  }
  return `+$${monthlyUsd}/month`;
}

export function wouldExceedAuthorizedCapacity(input: {
  actualUnits: number;
  additionalUnits: number;
  authorizedCapacity: number;
}): boolean {
  const projected = normalizeUnits(input.actualUnits) + normalizeUnits(input.additionalUnits);
  return projected > input.authorizedCapacity;
}

export function evaluateUnitCapacityState(input: {
  module?: UnitVolumeModule | ProductSku | null;
  billingInterval?: BillingCycle | null;
  declaredUnits?: number | null;
  actualUnits: number;
  authorizedUnitCapacity?: number | null;
  authorizedAdditionalBlocks?: number | null;
  pendingAdditionalBlocks?: number | null;
  pendingAuthorizedUnitCapacity?: number | null;
  /** When evaluating a create/import, include units about to be added. */
  projectedAdditionalUnits?: number | null;
  nextBillingPeriodEnd?: string | null;
  trialActive?: boolean;
}): UnitCapacitySnapshot {
  const module: UnitVolumeModule =
    input.module && isUnitVolumeModule(input.module)
      ? input.module
      : "mpa_property_manager";
  const billingInterval = input.billingInterval === "annual" ? "annual" : "monthly";
  const actualUnits = normalizeUnits(input.actualUnits);
  const projectedAdditional = normalizeUnits(input.projectedAdditionalUnits);
  const evaluationUnits = actualUnits + projectedAdditional;
  const authorizedCapacity = resolveAuthorizedUnitCapacity({
    ...(input.authorizedUnitCapacity !== undefined
      ? { authorizedUnitCapacity: input.authorizedUnitCapacity }
      : {}),
    ...(input.authorizedAdditionalBlocks !== undefined
      ? { authorizedAdditionalBlocks: input.authorizedAdditionalBlocks }
      : {})
  });
  const additionalBlocks = Math.max(
    0,
    input.authorizedAdditionalBlocks != null && Number.isFinite(input.authorizedAdditionalBlocks)
      ? Math.floor(input.authorizedAdditionalBlocks)
      : Math.max(0, Math.ceil(authorizedCapacity / UNIT_BLOCK_SIZE) - 1)
  );
  const requiredBlocks = additionalUnitBlocks(evaluationUnits);
  const requiredCapacity = authorizedUnitCapacity(requiredBlocks);
  const pendingBlocks =
    input.pendingAdditionalBlocks != null && Number.isFinite(input.pendingAdditionalBlocks)
      ? Math.max(0, Math.floor(input.pendingAdditionalBlocks))
      : null;
  const pendingCapacity =
    input.pendingAuthorizedUnitCapacity != null &&
    Number.isFinite(input.pendingAuthorizedUnitCapacity)
      ? Math.floor(input.pendingAuthorizedUnitCapacity)
      : pendingBlocks != null
        ? authorizedUnitCapacity(pendingBlocks)
        : null;

  const currentBillingAmountMonthlyUsd = recurringMonthlyUsd({ module, additionalBlocks });
  const nextBlocksForBilling =
    evaluationUnits > authorizedCapacity
      ? requiredBlocks
      : pendingBlocks != null
        ? pendingBlocks
        : additionalBlocks;
  const nextBillingAmountMonthlyUsd = recurringMonthlyUsd({
    module,
    additionalBlocks: nextBlocksForBilling
  });
  const additionalCapacityCostMonthlyUsd = Math.max(
    0,
    nextBillingAmountMonthlyUsd - currentBillingAmountMonthlyUsd
  );

  const trialActive = Boolean(input.trialActive);
  let capacityStatus: UnitCapacityStatus;
  if (evaluationUnits > authorizedCapacity) {
    capacityStatus = "requires_authorization";
  } else if (
    pendingBlocks != null &&
    (pendingBlocks !== additionalBlocks ||
      (pendingCapacity != null && pendingCapacity !== authorizedCapacity))
  ) {
    capacityStatus = "authorized_pending_period";
  } else if (actualUnits > 0 && additionalUnitBlocks(actualUnits) < additionalBlocks) {
    // Actual units dropped below billed blocks — schedule decrease (sync).
    capacityStatus = "sync_required";
  } else {
    capacityStatus = "within_capacity";
  }

  const trialCapacityNote =
    trialActive && evaluationUnits > UNIT_BLOCK_SIZE
      ? "You are past the free-trial included capacity (500 units). Authorize Additional Unit Capacity to continue — no surprise charge; the new amount applies next billing period after trial."
      : null;

  return {
    module,
    billingInterval,
    declaredUnits:
      input.declaredUnits != null && Number.isFinite(input.declaredUnits)
        ? Math.floor(input.declaredUnits)
        : null,
    actualUnits,
    authorizedCapacity,
    additionalBlocks,
    requiredBlocks,
    requiredCapacity,
    pendingAdditionalBlocks: pendingBlocks,
    pendingAuthorizedCapacity: pendingCapacity,
    currentBillingAmountMonthlyUsd,
    nextBillingAmountMonthlyUsd,
    additionalCapacityCostMonthlyUsd,
    capacityStatus,
    effectiveAt: "next_billing_period",
    nextBillingPeriodEnd: input.nextBillingPeriodEnd ?? null,
    trialActive,
    trialCapacityNote
  };
}

/**
 * Customer-facing gate copy. `targetUnits` = server-projected units after the blocked action.
 */
export function buildCapacityGatePresentation(
  snapshot: UnitCapacitySnapshot,
  targetUnits?: number
): CapacityGatePresentation {
  const units = normalizeUnits(targetUnits ?? Math.max(snapshot.actualUnits, snapshot.authorizedCapacity + 1));
  const requiredBlocks = additionalUnitBlocks(units);
  const requiredCapacity = authorizedUnitCapacity(requiredBlocks);
  const nextMonthly = recurringMonthlyUsd({
    module: snapshot.module,
    additionalBlocks: requiredBlocks
  });
  const currentMonthly = snapshot.currentBillingAmountMonthlyUsd;
  const delta = Math.max(0, nextMonthly - currentMonthly);
  const enriched: UnitCapacitySnapshot = {
    ...snapshot,
    requiredBlocks,
    requiredCapacity,
    nextBillingAmountMonthlyUsd: nextMonthly,
    additionalCapacityCostMonthlyUsd: delta,
    capacityStatus:
      units > snapshot.authorizedCapacity ? "requires_authorization" : snapshot.capacityStatus,
    trialCapacityNote:
      snapshot.trialActive && units > UNIT_BLOCK_SIZE
        ? "You are past the free-trial included capacity (500 units). Authorize Additional Unit Capacity to continue — no surprise charge; the new amount applies next billing period after trial."
        : snapshot.trialCapacityNote
  };

  return {
    title: "Additional Unit Capacity Required",
    headline: `You're managing ${units} units.`,
    supporting: `Your current plan includes ${snapshot.authorizedCapacity} units. Additional Unit Capacity is required.`,
    currentUnits: units,
    currentCapacity: snapshot.authorizedCapacity,
    requiredCapacity,
    currentPriceLabel: priceLabelForBlocks({
      module: snapshot.module,
      additionalBlocks: snapshot.additionalBlocks,
      billingInterval: snapshot.billingInterval
    }),
    newPriceLabel: priceLabelForBlocks({
      module: snapshot.module,
      additionalBlocks: requiredBlocks,
      billingInterval: snapshot.billingInterval
    }),
    additionalCapacityLabel: formatAdditionalCapacityCostLabel(
      delta,
      snapshot.billingInterval
    ),
    effectiveLabel: "Your new capacity will take effect with your next billing period.",
    ctaLabel: "Authorize Additional Capacity",
    trialNote: enriched.trialCapacityNote,
    snapshot: enriched
  };
}

export function planStripeCapacityAction(input: {
  additionalCapacityItemId: string | null;
  currentBlocks: number;
  nextBlocks: number;
  unitBlockPriceEnvKey: string;
}): NextPeriodStripeCapacityAction {
  const next = Math.max(0, Math.floor(input.nextBlocks));
  const current = Math.max(0, Math.floor(input.currentBlocks));
  if (
    next === current &&
    (next === 0 ? !input.additionalCapacityItemId : Boolean(input.additionalCapacityItemId))
  ) {
    return { kind: "noop", reason: "already_at_target" };
  }
  if (next === 0) {
    if (!input.additionalCapacityItemId) {
      return { kind: "noop", reason: "no_capacity_item" };
    }
    return {
      kind: "delete_item",
      subscriptionItemId: input.additionalCapacityItemId,
      prorationBehavior: "none"
    };
  }
  if (!input.additionalCapacityItemId) {
    return {
      kind: "create_item",
      priceEnvKey: input.unitBlockPriceEnvKey,
      quantity: next,
      prorationBehavior: "none"
    };
  }
  return {
    kind: "update_quantity",
    subscriptionItemId: input.additionalCapacityItemId,
    quantity: next,
    prorationBehavior: "none"
  };
}

export function isCapacityModuleSelfServe(module: UnitVolumeModule): boolean {
  if (module === "mpa_property_manager") return true;
  if (module === "mpa_facility_operations") return FO_READY;
  return module === "mpa_complete_platform" && COMPLETE_READY;
}

export function targetUnitsFromActualAndDelta(
  actualUnits: number,
  additionalUnits: number
): number {
  return normalizeUnits(actualUnits) + normalizeUnits(additionalUnits);
}

export {
  UNIT_BLOCK_SIZE,
  ADDITIONAL_UNIT_BLOCK_MONTHLY_USD,
  additionalUnitBlocks,
  authorizedUnitCapacity,
  monthlyUnitVolumePriceUsd
};
