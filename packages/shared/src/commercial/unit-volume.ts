/**
 * Authoritative managed-unit commercial capacity + pricing (server domain).
 *
 * Billing metric: count of public.property_units (all statuses).
 * Multiple residents/tenants in one unit = one billable unit.
 */

import type { ProductSku } from "./skus";

/** Included managed units in the module base price. */
export const UNIT_BLOCK_SIZE = 500 as const;

/** Additional Unit Capacity price per 500-unit block (USD). */
export const ADDITIONAL_UNIT_BLOCK_MONTHLY_USD = 39 as const;

/** Property Manager base monthly (includes first 500 units). */
export const PM_BASE_MONTHLY_USD = 59 as const;

/** Complete Platform base monthly (includes first 500 units). */
export const COMPLETE_BASE_MONTHLY_USD = 109 as const;

/**
 * Annual prepaid discount on the product base Price only.
 * Annual base = monthly × 12 × 0.80. Additional Unit Capacity is not discounted.
 */
export const ANNUAL_PREPAID_MULTIPLIER = 0.8 as const;
export const ANNUAL_SAVINGS_PERCENT = 20 as const;

/** Stripe `unit_amount` (cents) for annual base Prices — source of truth for quotes. */
export const PM_BASE_ANNUAL_CENTS = 56640 as const;
export const FO_ANNUAL_CENTS = 56640 as const;
export const COMPLETE_BASE_ANNUAL_CENTS = 104640 as const;

export function usdFromCents(cents: number): number {
  return Math.round(cents) / 100;
}

export const PM_BASE_ANNUAL_USD = usdFromCents(PM_BASE_ANNUAL_CENTS);
export const COMPLETE_BASE_ANNUAL_USD = usdFromCents(COMPLETE_BASE_ANNUAL_CENTS);

/**
 * Facility Operations base prices.
 * Monthly matches PM ($59). Annual base matches the 20% prepaid Price ($566.40).
 */
export const FO_MONTHLY_USD = 59 as const;
export const FO_ANNUAL_USD = usdFromCents(FO_ANNUAL_CENTS);

/** Additional Unit Capacity annual = monthly × 12 (no discount on blocks). */
export const ADDITIONAL_UNIT_BLOCK_ANNUAL_USD = ADDITIONAL_UNIT_BLOCK_MONTHLY_USD * 12;
export const ADDITIONAL_UNIT_BLOCK_ANNUAL_CENTS = ADDITIONAL_UNIT_BLOCK_ANNUAL_USD * 100;

/** Trial length for Checkout wiring (days). */
export const UNIT_VOLUME_TRIAL_DAYS = 30 as const;

export type UnitVolumeModule =
  | "mpa_property_manager"
  | "mpa_facility_operations"
  | "mpa_complete_platform";

export type UnitVolumeQuote = {
  managedUnits: number;
  includedUnits: typeof UNIT_BLOCK_SIZE;
  additionalBlocks: number;
  authorizedUnitCapacity: number;
  monthlyPriceUsd: number;
  annualPriceUsd: number;
  trialEligible: boolean;
  trialDays: typeof UNIT_VOLUME_TRIAL_DAYS;
  module: UnitVolumeModule;
  baseMonthlyUsd: number;
  baseAnnualUsd: number;
  additionalBlockMonthlyUsd: typeof ADDITIONAL_UNIT_BLOCK_MONTHLY_USD;
};

function normalizeManagedUnits(managedUnits: number): number {
  if (!Number.isFinite(managedUnits) || managedUnits < 0) {
    return 0;
  }
  return Math.floor(managedUnits);
}

/**
 * Number of Additional Unit Capacity blocks beyond the included 500.
 * 0–500 → 0; 501–1000 → 1; 1001–1500 → 2; …
 */
export function additionalUnitBlocks(managedUnits: number): number {
  const units = normalizeManagedUnits(managedUnits);
  if (units <= 0) {
    return 0;
  }
  return Math.max(0, Math.ceil(units / UNIT_BLOCK_SIZE) - 1);
}

/** Included + purchased capacity ceiling from authorized additional blocks. */
export function authorizedUnitCapacity(additionalBlocks: number): number {
  const blocks = Number.isFinite(additionalBlocks) ? Math.max(0, Math.floor(additionalBlocks)) : 0;
  return UNIT_BLOCK_SIZE * (1 + blocks);
}

