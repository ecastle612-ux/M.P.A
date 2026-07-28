/**
 * ACQ-001 Slice A — public plan catalog for pricing / comparison.
 * Limits/modules from capability matrix; list prices from SaaS plan display (marketing).
 */
import { resolveEntitlementsForPlan } from "../auth/capability-matrix";
import type { SaasBillingInterval } from "../integrations/saas-billing/contracts";
import { PLAN_DISPLAY } from "../saas/plan-display";
import {
  ACQ_DEFAULT_BILLING_INTERVAL,
  ACQ_FOUNDER_PUBLIC,
  ACQ_TRIAL_ENABLED,
  isPublicSelfServePlan,
  type AcqSelfServePlan
} from "./decisions";

export type PublicPlanCard = {
  planCode: AcqSelfServePlan | "enterprise";
  name: string;
  description: string;
  selfServe: boolean;
  ctaLabel: string;
  ctaHref: string;
  features: string[];
  maxProperties: number | "Custom";
  maxUsers: number | "Custom";
  listPriceMonthly: number | null;
  listPriceAnnual: number | null;
  highlight?: boolean;
};

const TRIAL_DAYS = 14;

function priceFor(planCode: "professional" | "business" | "enterprise") {
  const row = PLAN_DISPLAY.find((p) => p.planCode === planCode);
  return {
    listPriceMonthly: row?.listPriceMonthly ?? null,
    listPriceAnnual: row?.listPriceAnnual ?? null
  };
}

export function buildPublicPlanCards(interval: SaasBillingInterval = ACQ_DEFAULT_BILLING_INTERVAL): PublicPlanCard[] {
  void interval;
  void ACQ_FOUNDER_PUBLIC;
  const cards: PublicPlanCard[] = [];

  if (ACQ_TRIAL_ENABLED) {
    const trial = resolveEntitlementsForPlan("trial");
    cards.push({
      planCode: "trial",
      name: "Trial",
      description: `${TRIAL_DAYS}-day evaluation with payment method on file. Full core modules at trial limits.`,
      selfServe: true,
      ctaLabel: "Start free trial",
      ctaHref: `/acquire/start?plan=trial&interval=${ACQ_DEFAULT_BILLING_INTERVAL}`,
      features: [
        `Up to ${trial.limits.maxProperties} properties`,
        `Up to ${trial.limits.maxUsers} seats`,
        "Property & facility operations",
        "Guided Setup included"
      ],
      maxProperties: trial.limits.maxProperties,
      maxUsers: trial.limits.maxUsers,
      listPriceMonthly: 0,
      listPriceAnnual: 0
    });
  }

  const professional = resolveEntitlementsForPlan("professional");
  const proPrices = priceFor("professional");
  cards.push({
    planCode: "professional",
    name: "Professional",
    description: "For growing property management teams that need a complete operations OS.",
    selfServe: true,
    ctaLabel: "Choose Professional",
    ctaHref: `/acquire/start?plan=professional&interval=${ACQ_DEFAULT_BILLING_INTERVAL}`,
    features: [
      `Up to ${professional.limits.maxProperties} properties`,
      `Up to ${professional.limits.maxUsers} seats`,
      "Maintenance, leasing, financials",
      "AI copilot · marketplace"
    ],
    maxProperties: professional.limits.maxProperties,
    maxUsers: professional.limits.maxUsers,
    ...proPrices,
    highlight: true
  });

  const business = resolveEntitlementsForPlan("business");
  const bizPrices = priceFor("business");
  cards.push({
    planCode: "business",
    name: "Business",
    description: "Higher capacity and priority support for multi-property portfolios.",
    selfServe: true,
    ctaLabel: "Choose Business",
    ctaHref: `/acquire/start?plan=business&interval=${ACQ_DEFAULT_BILLING_INTERVAL}`,
    features: [
      `Up to ${business.limits.maxProperties} properties`,
      `Up to ${business.limits.maxUsers} seats`,
      "Everything in Professional",
      "Priority support"
    ],
    maxProperties: business.limits.maxProperties,
    maxUsers: business.limits.maxUsers,
    ...bizPrices
  });

  const entPrices = priceFor("enterprise");
  cards.push({
    planCode: "enterprise",
    name: "Enterprise",
    description: "Custom scale, security review, and sales-assisted onboarding.",
    selfServe: false,
    ctaLabel: "Contact sales",
    ctaHref: "/contact-sales",
    features: [
      "Custom property & seat limits",
      "Dedicated success",
      "Sales-assisted implementation",
      "Everything in Business"
    ],
    maxProperties: "Custom",
    maxUsers: "Custom",
    ...entPrices
  });

  return cards;
}

export type ComparisonRow = {
  label: string;
  trial: string;
  professional: string;
  business: string;
  enterprise: string;
};

