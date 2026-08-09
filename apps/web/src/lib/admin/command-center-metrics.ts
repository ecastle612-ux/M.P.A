/**
 * Master Admin Command Center — read-only metric aggregation.
 * Visibility only; no mutations.
 */

import {
  isProductSku,
  isTerminalFailure,
  isProvisioningComplete,
  toSkuLabel,
  type BillingCycle,
  type ProductSku,
  type ProvisioningJob,
  type ProvisioningStatus
} from "@mpa/shared";
import type { StoredSaasPurchase, StoredSaasWebhookEvent } from "../saas-stripe/purchase-store";
import type { LifecycleSubscription } from "@mpa/shared";

export type HealthTone = "ok" | "warn" | "down" | "unknown" | "info";

export type CommandCenterHealthItem = {
  id: string;
  label: string;
  tone: HealthTone;
  detail: string;
};

export type CommandCenterActivityItem = {
  id: string;
  at: string;
  title: string;
  detail: string;
  href?: string;
};

export type CommandCenterSnapshot = {
  generatedAt: string;
  organizations: {
    total: number;
    active: number;
    trial: number;
    suspended: number;
    pendingProvisioning: number;
  };
  commercial: {
    activeSubscriptions: number;
    mrrCents: number;
    arrCents: number;
    mrrFormatted: string;
    arrFormatted: string;
    recentPurchases: CommandCenterActivityItem[];
    failedProvisioning: number;
  };
  users: {
    total: number;
    propertyManagers: number;
    facilityUsers: number;
    residents: number;
    platformOperators: number;
  };
  system: CommandCenterHealthItem[];
  activity: {
    latestOrganizations: CommandCenterActivityItem[];
    latestPurchases: CommandCenterActivityItem[];
    latestProvisioning: CommandCenterActivityItem[];
    latestLifecycle: CommandCenterActivityItem[];
    latestSupport: CommandCenterActivityItem[];
  };
  alerts: CommandCenterActivityItem[];
};

export type OrgMetricRow = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  subscriptionStatus: string | null;
  setupComplete: boolean;
  productSku: ProductSku | null;
  planTier: string | null;
  billingCycle: BillingCycle | null;
};

export type PriceLookup = {
  /** offerId or `${sku}__${tier}__${cycle}` → unit amount in cents */
  unitAmountByOfferKey: Record<string, number>;
};

const SUSPENDED_SUB_STATUSES = new Set(["unpaid", "expired", "canceled", "dispute_hold"]);
const ACTIVE_SUB_STATUSES = new Set(["active"]);
const TRIAL_SUB_STATUSES = new Set(["trialing"]);
const BILLABLE_SUB_STATUSES = new Set(["active", "trialing"]);

const FACILITY_ROLE_HINTS = new Set([
  "facility_manager",
  "facility_technician",
  "facility_user",
  "maintenance_technician"
]);

export function formatUsdFromCents(cents: number): string {
  const value = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2
  }).format(value);
}

export function classifyOrganizationBucket(input: {
  subscriptionStatus: string | null;
  setupComplete: boolean;
  provisioningStatuses: ProvisioningStatus[];
}): "active" | "trial" | "suspended" | "pending_provisioning" | "other" {
  const status = input.subscriptionStatus;
  if (status && SUSPENDED_SUB_STATUSES.has(status)) return "suspended";
  if (input.provisioningStatuses.some((s) => s === "suspended_unclaimed")) return "suspended";
  if (status && TRIAL_SUB_STATUSES.has(status)) return "trial";
  if (status === "pending") return "pending_provisioning";
  if (!input.setupComplete && status && BILLABLE_SUB_STATUSES.has(status)) {
    return "pending_provisioning";
  }
  const inFlight = input.provisioningStatuses.some(
    (s) => !isProvisioningComplete(s) && !isTerminalFailure(s)
  );
  if (inFlight) return "pending_provisioning";
  if (status && ACTIVE_SUB_STATUSES.has(status)) return "active";
  return "other";
}

export function monthlyRecurringCents(input: {
  billingCycle: BillingCycle | null;
  unitAmountCents: number | null;
}): number {
  if (!input.unitAmountCents || input.unitAmountCents <= 0) return 0;
  if (input.billingCycle === "annual") {
    return Math.round(input.unitAmountCents / 12);
  }
  if (input.billingCycle === "monthly") {
    return input.unitAmountCents;
  }
  return 0;
}

