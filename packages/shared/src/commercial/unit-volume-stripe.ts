/**
 * Slice 3 — Stripe unit-volume Checkout / subscription architecture (code only).
 *
 * Does NOT create Stripe Prices, Products, or live subscriptions.
 * Price IDs are resolved from optional env vars (never hard-coded).
 */

import type { BillingCycle } from "./plans";
import type { ProductSku } from "./skus";
import {
  UNIT_BLOCK_SIZE,
  UNIT_VOLUME_TRIAL_DAYS,
  authorizedUnitCapacity,
  isUnitVolumeModule,
  type UnitVolumeModule
} from "./unit-volume";
import type { CommercialQuote } from "./acquisition-quote";
import {
  COMMERCIAL_QUOTE_TTL_MS,
  FORBIDDEN_CLIENT_QUOTE_FIELDS,
  findForbiddenClientQuoteFields,
  isCommercialQuoteExpired
} from "./acquisition-quote";
import { COMPLETE_READY, FO_READY } from "./commerce-flags";
import { SAAS_MONEY_DOMAIN, SAAS_METADATA_KEYS } from "./saas-checkout";
import { isSupersededCheckoutStripePriceId } from "./superseded-stripe-prices";

/** Commercial model stamp for Stripe metadata reconciliation. */
export const COMMERCIAL_MODEL_VERSION = "unit_volume_v1" as const;

/**
 * Stripe Price env var names (do not create Prices or set Production env in this task).
 *
 * Registry:
 * - PM_BASE_MONTHLY  → STRIPE_PRICE_PM_BASE_MONTHLY
 * - PM_BASE_ANNUAL   → STRIPE_PRICE_PM_BASE_ANNUAL
 * - FO_BASE_MONTHLY  → STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY (existing FO Prices)
 * - FO_BASE_ANNUAL   → STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL
 * - COMPLETE_BASE_MONTHLY → STRIPE_PRICE_COMPLETE_BASE_MONTHLY
 * - COMPLETE_BASE_ANNUAL  → STRIPE_PRICE_COMPLETE_BASE_ANNUAL
 * - UNIT_BLOCK_MONTHLY → STRIPE_PRICE_UNIT_BLOCK_MONTHLY (shared)
 * - UNIT_BLOCK_ANNUAL  → STRIPE_PRICE_UNIT_BLOCK_ANNUAL (shared)
 */
export const UNIT_VOLUME_PRICE_ENV_KEYS = {
  PM_BASE_MONTHLY: "STRIPE_PRICE_PM_BASE_MONTHLY",
  PM_BASE_ANNUAL: "STRIPE_PRICE_PM_BASE_ANNUAL",
  FO_BASE_MONTHLY: "STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY",
  FO_BASE_ANNUAL: "STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL",
  COMPLETE_BASE_MONTHLY: "STRIPE_PRICE_COMPLETE_BASE_MONTHLY",
  COMPLETE_BASE_ANNUAL: "STRIPE_PRICE_COMPLETE_BASE_ANNUAL",
  UNIT_BLOCK_MONTHLY: "STRIPE_PRICE_UNIT_BLOCK_MONTHLY",
  UNIT_BLOCK_ANNUAL: "STRIPE_PRICE_UNIT_BLOCK_ANNUAL"
} as const;

export type UnitVolumePriceRegistryKey = keyof typeof UNIT_VOLUME_PRICE_ENV_KEYS;

export const UNIT_VOLUME_METADATA_KEYS = {
  ...SAAS_METADATA_KEYS,
  quoteId: "mpa_quote_id",
  snapshotId: "mpa_snapshot_id",
  managedUnits: "mpa_managed_units",
  includedUnits: "mpa_included_units",
  additionalBlocks: "mpa_additional_blocks",
  authorizedCapacity: "mpa_authorized_unit_capacity",
  trialEligible: "mpa_trial_eligible",
  trialDays: "mpa_trial_days",
  commercialModelVersion: "mpa_commercial_model_version",
  organizationId: "mpa_organization_id"
} as const;

export type CheckoutLineItemPlan = {
  role: "base" | "additional_unit_capacity";
  priceEnvKey: string;
  quantity: number;
};

