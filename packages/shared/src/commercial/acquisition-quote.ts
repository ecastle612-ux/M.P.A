/**
 * Slice 2 — acquisition questionnaire, server-authoritative commercial quote,
 * module recommendation, and Confirm Plan snapshot (no Stripe objects).
 */

import { COMPLETE_READY, FO_READY } from "./commerce-flags";
import type { BillingCycle } from "./plans";
import { formatUsdAmount } from "./pricing-display";
import { publicPurchaseMotionForSku } from "./public-purchase-motion";
import type { ProductSku } from "./skus";
import { SKU_SUMMARIES } from "./skus";
import {
  UNIT_BLOCK_SIZE,
  UNIT_VOLUME_TRIAL_DAYS,
  additionalUnitBlocks,
  isUnitVolumeModule,
  quoteUnitVolume,
  quoteUnitVolumeForSku
} from "./unit-volume";

/** Quote validity window — long enough for Confirm Plan; short enough to force refresh. */
export const COMMERCIAL_QUOTE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Input protection only — not a commercial capacity cap.
 * Prevents absurd / DoS-scale unit declarations.
 */
export const MAX_DECLARED_MANAGED_UNITS = 2_000_000 as const;

export const UNIT_COUNT_RANGES = [
  { id: "1_100", label: "1–100", min: 1, max: 100 },
  { id: "101_250", label: "101–250", min: 101, max: 250 },
  { id: "251_500", label: "251–500", min: 251, max: 500 },
  { id: "501_1000", label: "501–1,000", min: 501, max: 1000 },
  { id: "1001_1500", label: "1,001–1,500", min: 1001, max: 1500 },
  { id: "1501_2000", label: "1,501–2,000", min: 1501, max: 2000 },
  { id: "2001_2500", label: "2,001–2,500", min: 2001, max: 2500 },
  { id: "2500_plus", label: "2,500+", min: 2500, max: null }
] as const;

export type UnitCountRangeId = (typeof UNIT_COUNT_RANGES)[number]["id"];

export const OPERATIONAL_NEEDS = [
  "property_resident_leasing",
  "facility_maintenance",
  "both"
] as const;

export type OperationalNeed = (typeof OPERATIONAL_NEEDS)[number];

export function isOperationalNeed(value: unknown): value is OperationalNeed {
  return typeof value === "string" && (OPERATIONAL_NEEDS as readonly string[]).includes(value);
}

export function isUnitCountRangeId(value: unknown): value is UnitCountRangeId {
  return (
    typeof value === "string" && UNIT_COUNT_RANGES.some((range) => range.id === value)
  );
}

export type AcquisitionQuestionnaireInput = {
  managedUnits: unknown;
  operationalNeed: unknown;
  billingInterval: unknown;
  notes?: unknown;
  /** Optional customer override of recommended module (Confirm Plan). */
  selectedModule?: unknown;
  unitRangeId?: unknown;
};

export type ValidatedAcquisitionAnswers = {
  managedUnits: number;
  operationalNeed: OperationalNeed;
  billingInterval: BillingCycle;
  notes: string | null;
  unitRangeId: UnitCountRangeId | null;
  selectedModule: ProductSku | null;
};

export type ModuleRecommendation = {
  recommendedModule: ProductSku;
  reason: string;
  selfServeAvailable: boolean;
  gated: boolean;
  nextAction: "confirm_plan_self_serve" | "request_early_access" | "request_consultation";
  nextActionLabel: string;
  gatedExplanation: string | null;
};

export type CommercialQuote = {
  quote_id: string;
  module: ProductSku;
  managed_units: number;
  included_units: number;
  additional_blocks: number;
  monthly_amount: number;
  annual_amount: number;
  billing_interval: BillingCycle;
  trial_eligible: boolean;
  trial_days: number;
  capacity_description: string;
  created_at: string;
  expires_at: string;
  /** Display helpers for Confirm Plan (still server-authored). */
  selected_amount: number;
  base_monthly_amount: number;
  recommendation: ModuleRecommendation;
  operational_need: OperationalNeed;
  notes: string | null;
  unit_range_id: UnitCountRangeId | null;
  first_billing_description: string;
  /** Explicitly false in Slice 2 — no Stripe objects. */
  stripe_objects_created: false;
};

export type AcquisitionSnapshot = {
  snapshot_id: string;
  quote: CommercialQuote;
  declared_units: number;
  operational_need: OperationalNeed;
  recommended_module: ProductSku;
  selected_module: ProductSku;
  billing_interval: BillingCycle;
  trial_eligible: boolean;
  created_at: string;
};