export function offerPriceKey(
  productSku: ProductSku,
  planTier: string | null,
  billingCycle: BillingCycle | null
): string | null {
  if (!billingCycle) return null;
  const tier = planTier ?? "professional";
  return `${productSku}__${tier}__${billingCycle}`;
}

export function countRoles(memberships: Array<{ roles: string[] | null; status: string | null }>): {
  total: number;
  propertyManagers: number;
  facilityUsers: number;
  residents: number;
} {
  let total = 0;
  let propertyManagers = 0;
  let facilityUsers = 0;
  let residents = 0;
  for (const row of memberships) {
    if (row.status && row.status !== "active") continue;
    total += 1;
    const roles = Array.isArray(row.roles) ? row.roles : [];
    if (roles.includes("property_manager") || roles.includes("organization_admin")) {
      propertyManagers += 1;
    }
    if (roles.some((role) => FACILITY_ROLE_HINTS.has(role))) {
      facilityUsers += 1;
    }
    if (roles.includes("tenant")) {
      residents += 1;
    }
  }
  return { total, propertyManagers, facilityUsers, residents };
}

export function buildCommandCenterSnapshot(input: {
  organizations: OrgMetricRow[];
  memberships: Array<{ roles: string[] | null; status: string | null }>;
  operatorCount: number;
  provisioningJobs: ProvisioningJob[];
  purchases: StoredSaasPurchase[];
  webhookEvents: StoredSaasWebhookEvent[];
  lifecycle: LifecycleSubscription[];
  priceLookup: PriceLookup;
  system: {
    stripeConfigured: boolean;
    stripeCheckoutReady: boolean;
    supabaseOk: boolean;
    supabaseDetail: string;
    emailConfigured: boolean;
    demoSessions: number;
    demoOk: boolean;
  };
  generatedAt?: string;
}): CommandCenterSnapshot {
  const jobsByOrg = new Map<string, ProvisioningStatus[]>();
  for (const job of input.provisioningJobs) {
    if (!job.organizationId) continue;
    const list = jobsByOrg.get(job.organizationId) ?? [];
    list.push(job.checkpoint);
    jobsByOrg.set(job.organizationId, list);
  }

  let active = 0;
  let trial = 0;
  let suspended = 0;
  let pendingProvisioning = 0;

  for (const org of input.organizations) {
    const bucket = classifyOrganizationBucket({
      subscriptionStatus: org.subscriptionStatus,
      setupComplete: org.setupComplete,
      provisioningStatuses: jobsByOrg.get(org.id) ?? []
    });
    if (bucket === "active") active += 1;
    else if (bucket === "trial") trial += 1;
    else if (bucket === "suspended") suspended += 1;
    else if (bucket === "pending_provisioning") pendingProvisioning += 1;
  }

  let activeSubscriptions = 0;
  let mrrCents = 0;
  for (const org of input.organizations) {
    if (!org.subscriptionStatus || !BILLABLE_SUB_STATUSES.has(org.subscriptionStatus)) continue;
    if (!org.productSku || !org.billingCycle) continue;
    activeSubscriptions += 1;
    const key = offerPriceKey(org.productSku, org.planTier, org.billingCycle);
    const unit = key ? (input.priceLookup.unitAmountByOfferKey[key] ?? null) : null;
    mrrCents += monthlyRecurringCents({ billingCycle: org.billingCycle, unitAmountCents: unit });
  }
  const arrCents = mrrCents * 12;

  const failedProvisioning = input.provisioningJobs.filter((job) =>
    isTerminalFailure(job.checkpoint)
  ).length;

  const roleCounts = countRoles(input.memberships);

  const system: CommandCenterHealthItem[] = [
    {
      id: "stripe",
      label: "Stripe",
      tone: input.system.stripeConfigured
        ? input.system.stripeCheckoutReady
          ? "ok"
          : "warn"
        : "down",
      detail: input.system.stripeConfigured
        ? input.system.stripeCheckoutReady
          ? "SaaS key + PM checkout prices ready"
          : "Configured — checkout prices incomplete"
        : "Secret / SaaS webhook not configured"
    },
    {
      id: "supabase",
      label: "Supabase",
      tone: input.system.supabaseOk ? "ok" : "down",
      detail: input.system.supabaseDetail
    },
    {
      id: "email",
      label: "Email delivery",
      tone: input.system.emailConfigured ? "ok" : "warn",
      detail: input.system.emailConfigured
        ? "Resend API key present"
        : "RESEND_API_KEY not configured"
    },
    {
      id: "demo",
      label: "Demo platform",
      tone: input.system.demoOk ? "ok" : "warn",
      detail: input.system.demoOk
        ? `${input.system.demoSessions} active demo session(s)`
        : "Demo diagnostics unavailable"
    },
    {
      id: "jobs",
      label: "Background jobs",
      tone: failedProvisioning > 0 ? "warn" : "ok",
      detail:
        failedProvisioning > 0
          ? `${failedProvisioning} failed provisioning job(s)`
          : `${input.provisioningJobs.length} provisioning job(s) observed`
    }
  ];

  const latestOrganizations = [...input.organizations]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8)
    .map((org) => ({
      id: `org-${org.id}`,
      at: org.createdAt,
      title: org.name,
      detail: org.productSku
        ? `${toSkuLabel(org.productSku)} · ${org.subscriptionStatus ?? "no subscription"}`
        : org.subscriptionStatus ?? "No subscription",
      href: "/admin/platform/organizations"
    }));

  const latestPurchases = input.purchases.slice(0, 8).map((purchase) => ({
    id: `purchase-${purchase.stripeCheckoutSessionId}`,
    at: purchase.createdAt,
    title: `${toSkuLabel(purchase.productSku)} · ${purchase.status}`,
    detail: purchase.customerEmail ?? purchase.stripeCheckoutSessionId,
    href: "/admin/commercial/checkout"
  }));

  const latestProvisioning = input.provisioningJobs.slice(0, 8).map((job) => ({
    id: `prov-${job.id}`,
    at: job.updatedAt,
    title: `${isProductSku(job.productSku) ? toSkuLabel(job.productSku) : job.productSku} · ${job.checkpoint}`,
    detail: job.organizationName ?? job.ownerEmail,
    href: "/admin/commercial/provisioning"
  }));

  const latestLifecycle = input.lifecycle.slice(0, 8).map((row) => ({
    id: `life-${row.stripeSubscriptionId}`,
    at: row.updatedAt,
    title: `${isProductSku(row.productSku) ? toSkuLabel(row.productSku) : row.productSku} · ${row.status}`,
    detail: row.organizationId ?? row.stripeSubscriptionId,
    href: "/admin/commercial/lifecycle"
  }));

  const latestSupport = input.webhookEvents.slice(0, 8).map((event) => ({
    id: `wh-${event.stripeEventId}`,
    at: event.createdAt,
    title: event.eventType,
    detail: event.processedAt ? "Processed" : "Pending process",
    href: "/admin/commercial/lifecycle"
  }));

  const alerts: CommandCenterActivityItem[] = [];
  if (failedProvisioning > 0) {
    alerts.push({
      id: "alert-failed-provisioning",
      at: input.generatedAt ?? new Date().toISOString(),
      title: "Failed provisioning",
      detail: `${failedProvisioning} terminal failure job(s) need operator attention`,
      href: "/admin/commercial/provisioning"
    });
  }
  if (!input.system.stripeConfigured) {
    alerts.push({
      id: "alert-stripe",
      at: input.generatedAt ?? new Date().toISOString(),
      title: "Stripe health",
      detail: "SaaS Stripe is not fully configured",
      href: "/admin/commercial/checkout"
    });
  }
  if (!input.system.supabaseOk) {
    alerts.push({
      id: "alert-supabase",
      at: input.generatedAt ?? new Date().toISOString(),
      title: "Supabase health",
      detail: input.system.supabaseDetail
    });
  }
  if (pendingProvisioning > 0) {
    alerts.push({
      id: "alert-pending-provisioning",
      at: input.generatedAt ?? new Date().toISOString(),
      title: "Pending provisioning",
      detail: `${pendingProvisioning} organization(s) awaiting setup or provisioning`,
      href: "/admin/commercial/provisioning"
    });
  }

  return {
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    organizations: {
      total: input.organizations.length,
      active,
      trial,
      suspended,
      pendingProvisioning
    },
    commercial: {
      activeSubscriptions,
      mrrCents,
      arrCents,
      mrrFormatted: formatUsdFromCents(mrrCents),
      arrFormatted: formatUsdFromCents(arrCents),
      recentPurchases: latestPurchases.slice(0, 5),
      failedProvisioning
    },
    users: {
      total: roleCounts.total,
      propertyManagers: roleCounts.propertyManagers,
      facilityUsers: roleCounts.facilityUsers,
      residents: roleCounts.residents,
      platformOperators: input.operatorCount
    },
    system,
    activity: {
      latestOrganizations,
      latestPurchases,
      latestProvisioning,
      latestLifecycle,
      latestSupport
    },
    alerts
  };
}