export type UnitVolumeCheckoutPlan = {
  module: UnitVolumeModule;
  billingInterval: BillingCycle;
  managedUnits: number;
  includedUnits: number;
  additionalBlocks: number;
  authorizedCapacity: number;
  trialEligible: boolean;
  trialPeriodDays: number | null;
  paymentMethodCollection: "always";
  lineItems: CheckoutLineItemPlan[];
  metadata: Record<string, string>;
  quoteId: string;
  commercialModelVersion: typeof COMMERCIAL_MODEL_VERSION;
  /** False only when a module is intentionally not yet Owner-authorized for self-serve. */
  selfServeAllowed: boolean;
};

export type ResolvePriceId = (envKey: string) => string | null;

export function basePriceEnvKeyForModule(
  module: UnitVolumeModule,
  billingInterval: BillingCycle
): string {
  if (module === "mpa_complete_platform") {
    return billingInterval === "annual"
      ? UNIT_VOLUME_PRICE_ENV_KEYS.COMPLETE_BASE_ANNUAL
      : UNIT_VOLUME_PRICE_ENV_KEYS.COMPLETE_BASE_MONTHLY;
  }
  if (module === "mpa_facility_operations") {
    return billingInterval === "annual"
      ? UNIT_VOLUME_PRICE_ENV_KEYS.FO_BASE_ANNUAL
      : UNIT_VOLUME_PRICE_ENV_KEYS.FO_BASE_MONTHLY;
  }
  return billingInterval === "annual"
    ? UNIT_VOLUME_PRICE_ENV_KEYS.PM_BASE_ANNUAL
    : UNIT_VOLUME_PRICE_ENV_KEYS.PM_BASE_MONTHLY;
}

export function unitBlockPriceEnvKey(billingInterval: BillingCycle): string {
  return billingInterval === "annual"
    ? UNIT_VOLUME_PRICE_ENV_KEYS.UNIT_BLOCK_ANNUAL
    : UNIT_VOLUME_PRICE_ENV_KEYS.UNIT_BLOCK_MONTHLY;
}

/**
 * Build Stripe line-item plan from a server quote.
 * Never emits quantity 0. Omits Additional Unit Capacity when blocks = 0.
 */
export function buildCheckoutLineItemPlan(input: {
  module: UnitVolumeModule;
  billingInterval: BillingCycle;
  additionalBlocks: number;
}): CheckoutLineItemPlan[] {
  const blocks = Math.max(0, Math.floor(input.additionalBlocks));
  const items: CheckoutLineItemPlan[] = [
    {
      role: "base",
      priceEnvKey: basePriceEnvKeyForModule(input.module, input.billingInterval),
      quantity: 1
    }
  ];
  if (blocks > 0) {
    items.push({
      role: "additional_unit_capacity",
      priceEnvKey: unitBlockPriceEnvKey(input.billingInterval),
      quantity: blocks
    });
  }
  return items;
}

export function buildUnitVolumeCheckoutMetadata(input: {
  quote: CommercialQuote;
  organizationId?: string | null;
  demoSessionId?: string | null;
}): Record<string, string> {
  const meta: Record<string, string> = {
    [UNIT_VOLUME_METADATA_KEYS.moneyDomain]: SAAS_MONEY_DOMAIN,
    [UNIT_VOLUME_METADATA_KEYS.productSku]: input.quote.module,
    [UNIT_VOLUME_METADATA_KEYS.planTier]: "professional",
    [UNIT_VOLUME_METADATA_KEYS.billingCycle]: input.quote.billing_interval,
    [UNIT_VOLUME_METADATA_KEYS.catalogOfferId]: `${input.quote.module}__unit_volume__${input.quote.billing_interval}`,
    [UNIT_VOLUME_METADATA_KEYS.quoteId]: input.quote.quote_id,
    [UNIT_VOLUME_METADATA_KEYS.managedUnits]: String(input.quote.managed_units),
    [UNIT_VOLUME_METADATA_KEYS.includedUnits]: String(input.quote.included_units),
    [UNIT_VOLUME_METADATA_KEYS.additionalBlocks]: String(input.quote.additional_blocks),
    [UNIT_VOLUME_METADATA_KEYS.authorizedCapacity]: String(
      authorizedUnitCapacity(input.quote.additional_blocks)
    ),
    [UNIT_VOLUME_METADATA_KEYS.trialEligible]: input.quote.trial_eligible ? "true" : "false",
    [UNIT_VOLUME_METADATA_KEYS.trialDays]: String(input.quote.trial_days),
    [UNIT_VOLUME_METADATA_KEYS.commercialModelVersion]: COMMERCIAL_MODEL_VERSION
  };
  if (input.organizationId) {
    meta[UNIT_VOLUME_METADATA_KEYS.organizationId] = input.organizationId;
  }
  if (input.demoSessionId) {
    meta[UNIT_VOLUME_METADATA_KEYS.demoSessionId] = input.demoSessionId;
  }
  return meta;
}

