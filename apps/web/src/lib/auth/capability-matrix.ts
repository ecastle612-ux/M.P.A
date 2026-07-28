/**
 * AUTH-001 Slice B — subscription capability matrix (server-side hooks).
 * Design SoT: docs/109-auth-001…/26-subscription-capability-matrix.md
 */
import type { SaasPlanCode } from "../integrations/saas-billing/contracts";

export type OrganizationTypeSku = "property_manager" | "owner" | "enterprise";

export type PlanLimits = {
  maxUsers: number;
  maxProperties: number;
  storageGb: number;
  aiUsage: "limited" | "standard" | "elevated" | "full" | "custom";
  marketplace: boolean;
  prioritySupport: boolean;
};

export type PlanEntitlementSnapshot = {
  planCode: SaasPlanCode;
  modules: string[];
  features: Record<string, boolean>;
  limits: PlanLimits;
  organizationTypesAllowed: OrganizationTypeSku[];
};

const CORE_MODULES = [
  "property_operations",
  "facility_operations",
  "maintenance",
  "leasing",
  "financials",
  "documents",
  "messaging",
  "owner_portal",
  "screening",
  "esign"
] as const;

/** Shared feature flags for Core+Property / Core+Facility commercial SKUs (both on until SKU split). */
const CORE_FEATURES = {
  property_operations: true,
  facility_operations: true,
  maintenance: true,
  leasing: true,
  financials: true,
  documents: true,
  messaging: true,
  owner_portal: true,
  screening: true,
  esign: true
} as const;

const PLAN_MATRIX: Record<SaasPlanCode, PlanEntitlementSnapshot> = {
  trial: {
    planCode: "trial",
    modules: [...CORE_MODULES],
    features: {
      ...CORE_FEATURES,
      marketplace: false,
      ai_copilot: true
    },
    limits: {
      maxUsers: 5,
      maxProperties: 3,
      storageGb: 5,
      aiUsage: "limited",
      marketplace: false,
      prioritySupport: false
    },
    organizationTypesAllowed: ["property_manager", "owner"]
  },
  founder: {
    planCode: "founder",
    modules: [...CORE_MODULES, "marketplace", "ai_copilot"],
    features: {
      ...CORE_FEATURES,
      marketplace: true,
      ai_copilot: true
    },
    limits: {
      maxUsers: 15,
      maxProperties: 25,
      storageGb: 50,
      aiUsage: "full",
      marketplace: true,
      prioritySupport: true
    },
    organizationTypesAllowed: ["property_manager", "owner"]
  },
  professional: {
    planCode: "professional",
    modules: [...CORE_MODULES, "marketplace", "ai_copilot"],
    features: {
      ...CORE_FEATURES,
      marketplace: true,
      ai_copilot: true
    },
    limits: {
      maxUsers: 25,
      maxProperties: 50,
      storageGb: 100,
      aiUsage: "standard",
      marketplace: true,
      prioritySupport: false
    },
    organizationTypesAllowed: ["property_manager", "owner"]
  },
  business: {
    planCode: "business",
    modules: [...CORE_MODULES, "marketplace", "ai_copilot"],
    features: {
      ...CORE_FEATURES,
      marketplace: true,
      ai_copilot: true
    },
    limits: {
      maxUsers: 100,
      maxProperties: 250,
      storageGb: 500,
      aiUsage: "elevated",
      marketplace: true,
      prioritySupport: true
    },
    organizationTypesAllowed: ["property_manager", "owner"]
  },
  enterprise: {
    planCode: "enterprise",
    modules: [...CORE_MODULES, "marketplace", "ai_copilot"],
    features: {
      ...CORE_FEATURES,
      marketplace: true,
      ai_copilot: true
    },
    limits: {
      maxUsers: 1000,
      maxProperties: 10000,
      storageGb: 5000,
      aiUsage: "custom",
      marketplace: true,
      prioritySupport: true
    },
    organizationTypesAllowed: ["property_manager", "owner", "enterprise"]
  }
};

export function resolveEntitlementsForPlan(planCode: SaasPlanCode): PlanEntitlementSnapshot {
  return PLAN_MATRIX[planCode] ?? PLAN_MATRIX.professional;
}

export function isModuleEntitled(snapshot: PlanEntitlementSnapshot, moduleKey: string): boolean {
  if (snapshot.features[moduleKey] === true) return true;
  return snapshot.modules.includes(moduleKey);
}

export type EntitlementDenial = {
  ok: false;
  code: "not_entitled" | "limit_exceeded" | "no_snapshot";
  message: string;
};

export type EntitlementOk = { ok: true };

export type EntitlementResult = EntitlementOk | EntitlementDenial;

export function assertModuleEntitled(
  snapshot: PlanEntitlementSnapshot | null,
  moduleKey: string
): EntitlementResult {
  if (!snapshot) {
    return { ok: false, code: "no_snapshot", message: "No entitlement snapshot for organization." };
  }
  if (!isModuleEntitled(snapshot, moduleKey)) {
    return {
      ok: false,
      code: "not_entitled",
      message: `Module "${moduleKey}" is not included in plan ${snapshot.planCode}.`
    };
  }
  return { ok: true };
}

export function assertWithinLimit(
  snapshot: PlanEntitlementSnapshot | null,
  limitKey: keyof Pick<PlanLimits, "maxUsers" | "maxProperties">,
  currentCount: number
): EntitlementResult {
  if (!snapshot) {
    return { ok: false, code: "no_snapshot", message: "No entitlement snapshot for organization." };
  }
  const max = snapshot.limits[limitKey];
  if (currentCount >= max) {
    return {
      ok: false,
      code: "limit_exceeded",
      message: `Plan ${snapshot.planCode} limit reached for ${limitKey} (${max}).`
    };
  }
  return { ok: true };
}

export function commercialStatusForPlan(planCode: SaasPlanCode): "trial" | "pending_setup" {
  return planCode === "trial" ? "trial" : "pending_setup";
}
