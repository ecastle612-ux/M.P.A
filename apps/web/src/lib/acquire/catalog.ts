/**
 * UX-013 Slice A — public plan catalog (modules-first; no Trial card).
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
import {
  moduleSelectionLabel,
  type AcqModuleSelection
} from "./modules";

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
  /** Single-module ×2 list price — shown only for bundles to prove savings. */
  compareAtMonthly: number | null;
  compareAtAnnual: number | null;
  moduleCount: 1 | 2 | null;
  highlight?: boolean;
};

/**
 * Public list-price hierarchy (presentation).
 * - One module = base PLAN_DISPLAY amount
 * - Both modules = 1.5× base (more than one module; less than 2× separate)
 * Enterprise stays custom / sales-quoted (null amounts when no list row).
 */
export function modulePriceMultiplier(modules: AcqModuleSelection | null): number {
  return modules === "both" ? 1.5 : 1;
}

export function listPriceForModules(
  planCode: "professional" | "business" | "enterprise",
  modules: AcqModuleSelection | null = null
): {
  listPriceMonthly: number | null;
  listPriceAnnual: number | null;
  compareAtMonthly: number | null;
  compareAtAnnual: number | null;
  moduleCount: 1 | 2 | null;
} {
  const row = PLAN_DISPLAY.find((p) => p.planCode === planCode);
  if (!row) {
    return {
      listPriceMonthly: null,
      listPriceAnnual: null,
      compareAtMonthly: null,
      compareAtAnnual: null,
      moduleCount: null
    };
  }

  // Enterprise is sales-assisted; keep list figures as capacity anchors only.
  if (planCode === "enterprise") {
    return {
      listPriceMonthly: row.listPriceMonthly,
      listPriceAnnual: row.listPriceAnnual,
      compareAtMonthly: null,
      compareAtAnnual: null,
      moduleCount: modules === "both" ? 2 : modules ? 1 : null
    };
  }

  const multiplier = modulePriceMultiplier(modules);
  const listPriceMonthly = Math.round(row.listPriceMonthly * multiplier);
  const listPriceAnnual = Math.round(row.listPriceAnnual * multiplier);
  const isBundle = modules === "both";

  return {
    listPriceMonthly,
    listPriceAnnual,
    compareAtMonthly: isBundle ? row.listPriceMonthly * 2 : null,
    compareAtAnnual: isBundle ? row.listPriceAnnual * 2 : null,
    moduleCount: isBundle ? 2 : modules ? 1 : null
  };
}

function priceFor(
  planCode: "professional" | "business" | "enterprise",
  modules: AcqModuleSelection | null = null
) {
  return listPriceForModules(planCode, modules);
}

function moduleFeatures(selection: AcqModuleSelection | null): string[] {
  if (selection === "property_ops") {
    return [
      "Property Operations platform",
      "Leasing, residents, and maintenance",
      "Team seats within plan limits"
    ];
  }
  if (selection === "facility_ops") {
    return [
      "Facility Operations platform",
      "Preventive maintenance, inventory, inspections",
      "Team seats within plan limits"
    ];
  }
  if (selection === "both") {
    return [
      "Property and Facility Operations",
      "Bundle pricing — more than one module, less than two singles",
      "Team seats within plan limits"
    ];
  }
  return [
    "Choose modules first for a tailored plan summary",
    "Property Operations and/or Facility Operations",
    "Team seats within plan limits"
  ];
}

export function buildPublicPlanCards(
  interval: SaasBillingInterval = ACQ_DEFAULT_BILLING_INTERVAL,
  modules: AcqModuleSelection | null = null
): PublicPlanCard[] {
  void interval;
  void ACQ_FOUNDER_PUBLIC;
  void ACQ_TRIAL_ENABLED;
  const cards: PublicPlanCard[] = [];
  const moduleQuery = modules ? `&modules=${modules}` : "";
  const moduleLine = modules
    ? `${moduleSelectionLabel(modules)} · `
    : "";

  const professional = resolveEntitlementsForPlan("professional");
  const proPrices = priceFor("professional", modules);
  cards.push({
    planCode: "professional",
    name: "Professional",
    description: `${moduleLine}Complete operations OS for growing property and facility teams.`,
    selfServe: true,
    ctaLabel: "Choose Professional",
    ctaHref: `/acquire/start?plan=professional&interval=${ACQ_DEFAULT_BILLING_INTERVAL}${moduleQuery}`,
    features: [
      `Up to ${professional.limits.maxProperties} properties`,
      `Up to ${professional.limits.maxUsers} seats`,
      ...moduleFeatures(modules),
      "AI copilot · marketplace"
    ],
    maxProperties: professional.limits.maxProperties,
    maxUsers: professional.limits.maxUsers,
    ...proPrices,
    highlight: true
  });

  const business = resolveEntitlementsForPlan("business");
  const bizPrices = priceFor("business", modules);
  cards.push({
    planCode: "business",
    name: "Business",
    description: `${moduleLine}Higher capacity and priority support for multi-property portfolios.`,
    selfServe: true,
    ctaLabel: "Choose Business",
    ctaHref: `/acquire/start?plan=business&interval=${ACQ_DEFAULT_BILLING_INTERVAL}${moduleQuery}`,
    features: [
      `Up to ${business.limits.maxProperties} properties`,
      `Up to ${business.limits.maxUsers} seats`,
      "Everything in Professional",
      ...moduleFeatures(modules).slice(0, 2),
      "Priority support"
    ],
    maxProperties: business.limits.maxProperties,
    maxUsers: business.limits.maxUsers,
    ...bizPrices
  });

  const entPrices = priceFor("enterprise", modules);
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
      "Property and Facility Operations as scoped with sales"
    ],
    maxProperties: "Custom",
    maxUsers: "Custom",
    ...entPrices
  });

  return cards;
}