/** Fields clients must never supply as authoritative commercial decisions. */
export const FORBIDDEN_CLIENT_QUOTE_FIELDS = [
  "stripePriceId",
  "stripe_price_id",
  "priceId",
  "price_id",
  "monthly_amount",
  "annual_amount",
  "monthlyAmount",
  "annualAmount",
  "finalPrice",
  "final_price",
  "trial_eligible",
  "trialEligible",
  "trial_days",
  "trialDays",
  "additional_blocks",
  "additionalBlocks",
  "included_units",
  "includedUnits",
  "entitlements",
  "entitlementDecision"
] as const;

export function findForbiddenClientQuoteFields(
  body: Record<string, unknown> | null | undefined
): string[] {
  if (!body || typeof body !== "object") {
    return [];
  }
  return FORBIDDEN_CLIENT_QUOTE_FIELDS.filter((key) => key in body);
}

export function recommendModuleForNeed(need: OperationalNeed): ModuleRecommendation {
  if (need === "facility_maintenance") {
    const motion = publicPurchaseMotionForSku("mpa_facility_operations");
    return {
      recommendedModule: "mpa_facility_operations",
      reason: "Facility and maintenance operations",
      selfServeAvailable: FO_READY,
      gated: !FO_READY,
      nextAction: FO_READY ? "confirm_plan_self_serve" : "request_early_access",
      nextActionLabel: motion.ctaLabel,
      gatedExplanation: FO_READY
        ? null
        : "Facility Operations is not yet available for self-service. Your questionnaire answers are saved — request early access, or continue with Property Manager online."
    };
  }
  if (need === "both") {
    const motion = publicPurchaseMotionForSku("mpa_complete_platform");
    return {
      recommendedModule: "mpa_complete_platform",
      reason: "Both property and facility operations in one organization",
      selfServeAvailable: COMPLETE_READY,
      gated: !COMPLETE_READY,
      nextAction: COMPLETE_READY ? "confirm_plan_self_serve" : "request_consultation",
      nextActionLabel: motion.ctaLabel,
      gatedExplanation: COMPLETE_READY
        ? null
        : "Complete Platform is not yet available for self-service. Your questionnaire answers are saved — request a consultation, or continue with Property Manager online."
    };
  }
  const motion = publicPurchaseMotionForSku("mpa_property_manager");
  return {
    recommendedModule: "mpa_property_manager",
    reason: "Portfolio and resident operations",
    selfServeAvailable: true,
    gated: false,
    nextAction: "confirm_plan_self_serve",
    nextActionLabel: motion.ctaLabel,
    gatedExplanation: null
  };
}

export type ValidateAcquisitionResult =
  | { ok: true; answers: ValidatedAcquisitionAnswers }
  | { ok: false; reason: string; field?: string };

export function validateAcquisitionAnswers(
  input: AcquisitionQuestionnaireInput
): ValidateAcquisitionResult {
  const managedUnits = parseManagedUnitsInput(input.managedUnits);
  if (!managedUnits.ok) {
    return managedUnits;
  }

  if (!isOperationalNeed(input.operationalNeed)) {
    return { ok: false, reason: "invalid_operational_need", field: "operationalNeed" };
  }

  if (input.billingInterval !== "monthly" && input.billingInterval !== "annual") {
    return { ok: false, reason: "invalid_billing_interval", field: "billingInterval" };
  }

  let unitRangeId: UnitCountRangeId | null = null;
  if (input.unitRangeId !== undefined && input.unitRangeId !== null && input.unitRangeId !== "") {
    if (!isUnitCountRangeId(input.unitRangeId)) {
      return { ok: false, reason: "invalid_unit_range", field: "unitRangeId" };
    }
    unitRangeId = input.unitRangeId;
  }

  let selectedModule: ProductSku | null = null;
  if (
    input.selectedModule !== undefined &&
    input.selectedModule !== null &&
    input.selectedModule !== ""
  ) {
    if (
      input.selectedModule !== "mpa_property_manager" &&
      input.selectedModule !== "mpa_facility_operations" &&
      input.selectedModule !== "mpa_complete_platform"
    ) {
      return { ok: false, reason: "invalid_selected_module", field: "selectedModule" };
    }
    selectedModule = input.selectedModule;
  }

  let notes: string | null = null;
  if (input.notes !== undefined && input.notes !== null && input.notes !== "") {
    if (typeof input.notes !== "string") {
      return { ok: false, reason: "invalid_notes", field: "notes" };
    }
    const trimmed = input.notes.trim().slice(0, 500);
    notes = trimmed.length > 0 ? trimmed : null;
  }

  return {
    ok: true,
    answers: {
      managedUnits: managedUnits.value,
      operationalNeed: input.operationalNeed,
      billingInterval: input.billingInterval,
      notes,
      unitRangeId,
      selectedModule
    }
  };
}

