import type { SaasBillingInterval, SaasPlanCode } from "../integrations/saas-billing/contracts";

/** Display-only catalog for Company Billing Center (Phase B). Charge amounts come from Stripe. */
export type PlanDisplay = {
  planCode: Exclude<SaasPlanCode, "trial">;
  name: string;
  description: string;
  features: string[];
  listPriceMonthly: number;
  listPriceAnnual: number;
  founderProtected?: boolean;
};

export const PLAN_DISPLAY: PlanDisplay[] = [
  {
    planCode: "founder",
    name: "Founder",
    description: "Invite-only lifetime pricing for design partners.",
    features: ["Protected founder rate", "Full platform access", "Priority onboarding"],
    listPriceMonthly: 49,
    listPriceAnnual: 490,
    founderProtected: true
  },
  {
    planCode: "professional",
    name: "Professional",
    description: "For growing property management teams.",
    features: ["Core operations", "Resident lifecycle", "Maintenance & financials"],
    listPriceMonthly: 99,
    listPriceAnnual: 990
  },
  {
    planCode: "business",
    name: "Business",
    description: "Higher capacity for multi-property portfolios.",
    features: ["Everything in Professional", "Higher limits", "Priority support"],
    listPriceMonthly: 249,
    listPriceAnnual: 2490
  },
  {
    planCode: "enterprise",
    name: "Enterprise",
    description: "Custom scale for large operators.",
    features: ["Everything in Business", "Custom limits", "Dedicated success"],
    listPriceMonthly: 499,
    listPriceAnnual: 4990
  }
];

export function planDisplay(planCode: SaasPlanCode | null | undefined): PlanDisplay | null {
  if (!planCode || planCode === "trial") {
    return PLAN_DISPLAY.find((p) => p.planCode === "professional") ?? null;
  }
  return PLAN_DISPLAY.find((p) => p.planCode === planCode) ?? null;
}

export function listPrice(
  planCode: SaasPlanCode,
  interval: SaasBillingInterval | null | undefined
): number | null {
  const display = planDisplay(planCode);
  if (!display) return null;
  return interval === "year" ? display.listPriceAnnual : display.listPriceMonthly;
}

export function planLabel(planCode: SaasPlanCode | null | undefined): string {
  if (!planCode) return "No plan";
  if (planCode === "trial") return "Trial";
  return planDisplay(planCode)?.name ?? planCode;
}

export function intervalLabel(interval: SaasBillingInterval | null | undefined): string {
  if (interval === "year") return "Annual";
  if (interval === "month") return "Monthly";
  return "—";
}

export function statusPresentation(status: string | null | undefined): {
  label: string;
  variant: "neutral" | "success" | "warning" | "danger" | "info";
} {
  switch (status) {
    case "trialing":
      return { label: "Trial", variant: "info" };
    case "active":
      return { label: "Active", variant: "success" };
    case "past_due":
      return { label: "Past due", variant: "warning" };
    case "canceled":
    case "incomplete_expired":
      return { label: "Canceled", variant: "neutral" };
    case "unpaid":
    case "paused":
      return { label: "Suspended", variant: "danger" };
    case "incomplete":
      return { label: "Incomplete", variant: "warning" };
    default:
      return { label: status ? status.replace(/_/g, " ") : "None", variant: "neutral" };
  }
}

export function formatUsd(amount: number, currency = "usd"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function trialDaysRemaining(trialEndsAt: string | null | undefined): number | null {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt).getTime();
  if (!Number.isFinite(end)) return null;
  const days = Math.ceil((end - Date.now()) / 86_400_000);
  return Math.max(0, days);
}

/** Rough founder savings vs Professional list price (display only). */
export function founderMonthlySavings(interval: SaasBillingInterval | null | undefined): number {
  const founder = listPrice("founder", interval ?? "month") ?? 49;
  const pro = listPrice("professional", interval ?? "month") ?? 99;
  return Math.max(0, pro - founder);
}
