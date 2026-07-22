import type { SaasBillingInterval, SaasPlanCode } from "./contracts";

export type PlanPriceRef = {
  planCode: SaasPlanCode;
  billingInterval: SaasBillingInterval;
  priceId: string;
  trialPeriodDays?: number;
};

const ENV_PRICE_KEYS: Array<{
  env: string;
  planCode: SaasPlanCode;
  billingInterval: SaasBillingInterval;
}> = [
  { env: "STRIPE_SAAS_PRICE_FOUNDER_MONTHLY", planCode: "founder", billingInterval: "month" },
  { env: "STRIPE_SAAS_PRICE_FOUNDER", planCode: "founder", billingInterval: "month" },
  { env: "STRIPE_SAAS_PRICE_FOUNDER_ANNUAL", planCode: "founder", billingInterval: "year" },
  { env: "STRIPE_SAAS_PRICE_PROFESSIONAL_MONTHLY", planCode: "professional", billingInterval: "month" },
  { env: "STRIPE_SAAS_PRICE_PRO", planCode: "professional", billingInterval: "month" },
  { env: "STRIPE_SAAS_PRICE_PROFESSIONAL_ANNUAL", planCode: "professional", billingInterval: "year" },
  { env: "STRIPE_SAAS_PRICE_BUSINESS_MONTHLY", planCode: "business", billingInterval: "month" },
  { env: "STRIPE_SAAS_PRICE_BUSINESS", planCode: "business", billingInterval: "month" },
  { env: "STRIPE_SAAS_PRICE_BUSINESS_ANNUAL", planCode: "business", billingInterval: "year" },
  { env: "STRIPE_SAAS_PRICE_ENTERPRISE_MONTHLY", planCode: "enterprise", billingInterval: "month" },
  { env: "STRIPE_SAAS_PRICE_ENTERPRISE", planCode: "enterprise", billingInterval: "month" },
  { env: "STRIPE_SAAS_PRICE_ENTERPRISE_ANNUAL", planCode: "enterprise", billingInterval: "year" }
];

function defaultTrialDays(): number {
  const raw = process.env["STRIPE_SAAS_TRIAL_DAYS"]?.trim();
  if (!raw) return 14;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 14;
}

/** Resolve Stripe Price id for a plan + interval from env. */
export function resolvePriceId(
  planCode: SaasPlanCode,
  billingInterval: SaasBillingInterval
): PlanPriceRef | null {
  if (planCode === "trial") {
    // Trial uses a paid price with trial_period_days, default professional monthly.
    const paid = resolvePriceId("professional", billingInterval);
    if (!paid) {
      return {
        planCode: "trial",
        billingInterval,
        priceId: `price_saas_sandbox_trial_${billingInterval}`,
        trialPeriodDays: defaultTrialDays()
      };
    }
    return { ...paid, planCode: "trial", trialPeriodDays: defaultTrialDays() };
  }

  const match = ENV_PRICE_KEYS.find(
    (row) => row.planCode === planCode && row.billingInterval === billingInterval
  );
  if (!match) return null;
  const priceId = process.env[match.env]?.trim();
  if (priceId) {
    return {
      planCode,
      billingInterval,
      priceId
    };
  }

  // Sandbox / CI fallback so Checkout can be exercised without Dashboard prices.
  if (
    process.env["STRIPE_MODE"] === "sandbox" ||
    process.env["STRIPE_MODE"] === "test" ||
    !process.env["STRIPE_SECRET_KEY"]?.trim()
  ) {
    return {
      planCode,
      billingInterval,
      priceId: `price_saas_sandbox_${planCode}_${billingInterval}`
    };
  }

  return null;
}

export function resolvePlanFromPriceId(
  priceId: string | null | undefined
): { planCode: SaasPlanCode; billingInterval: SaasBillingInterval } | null {
  if (!priceId) return null;
  for (const row of ENV_PRICE_KEYS) {
    const envPrice = process.env[row.env]?.trim();
    if (envPrice && envPrice === priceId) {
      return { planCode: row.planCode, billingInterval: row.billingInterval };
    }
  }
  const sandbox = /^price_saas_sandbox_([a-z]+)_([a-z]+)$/.exec(priceId);
  if (sandbox) {
    const planCode = sandbox[1] as SaasPlanCode;
    const billingInterval = sandbox[2] as SaasBillingInterval;
    if (
      ["trial", "founder", "professional", "business", "enterprise"].includes(planCode) &&
      (billingInterval === "month" || billingInterval === "year")
    ) {
      return { planCode, billingInterval };
    }
  }
  return null;
}

export function listConfiguredPlanPrices(): PlanPriceRef[] {
  const out: PlanPriceRef[] = [];
  for (const planCode of ["founder", "professional", "business", "enterprise"] as SaasPlanCode[]) {
    for (const billingInterval of ["month", "year"] as SaasBillingInterval[]) {
      const ref = resolvePriceId(planCode, billingInterval);
      if (ref) out.push(ref);
    }
  }
  return out;
}