function parseManagedUnitsInput(
  value: unknown
): { ok: true; value: number } | { ok: false; reason: string; field: string } {
  if (typeof value === "string" && value.trim() === "") {
    return { ok: false, reason: "units_required", field: "managedUnits" };
  }
  if (typeof value !== "number" && typeof value !== "string") {
    return { ok: false, reason: "invalid_units", field: "managedUnits" };
  }
  const raw = typeof value === "number" ? value : Number(String(value).replace(/,/g, "").trim());
  if (!Number.isFinite(raw) || !Number.isInteger(raw)) {
    return { ok: false, reason: "units_must_be_positive_integer", field: "managedUnits" };
  }
  if (raw <= 0) {
    return { ok: false, reason: "units_must_be_positive_integer", field: "managedUnits" };
  }
  if (raw > MAX_DECLARED_MANAGED_UNITS) {
    return { ok: false, reason: "units_exceed_input_protection", field: "managedUnits" };
  }
  return { ok: true, value: raw };
}

export function describeUnitCapacity(input: {
  module: ProductSku;
  managedUnits: number;
  additionalBlocks: number;
}): string {
  if (input.additionalBlocks <= 0) {
    return `Includes the first ${UNIT_BLOCK_SIZE} managed units in the base price. Declared ${input.managedUnits} units — no Additional Unit Capacity required.`;
  }
  return `Base capacity includes the first ${UNIT_BLOCK_SIZE} managed units. Your plan includes Additional Unit Capacity: ${input.additionalBlocks} × ${UNIT_BLOCK_SIZE}-unit block${input.additionalBlocks === 1 ? "" : "s"} for ${input.managedUnits} declared units.`;
}

export function firstBillingDescription(input: {
  trialEligible: boolean;
  trialDays: number;
  billingInterval: BillingCycle;
}): string {
  if (input.trialEligible) {
    return `30-Day Free Trial. Valid payment card required. Your subscription automatically begins billing after the free trial (${input.billingInterval} billing).`;
  }
  return input.billingInterval === "annual"
    ? "No free trial for portfolios over 500 managed units. Valid payment card required. Annual amount is due when you complete secure checkout."
    : "No free trial for portfolios over 500 managed units. Valid payment card required. Monthly amount is due when you complete secure checkout.";
}

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
  }
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function buildCommercialQuote(input: {
  answers: ValidatedAcquisitionAnswers;
  now?: Date;
  quoteId?: string;
}): CommercialQuote {
  const now = input.now ?? new Date();
  const recommendation = recommendModuleForNeed(input.answers.operationalNeed);
  const module = input.answers.selectedModule ?? recommendation.recommendedModule;
  const recommendationForSelected: ModuleRecommendation =
    module === recommendation.recommendedModule
      ? recommendation
      : {
          ...recommendModuleForNeed(
            module === "mpa_facility_operations"
              ? "facility_maintenance"
              : module === "mpa_complete_platform"
                ? "both"
                : "property_resident_leasing"
          ),
          reason: `You selected ${SKU_SUMMARIES[module].label} on Confirm Plan`
        };

  const expires = new Date(now.getTime() + COMMERCIAL_QUOTE_TTL_MS);

  const volume = quoteUnitVolumeForSku({
    productSku: module,
    managedUnits: input.answers.managedUnits
  });
  if (!volume || !isUnitVolumeModule(module)) {
    throw new Error("unit_volume_quote_unavailable");
  }

  const trialEligible = volume.trialEligible;
  const trialDays = trialEligible ? UNIT_VOLUME_TRIAL_DAYS : 0;

  return {
    quote_id: input.quoteId ?? newId("cq"),
    module,
    managed_units: volume.managedUnits,
    included_units: volume.includedUnits,
    additional_blocks: volume.additionalBlocks,
    monthly_amount: volume.monthlyPriceUsd,
    annual_amount: volume.annualPriceUsd,
    billing_interval: input.answers.billingInterval,
    trial_eligible: trialEligible,
    trial_days: trialDays,
    capacity_description: describeUnitCapacity({
      module,
      managedUnits: volume.managedUnits,
      additionalBlocks: volume.additionalBlocks
    }),
    created_at: now.toISOString(),
    expires_at: expires.toISOString(),
    selected_amount:
      input.answers.billingInterval === "annual"
        ? volume.annualPriceUsd
        : volume.monthlyPriceUsd,
    base_monthly_amount: volume.baseMonthlyUsd,
    recommendation: recommendationForSelected,
    operational_need: input.answers.operationalNeed,
    notes: input.answers.notes,
    unit_range_id: input.answers.unitRangeId,
    first_billing_description: firstBillingDescription({
      trialEligible,
      trialDays,
      billingInterval: input.answers.billingInterval
    }),
    stripe_objects_created: false
  };
}