export type ComparisonRow = {
  label: string;
  professional: string;
  business: string;
  enterprise: string;
};

export function buildPlanComparisonRows(
  modules: AcqModuleSelection | null = null
): ComparisonRow[] {
  const professional = resolveEntitlementsForPlan("professional");
  const business = resolveEntitlementsForPlan("business");
  const enterprise = resolveEntitlementsForPlan("enterprise");

  const yn = (v: boolean) => (v ? "Included" : "—");
  const propertyShown = modules !== "facility_ops";
  const facilityShown = modules !== "property_ops";

  const rows: ComparisonRow[] = [
    {
      label: "Max properties",
      professional: String(professional.limits.maxProperties),
      business: String(business.limits.maxProperties),
      enterprise: "Custom"
    },
    {
      label: "Max seats",
      professional: String(professional.limits.maxUsers),
      business: String(business.limits.maxUsers),
      enterprise: "Custom"
    }
  ];

  if (propertyShown) {
    rows.push({
      label: "Property operations",
      professional: yn(Boolean(professional.features["property_operations"])),
      business: yn(Boolean(business.features["property_operations"])),
      enterprise: yn(Boolean(enterprise.features["property_operations"]))
    });
  }
  if (facilityShown) {
    rows.push({
      label: "Facility operations",
      professional: yn(Boolean(professional.features["facility_operations"])),
      business: yn(Boolean(business.features["facility_operations"])),
      enterprise: yn(Boolean(enterprise.features["facility_operations"]))
    });
  }

  rows.push(
    {
      label: "Maintenance",
      professional: yn(Boolean(professional.features["maintenance"])),
      business: yn(Boolean(business.features["maintenance"])),
      enterprise: yn(Boolean(enterprise.features["maintenance"]))
    },
    {
      label: "Leasing",
      professional: propertyShown
        ? yn(Boolean(professional.features["leasing"]))
        : "—",
      business: propertyShown ? yn(Boolean(business.features["leasing"])) : "—",
      enterprise: propertyShown ? yn(Boolean(enterprise.features["leasing"])) : "—"
    },
    {
      label: "Financials",
      professional: yn(Boolean(professional.features["financials"])),
      business: yn(Boolean(business.features["financials"])),
      enterprise: yn(Boolean(enterprise.features["financials"]))
    },
    {
      label: "Messaging",
      professional: yn(Boolean(professional.features["messaging"])),
      business: yn(Boolean(business.features["messaging"])),
      enterprise: yn(Boolean(enterprise.features["messaging"]))
    },
    {
      label: "AI copilot",
      professional: yn(Boolean(professional.features["ai_copilot"])),
      business: yn(Boolean(business.features["ai_copilot"])),
      enterprise: yn(Boolean(enterprise.features["ai_copilot"]))
    },
    {
      label: "Marketplace",
      professional: yn(Boolean(professional.features["marketplace"])),
      business: yn(Boolean(business.features["marketplace"])),
      enterprise: yn(Boolean(enterprise.features["marketplace"]))
    },
    {
      label: "Priority support",
      professional: yn(professional.limits.prioritySupport),
      business: yn(business.limits.prioritySupport),
      enterprise: yn(enterprise.limits.prioritySupport)
    }
  );

  return rows;
}

export function checkoutStartHref(
  plan: AcqSelfServePlan,
  interval: SaasBillingInterval,
  modules?: AcqModuleSelection | null
): string {
  if (!isPublicSelfServePlan(plan)) {
    return "/contact-sales";
  }
  const moduleQuery = modules ? `&modules=${modules}` : "";
  return `/acquire/start?plan=${plan}&interval=${interval}${moduleQuery}`;
}

export function formatListPrice(amount: number | null, interval: SaasBillingInterval): string {
  if (amount === null) return "Talk to sales";
  if (amount === 0) return "Included";
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
    title: "Run Property Operations",
    body: "Properties, units, and residents stay connected so handoffs do not live in spreadsheets."
  },
  {
    id: "maintenance",
    title: "Close maintenance loops",
    body: "Work orders move from request to vendor to completion with a clear status trail."
  },
  {
    id: "facility",
    title: "Run Facility Operations",
    body: "Inventory, preventive maintenance, and inspections sit beside property ops in a modular subscription."
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