export function buildUnitVolumeCheckoutPlan(quote: CommercialQuote): UnitVolumeCheckoutPlan | null {
  if (!isUnitVolumeModule(quote.module)) {
    return null;
  }
  const selfServeAllowed =
    quote.module === "mpa_property_manager" ||
    (quote.module === "mpa_facility_operations" && FO_READY) ||
    (quote.module === "mpa_complete_platform" && COMPLETE_READY);

  const trialEligible = quote.managed_units <= UNIT_BLOCK_SIZE && quote.trial_eligible;
  const trialPeriodDays = trialEligible ? UNIT_VOLUME_TRIAL_DAYS : null;

  return {
    module: quote.module,
    billingInterval: quote.billing_interval,
    managedUnits: quote.managed_units,
    includedUnits: quote.included_units,
    additionalBlocks: quote.additional_blocks,
    authorizedCapacity: authorizedUnitCapacity(quote.additional_blocks),
    trialEligible,
    trialPeriodDays,
    paymentMethodCollection: "always",
    lineItems: buildCheckoutLineItemPlan({
      module: quote.module,
      billingInterval: quote.billing_interval,
      additionalBlocks: quote.additional_blocks
    }),
    metadata: buildUnitVolumeCheckoutMetadata({ quote }),
    quoteId: quote.quote_id,
    commercialModelVersion: COMMERCIAL_MODEL_VERSION,
    selfServeAllowed
  };
}

export function resolveCheckoutLineItems(
  plan: UnitVolumeCheckoutPlan,
  resolvePriceId: ResolvePriceId
):
  | { ok: true; items: Array<{ price: string; quantity: number; role: CheckoutLineItemPlan["role"] }> }
  | {
      ok: false;
      reason: "price_unconfigured" | "superseded_price_blocked";
      missingEnvKey: string;
      priceId?: string;
    } {
  const items: Array<{ price: string; quantity: number; role: CheckoutLineItemPlan["role"] }> = [];
  for (const line of plan.lineItems) {
    if (line.quantity <= 0) {
      continue;
    }
    const price = resolvePriceId(line.priceEnvKey);
    if (!price) {
      return { ok: false, reason: "price_unconfigured", missingEnvKey: line.priceEnvKey };
    }
    if (isSupersededCheckoutStripePriceId(price)) {
      return {
        ok: false,
        reason: "superseded_price_blocked",
        missingEnvKey: line.priceEnvKey,
        priceId: price
      };
    }
    items.push({ price, quantity: line.quantity, role: line.role });
  }
  if (items.length === 0 || items[0]?.role !== "base") {
    return {
      ok: false,
      reason: "price_unconfigured",
      missingEnvKey: basePriceEnvKeyForModule(plan.module, plan.billingInterval)
    };
  }
  return { ok: true, items };
}

export type QuoteCheckoutValidation =
  | { ok: true; plan: UnitVolumeCheckoutPlan; quote: CommercialQuote }
  | {
      ok: false;
      reason:
        | "client_tamper_fields"
        | "quote_missing"
        | "quote_expired"
        | "module_mismatch"
        | "units_mismatch"
        | "billing_interval_mismatch"
        | "invalid_trial_state"
        | "module_gated"
        | "not_unit_volume_module"
        | "price_unconfigured"
        | "superseded_price_blocked";
      detail?: string;
    };

/**
 * Validate a stored quote before Checkout Session creation.
 * Client must only supply quoteId (+ optional email); never prices/amounts/trial.
 */