export function createAcquisitionSnapshot(quote: CommercialQuote): AcquisitionSnapshot {
  return {
    snapshot_id: newId("as"),
    quote,
    declared_units: quote.managed_units,
    operational_need: quote.operational_need,
    recommended_module: quote.recommendation.recommendedModule,
    selected_module: quote.module,
    billing_interval: quote.billing_interval,
    trial_eligible: quote.trial_eligible,
    created_at: quote.created_at
  };
}

export function isCommercialQuoteExpired(
  quote: Pick<CommercialQuote, "expires_at">,
  now: Date = new Date()
): boolean {
  const expires = Date.parse(quote.expires_at);
  if (!Number.isFinite(expires)) {
    return true;
  }
  return now.getTime() >= expires;
}

/**
 * Recompute a quote from stored questionnaire answers — never trust prior totals.
 */
export function regenerateCommercialQuote(input: {
  answers: ValidatedAcquisitionAnswers;
  previousQuoteId?: string;
  now?: Date;
}): CommercialQuote {
  return buildCommercialQuote({
    answers: input.answers,
    ...(input.now ? { now: input.now } : {})
  });
}

export function assertQuoteMatchesRecompute(quote: CommercialQuote): boolean {
  const recomputed = buildCommercialQuote({
    answers: {
      managedUnits: quote.managed_units,
      operationalNeed: quote.operational_need,
      billingInterval: quote.billing_interval,
      notes: quote.notes,
      unitRangeId: quote.unit_range_id,
      selectedModule: quote.module
    },
    now: new Date(quote.created_at),
    quoteId: quote.quote_id
  });
  return (
    recomputed.module === quote.module &&
    recomputed.managed_units === quote.managed_units &&
    recomputed.additional_blocks === quote.additional_blocks &&
    recomputed.monthly_amount === quote.monthly_amount &&
    recomputed.annual_amount === quote.annual_amount &&
    recomputed.trial_eligible === quote.trial_eligible &&
    recomputed.trial_days === quote.trial_days &&
    recomputed.billing_interval === quote.billing_interval
  );
}

/** Convenience for Confirm Plan example copy. */
export function confirmPlanCapacityLines(quote: CommercialQuote): {
  baseCapacity: string;
  additionalCapacity: string;
  trialLabel: string;
  additionalUnitCapacityNotice: string | null;
} {
  const blocks = additionalUnitBlocks(quote.managed_units);
  return {
    baseCapacity: `${UNIT_BLOCK_SIZE} units`,
    additionalCapacity:
      blocks === 0 ? "None" : `${blocks} × ${UNIT_BLOCK_SIZE}-unit block${blocks === 1 ? "" : "s"}`,
    trialLabel: quote.trial_eligible ? "30-Day Free Trial" : "No free trial",
    additionalUnitCapacityNotice:
      quote.managed_units > UNIT_BLOCK_SIZE
        ? `Additional Unit Capacity: ${quote.additional_blocks} × ${UNIT_BLOCK_SIZE}-unit block${quote.additional_blocks === 1 ? "" : "s"} — recurring ${quote.billing_interval === "annual" ? `${formatUsdAmount(quote.annual_amount)}/year` : `${formatUsdAmount(quote.monthly_amount)}/month`}.`
        : null
  };
}

export function operationalNeedLabel(need: OperationalNeed): string {
  switch (need) {
    case "property_resident_leasing":
      return "Properties, residents, and leasing";
    case "facility_maintenance":
      return "Buildings, work orders, and facility maintenance";
    case "both":
      return "Both property and facility operations";
    default:
      return "Unknown";
  }
}

/** Re-export helper used by Confirm Plan examples / tests. */
export { quoteUnitVolume, UNIT_BLOCK_SIZE, UNIT_VOLUME_TRIAL_DAYS };