export function isUnitVolumeTrialEligible(managedUnits: number): boolean {
  return normalizeManagedUnits(managedUnits) <= UNIT_BLOCK_SIZE;
}

export function baseMonthlyUsdForModule(module: UnitVolumeModule): number {
  if (module === "mpa_complete_platform") {
    return COMPLETE_BASE_MONTHLY_USD;
  }
  // Property Manager and Facility Operations share the $59 monthly base.
  return PM_BASE_MONTHLY_USD;
}

/**
 * Annual base cents for Checkout line-item 1.
 * Must match Stripe Price `unit_amount` for the module's annual base Price.
 */
export function baseAnnualCentsForModule(module: UnitVolumeModule): number {
  if (module === "mpa_complete_platform") {
    return COMPLETE_BASE_ANNUAL_CENTS;
  }
  return PM_BASE_ANNUAL_CENTS;
}

/** Annual base USD for quotes/display — same cents as Stripe. */
export function baseAnnualUsdForModule(module: UnitVolumeModule): number {
  return usdFromCents(baseAnnualCentsForModule(module));
}

export function monthlyUnitVolumePriceUsd(input: {
  module: UnitVolumeModule;
  managedUnits: number;
}): number {
  const blocks = additionalUnitBlocks(input.managedUnits);
  return baseMonthlyUsdForModule(input.module) + ADDITIONAL_UNIT_BLOCK_MONTHLY_USD * blocks;
}

export function annualUnitVolumePriceUsd(input: {
  module: UnitVolumeModule;
  managedUnits: number;
}): number {
  const blocks = additionalUnitBlocks(input.managedUnits);
  return usdFromCents(
    baseAnnualCentsForModule(input.module) + ADDITIONAL_UNIT_BLOCK_ANNUAL_CENTS * blocks
  );
}

/** Dollars saved vs paying the monthly total for 12 months. */
export function annualSavingsVsMonthlyUsd(monthlyUsd: number, annualUsd: number): number {
  return usdFromCents(Math.round(monthlyUsd * 12 * 100) - Math.round(annualUsd * 100));
}

/**
 * Server-authoritative quote. Clients may preview; Checkout must recompute via this API.
 */
export function quoteUnitVolume(input: {
  module: UnitVolumeModule;
  managedUnits: number;
}): UnitVolumeQuote {
  const managedUnits = normalizeManagedUnits(input.managedUnits);
  const additionalBlocks = additionalUnitBlocks(managedUnits);
  const baseMonthlyUsd = baseMonthlyUsdForModule(input.module);
  const baseAnnualUsd = baseAnnualUsdForModule(input.module);
  const monthlyPriceUsd = baseMonthlyUsd + ADDITIONAL_UNIT_BLOCK_MONTHLY_USD * additionalBlocks;
  const annualPriceUsd = usdFromCents(
    baseAnnualCentsForModule(input.module) + ADDITIONAL_UNIT_BLOCK_ANNUAL_CENTS * additionalBlocks
  );

  return {
    managedUnits,
    includedUnits: UNIT_BLOCK_SIZE,
    additionalBlocks,
    authorizedUnitCapacity: authorizedUnitCapacity(additionalBlocks),
    monthlyPriceUsd,
    annualPriceUsd,
    trialEligible: isUnitVolumeTrialEligible(managedUnits),
    trialDays: UNIT_VOLUME_TRIAL_DAYS,
    module: input.module,
    baseMonthlyUsd,
    baseAnnualUsd,
    additionalBlockMonthlyUsd: ADDITIONAL_UNIT_BLOCK_MONTHLY_USD
  };
}

export function isUnitVolumeModule(sku: ProductSku): sku is UnitVolumeModule {
  return (
    sku === "mpa_property_manager" ||
    sku === "mpa_facility_operations" ||
    sku === "mpa_complete_platform"
  );
}

/** Quote helper for all three customer products (unit-volume). */
export function quoteUnitVolumeForSku(input: {
  productSku: ProductSku;
  managedUnits: number;
}): UnitVolumeQuote | null {
  if (!isUnitVolumeModule(input.productSku)) {
    return null;
  }
  return quoteUnitVolume({ module: input.productSku, managedUnits: input.managedUnits });
}