export function validateQuoteForCheckout(input: {
  quote: CommercialQuote | null | undefined;
  expectedModule?: ProductSku | null;
  expectedManagedUnits?: number | null;
  expectedBillingInterval?: BillingCycle | null;
  clientBody?: Record<string, unknown> | null;
  now?: Date;
  resolvePriceId?: ResolvePriceId;
}): QuoteCheckoutValidation {
  const forbidden = findForbiddenClientQuoteFields(input.clientBody);
  if (forbidden.length > 0) {
    return {
      ok: false,
      reason: "client_tamper_fields",
      detail: forbidden.join(",")
    };
  }
  // Extra Stripe-specific injections
  if (input.clientBody) {
    for (const key of ["line_items", "lineItems", "subscription_data", "trial_period_days"]) {
      if (key in input.clientBody) {
        return { ok: false, reason: "client_tamper_fields", detail: key };
      }
    }
  }

  const quote = input.quote;
  if (!quote) {
    return { ok: false, reason: "quote_missing" };
  }
  if (isCommercialQuoteExpired(quote, input.now ?? new Date())) {
    return { ok: false, reason: "quote_expired" };
  }
  if (!isUnitVolumeModule(quote.module)) {
    return { ok: false, reason: "not_unit_volume_module" };
  }
  if (input.expectedModule && input.expectedModule !== quote.module) {
    return { ok: false, reason: "module_mismatch" };
  }
  if (
    input.expectedManagedUnits != null &&
    input.expectedManagedUnits !== quote.managed_units
  ) {
    return { ok: false, reason: "units_mismatch" };
  }
  if (
    input.expectedBillingInterval &&
    input.expectedBillingInterval !== quote.billing_interval
  ) {
    return { ok: false, reason: "billing_interval_mismatch" };
  }

  const expectedTrial = quote.managed_units <= UNIT_BLOCK_SIZE;
  if (quote.trial_eligible !== expectedTrial) {
    return { ok: false, reason: "invalid_trial_state" };
  }
  if (expectedTrial && quote.trial_days !== UNIT_VOLUME_TRIAL_DAYS) {
    return { ok: false, reason: "invalid_trial_state" };
  }
  if (!expectedTrial && quote.trial_days !== 0) {
    return { ok: false, reason: "invalid_trial_state" };
  }

  const plan = buildUnitVolumeCheckoutPlan(quote);
  if (!plan) {
    return { ok: false, reason: "not_unit_volume_module" };
  }
  if (!plan.selfServeAllowed) {
    return { ok: false, reason: "module_gated" };
  }

  if (input.resolvePriceId) {
    const resolved = resolveCheckoutLineItems(plan, input.resolvePriceId);
    if (!resolved.ok) {
      return {
        ok: false,
        reason: resolved.reason,
        detail:
          resolved.reason === "superseded_price_blocked"
            ? resolved.priceId ?? resolved.missingEnvKey
            : resolved.missingEnvKey
      };
    }
  }

  return { ok: true, plan, quote };
}

/**
 * Slice 4 preparation — next-period Additional Unit Capacity quantity update.
 * Does not call Stripe. Documents the intended update shape.
 */
export type NextPeriodCapacityUpdatePlan = {
  stripeSubscriptionId: string;
  additionalCapacityItemId: string | null;
  currentAdditionalBlocks: number;
  nextAdditionalBlocks: number;
  /** Stripe subscriptionItems.update with proration_behavior=none at period boundary. */
  prorationBehavior: "none";
  applyAt: "next_billing_period";
  omitItemWhenZero: true;
  notes: string;
};

export function planNextPeriodCapacityUpdate(input: {
  stripeSubscriptionId: string;
  additionalCapacityItemId: string | null;
  currentAdditionalBlocks: number;
  nextManagedUnits: number;
}): NextPeriodCapacityUpdatePlan {
  const nextAdditionalBlocks = Math.max(
    0,
    Math.ceil(Math.max(0, input.nextManagedUnits) / UNIT_BLOCK_SIZE) - 1
  );
  return {
    stripeSubscriptionId: input.stripeSubscriptionId,
    additionalCapacityItemId: input.additionalCapacityItemId,
    currentAdditionalBlocks: Math.max(0, input.currentAdditionalBlocks),
    nextAdditionalBlocks,
    prorationBehavior: "none",
    applyAt: "next_billing_period",
    omitItemWhenZero: true,
    notes:
      "Slice 4: authorize capacity gate → persist pending blocks → grant operational capacity now → update Stripe item quantity for next period with proration_behavior=none. Never quantity 0 — delete/omit item when blocks become 0."
  };
}

export function unitVolumeCheckoutReadyEnvKeys(): string[] {
  return [
    UNIT_VOLUME_PRICE_ENV_KEYS.PM_BASE_MONTHLY,
    UNIT_VOLUME_PRICE_ENV_KEYS.PM_BASE_ANNUAL,
    UNIT_VOLUME_PRICE_ENV_KEYS.UNIT_BLOCK_MONTHLY,
    UNIT_VOLUME_PRICE_ENV_KEYS.UNIT_BLOCK_ANNUAL
  ];
}

export { COMMERCIAL_QUOTE_TTL_MS, FORBIDDEN_CLIENT_QUOTE_FIELDS };