export function buildPlanComparisonRows(): ComparisonRow[] {
  const trial = resolveEntitlementsForPlan("trial");
  const professional = resolveEntitlementsForPlan("professional");
  const business = resolveEntitlementsForPlan("business");
  const enterprise = resolveEntitlementsForPlan("enterprise");

  const yn = (v: boolean) => (v ? "Included" : "—");

  return [
    {
      label: "Max properties",
      trial: String(trial.limits.maxProperties),
      professional: String(professional.limits.maxProperties),
      business: String(business.limits.maxProperties),
      enterprise: "Custom"
    },
    {
      label: "Max seats",
      trial: String(trial.limits.maxUsers),
      professional: String(professional.limits.maxUsers),
      business: String(business.limits.maxUsers),
      enterprise: "Custom"
    },
    {
      label: "Property operations",
      trial: yn(Boolean(trial.features["property_operations"])),
      professional: yn(Boolean(professional.features["property_operations"])),
      business: yn(Boolean(business.features["property_operations"])),
      enterprise: yn(Boolean(enterprise.features["property_operations"]))
    },
    {
      label: "Facility operations",
      trial: yn(Boolean(trial.features["facility_operations"])),
      professional: yn(Boolean(professional.features["facility_operations"])),
      business: yn(Boolean(business.features["facility_operations"])),
      enterprise: yn(Boolean(enterprise.features["facility_operations"]))
    },
    {
      label: "Maintenance",
      trial: yn(Boolean(trial.features["maintenance"])),
      professional: yn(Boolean(professional.features["maintenance"])),
      business: yn(Boolean(business.features["maintenance"])),
      enterprise: yn(Boolean(enterprise.features["maintenance"]))
    },
    {
      label: "Leasing",
      trial: yn(Boolean(trial.features["leasing"])),
      professional: yn(Boolean(professional.features["leasing"])),
      business: yn(Boolean(business.features["leasing"])),
      enterprise: yn(Boolean(enterprise.features["leasing"]))
    },
    {
      label: "Financials",
      trial: yn(Boolean(trial.features["financials"])),
      professional: yn(Boolean(professional.features["financials"])),
      business: yn(Boolean(business.features["financials"])),
      enterprise: yn(Boolean(enterprise.features["financials"]))
    },
    {
      label: "Messaging",
      trial: yn(Boolean(trial.features["messaging"])),
      professional: yn(Boolean(professional.features["messaging"])),
      business: yn(Boolean(business.features["messaging"])),
      enterprise: yn(Boolean(enterprise.features["messaging"]))
    },
    {
      label: "AI copilot",
      trial: yn(Boolean(trial.features["ai_copilot"])),
      professional: yn(Boolean(professional.features["ai_copilot"])),
      business: yn(Boolean(business.features["ai_copilot"])),
      enterprise: yn(Boolean(enterprise.features["ai_copilot"]))
    },
    {
      label: "Marketplace",
      trial: yn(Boolean(trial.features["marketplace"])),
      professional: yn(Boolean(professional.features["marketplace"])),
      business: yn(Boolean(business.features["marketplace"])),
      enterprise: yn(Boolean(enterprise.features["marketplace"]))
    },
    {
      label: "Priority support",
      trial: yn(trial.limits.prioritySupport),
      professional: yn(professional.limits.prioritySupport),
      business: yn(business.limits.prioritySupport),
      enterprise: yn(enterprise.limits.prioritySupport)
    }
  ];
}

export function checkoutStartHref(plan: AcqSelfServePlan, interval: SaasBillingInterval): string {
  if (!isPublicSelfServePlan(plan)) {
    return "/contact-sales";
  }
  return `/acquire/start?plan=${plan}&interval=${interval}`;
}

export function formatListPrice(amount: number | null, interval: SaasBillingInterval): string {
  if (amount === null) return "Talk to sales";
  if (amount === 0) return "Free during trial";
  const suffix = interval === "year" ? "/year" : "/month";
  return `$${amount}${suffix}`;
}

export const TOUR_STEPS = [
  {
    id: "command-center",
    title: "Start from today’s work",
    body: "Command Center surfaces what needs attention — maintenance, leasing, and follow-ups — without a KPI wall."
  },
  {
    id: "portfolio",
    title: "Run the portfolio",
    body: "Properties, units, and residents stay connected so handoffs do not live in spreadsheets."
  },
  {
    id: "maintenance",
    title: "Close maintenance loops",
    body: "Work orders move from request to vendor to completion with a clear status trail."
  },
  {
    id: "facility",
    title: "Facility operations included",
    body: "Inventory, preventive maintenance, and inspections sit beside property ops when your plan includes them."
  },
  {
    id: "team",
    title: "Invite your team within seats",
    body: "Organization Administrators invite members. Accounts are never open public registration."
  },
  {
    id: "billing",
    title: "Subscription stays separate from rent",
    body: "Your M.P.A. subscription is SaaS billing. Tenant rent and owner payouts use their own money rails."
  }
] as const;
