/**
 * Slice 5 — customer-facing unit-volume pricing display helpers.
 * Uses the same domain formulas as Checkout (no duplicated commercial math).
 */

import type { BillingCycle } from "./plans";
import {
  ADDITIONAL_UNIT_BLOCK_MONTHLY_USD,
  COMPLETE_BASE_ANNUAL_USD,
  COMPLETE_BASE_MONTHLY_USD,
  FO_ANNUAL_USD,
  FO_MONTHLY_USD,
  PM_BASE_ANNUAL_USD,
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
  const cents = Math.round(amount * 100);
  const fractionDigits = cents % 100 === 0 ? 0 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(cents / 100);
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
  const trialHeadline = quote.trialEligible ? "30 DAYS FREE" : null;
  const trialDetails = quote.trialEligible
    ? [
        "30 DAYS FREE for plans with 500 or fewer managed units.",
        "Payment card required at signup.",
        "After the free trial, automatic billing begins unless you cancel."
      ]
    : [
        "No free trial for more than 500 managed units.",
        "Payment card required.",
        `You see the calculated price before Checkout — ${formatUsdAmount(selectedAmount)}/${input.billingInterval === "annual" ? "year" : "month"}.`
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

export const ANNUAL_SAVINGS_COPY = "Save 20% with annual billing" as const;

export const PUBLIC_PRICING_MODEL_COPY = {
  pmBaseMonthly: PM_BASE_MONTHLY_USD,
  completeBaseMonthly: COMPLETE_BASE_MONTHLY_USD,
  additionalBlockMonthly: ADDITIONAL_UNIT_BLOCK_MONTHLY_USD,
  includedUnits: UNIT_BLOCK_SIZE,
  foMonthly: FO_MONTHLY_USD,
  foAnnual: FO_ANNUAL_USD,
  pmHeadline: `$${PM_BASE_MONTHLY_USD}/month`,
  pmHeadlineAnnual: `${formatUsdAmount(PM_BASE_ANNUAL_USD)}/year`,
  foHeadlineMonthly: `$${FO_MONTHLY_USD}/month`,
  foHeadlineAnnual: `${formatUsdAmount(FO_ANNUAL_USD)}/year`,
  completeHeadlineMonthly: `$${COMPLETE_BASE_MONTHLY_USD}/month`,
  completeHeadlineAnnual: `${formatUsdAmount(COMPLETE_BASE_ANNUAL_USD)}/year`,
  pmIncludes: `Up to ${UNIT_BLOCK_SIZE} managed units · Take rent online with Stripe. Choose bank payments, cards, or both.`,
  foIncludes: `Up to ${UNIT_BLOCK_SIZE} managed units`,
  completeIncludes: `Up to ${UNIT_BLOCK_SIZE} managed units · Take rent online with Stripe. Choose bank payments, cards, or both.`,
  additionalCapacityLine: `+$${ADDITIONAL_UNIT_BLOCK_MONTHLY_USD}/month per additional ${UNIT_BLOCK_SIZE} units`,
  additionalCapacityAnnualLine: `+$${ADDITIONAL_UNIT_BLOCK_MONTHLY_USD * 12}/year per additional ${UNIT_BLOCK_SIZE} units`,
  includedCapacityPlain: `Your plan includes up to ${UNIT_BLOCK_SIZE} managed units.`,
  additionalCapacityPlain: `Each additional ${UNIT_BLOCK_SIZE}-unit block adds $${ADDITIONAL_UNIT_BLOCK_MONTHLY_USD}/month or $${ADDITIONAL_UNIT_BLOCK_MONTHLY_USD * 12}/year.`,
  annualSavingsCopy: ANNUAL_SAVINGS_COPY,
  annualNote: `${ANNUAL_SAVINGS_COPY}. Property Manager and Facility Operations are ${formatUsdAmount(PM_BASE_ANNUAL_USD)}/year; Complete Platform is ${formatUsdAmount(COMPLETE_BASE_ANNUAL_USD)}/year (up to ${UNIT_BLOCK_SIZE} managed units). Additional Unit Capacity annual remains monthly × 12.`,
  unitDefinitionTitle: "What is a managed unit?",
  unitDefinition:
    "A managed unit is a property unit managed through M.P.A. Two tenants living in one unit count as 1 managed unit — not 2. Billing is by unit, not by the number of residents.",
  billingMonthly: "Monthly: base price + applicable Additional Unit Capacity.",
  billingAnnual: `Annual: ${ANNUAL_SAVINGS_COPY} on the product base. Additional Unit Capacity still adds $468/year per 500-unit block.`,
  capacityChangeTitle: "If your unit count increases",
  capacityChange:
    "Unit-count changes do not create surprise mid-period charges. If Additional Unit Capacity must increase, customer approval is required. The new recurring capacity takes effect on the next billing period.",
  trialTitle: "30 DAYS FREE",
  trialEligible:
    "30 DAYS FREE for plans with 500 or fewer managed units. Payment card required at signup. After the free trial, automatic billing begins unless you cancel.",
  trialIneligible:
    "For more than 500 managed units: no free trial. Payment card required. You see the calculated price before Checkout.",
  cancellationTitle: "Cancel anytime",
  cancellationSummary:
    "Cancel anytime. No refunds and no prorated refunds. Cancellation takes effect at the end of the paid billing period — access continues through the paid-through date, and future renewal stops.",
  enterpriseNotProduct:
    "Enterprise is not a separate product. It is an optional sales and onboarding path for organizations that need custom contracts, SSO, or dedicated onboarding — not a fourth platform SKU.",
  journeyNote:
    "Get Started takes you through questionnaire → product recommendation → unit count → quote → Confirm Plan → Checkout. You do not re-enter pricing math that the calculator already resolved."
} as const;

/** Points shown in the subscription cancel confirmation dialog. */
export const CANCEL_CONFIRMATION_POINTS = [
  "Cancellation takes effect at the end of your current paid billing period.",
  "Access continues through the paid period.",
  "No refunds and no prorated refunds are issued."
] as const;

export function formatPaidThroughDate(
  iso: string,
  locale: string = "en-US"
): string {
  return new Date(iso).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

/**
 * Customer copy when cancel-at-period-end is already scheduled.
 * Requires the authoritative `currentPeriodEnd` when available — never invents a date.
 */
export function cancelScheduledAccessCopy(
  currentPeriodEnd: string | null | undefined
): string {
  if (currentPeriodEnd) {
    const date = formatPaidThroughDate(currentPeriodEnd);
    return `Your subscription remains active through ${date}. You won't be charged for another period.`;
  }
  return "Cancellation takes effect at the end of the paid billing period. Access continues through your paid-through date, and you won't be charged for another period.";
}
