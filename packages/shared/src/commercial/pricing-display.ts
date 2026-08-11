/**
 * Slice 5 — customer-facing unit-volume pricing display helpers.
 * Uses the same domain formulas as Checkout (no duplicated commercial math).
 */

import type { BillingCycle } from "./plans";
import {
  ADDITIONAL_UNIT_BLOCK_MONTHLY_USD,
  COMPLETE_BASE_MONTHLY_USD,
  FO_ANNUAL_USD,
  FO_MONTHLY_USD,
  PM_BASE_MONTHLY_USD,
  UNIT_BLOCK_SIZE,
  quoteUnitVolume,
  type UnitVolumeModule,
  type UnitVolumeQuote
} from "./unit-volume";

export type UnitVolumeCalculatorResult = UnitVolumeQuote & {
  billingInterval: BillingCycle;
  selectedAmount: number;
  selectedAmountLabel: string;
  trialHeadline: string | null;
  trialDetails: string[];
  capacityHeadline: string;
  examples: Array<{ units: number; monthly: number; annual: number }>;
};

export function formatUsdAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(amount);
}

/** Authoritative calculator preview — same `quoteUnitVolume` as server quotes. */
export function calculateUnitVolumeDisplay(input: {
  module?: UnitVolumeModule;
  managedUnits: number;
  billingInterval: BillingCycle;
}): UnitVolumeCalculatorResult {
  const module = input.module ?? "mpa_property_manager";
  const quote = quoteUnitVolume({
    module,
    managedUnits: input.managedUnits
  });
  const selectedAmount =
    input.billingInterval === "annual" ? quote.annualPriceUsd : quote.monthlyPriceUsd;
  const trialHeadline = quote.trialEligible ? "30 days free" : null;
  const trialDetails = quote.trialEligible
    ? [
        "30 days free",
        "Valid payment card required.",
        "Your subscription automatically begins billing after the free trial."
      ]
    : [
        "No free trial for portfolios over 500 managed units.",
        "Valid payment card required at checkout.",
        `Additional Unit Capacity applies — ${formatUsdAmount(selectedAmount)}/${input.billingInterval === "annual" ? "year" : "month"}.`
      ];

  return {
    ...quote,
    billingInterval: input.billingInterval,
    selectedAmount,
    selectedAmountLabel: `${formatUsdAmount(selectedAmount)}/${input.billingInterval === "annual" ? "year" : "month"}`,
    trialHeadline,
    trialDetails,
    capacityHeadline:
      quote.additionalBlocks === 0
        ? `Includes up to ${UNIT_BLOCK_SIZE} managed units`
        : `Additional Unit Capacity: ${quote.additionalBlocks} × ${UNIT_BLOCK_SIZE}-unit block${quote.additionalBlocks === 1 ? "" : "s"}`,
    examples: [500, 501, 1000, 1001].map((units) => {
      const example = quoteUnitVolume({ module, managedUnits: units });
      return {
        units,
        monthly: example.monthlyPriceUsd,
        annual: example.annualPriceUsd
      };
    })
  };
}

export const PUBLIC_PRICING_MODEL_COPY = {
  pmBaseMonthly: PM_BASE_MONTHLY_USD,
  completeBaseMonthly: COMPLETE_BASE_MONTHLY_USD,
  additionalBlockMonthly: ADDITIONAL_UNIT_BLOCK_MONTHLY_USD,
  includedUnits: UNIT_BLOCK_SIZE,
  foMonthly: FO_MONTHLY_USD,
  foAnnual: FO_ANNUAL_USD,
  pmHeadline: `$${PM_BASE_MONTHLY_USD}/month`,
  foHeadlineMonthly: `$${FO_MONTHLY_USD}/month`,
  foHeadlineAnnual: `$${FO_ANNUAL_USD}/year`,
  pmIncludes: `Up to ${UNIT_BLOCK_SIZE} managed units`,
  foIncludes: `Up to ${UNIT_BLOCK_SIZE} managed units`,
  additionalCapacityLine: `+$${ADDITIONAL_UNIT_BLOCK_MONTHLY_USD}/month per additional ${UNIT_BLOCK_SIZE} units`,
  annualNote: "Annual equals monthly × 12 — no discount on Additional Unit Capacity."
} as const;
