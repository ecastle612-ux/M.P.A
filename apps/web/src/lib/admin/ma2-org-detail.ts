/**
 * MA-2 Organization Detail — pure aggregation helpers.
 * Inspect-only. No mutations. Do not invent unavailable metrics.
 */

import {
  entitlementsForSku,
  isProductSku,
  skuIncludesFacilityOperations,
  skuIncludesPropertyManager,
  toSkuLabel,
  type ProductSku
} from "@mpa/shared";
import type { HealthTone } from "./command-center-metrics";
import { classifyOrganizationBucket } from "./command-center-metrics";
import { isAuthRelatedError } from "./ma1-overview";
import { scrubUnknown } from "../observability/scrub";
import type { ProvisioningStatus } from "@mpa/shared";

export type Ma2LifecycleLabel =
  | "provisioning"
  | "setup"
  | "active"
  | "trial"
  | "suspended"
  | "cancellation"
  | "other";

export type Ma2ModuleState = {
  sku: ProductSku;
  label: string;
  enabled: boolean;
  entitlementCount: number;
  commercialState: "current_product" | "included" | "not_included";
};

export type Ma2WorkOrderSummary = {
  open: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  urgent: number;
  totalSampled: number;
  availability: "authoritative" | "partial" | "unavailable";
  note?: string;
};

export type Ma2VendorSummary = {
  total: number;
  active: number;
  inactive: number;
  outstandingWorkOrders: number;
  availability: "authoritative" | "partial" | "unavailable";
  note?: string;
};

export type Ma2HealthIssue = {
  id: string;
  severity: "critical" | "warn" | "info";
  title: string;
  detail: string;
  href?: string;
};

export function mapLifecycleLabel(input: {
  subscriptionStatus: string | null;
  setupComplete: boolean;
  provisioningStatuses: ProvisioningStatus[];
  cancelAtPeriodEnd?: boolean;
}): Ma2LifecycleLabel {
  if (input.subscriptionStatus === "canceled" || input.cancelAtPeriodEnd) {
    return "cancellation";
  }
  const bucket = classifyOrganizationBucket({
    subscriptionStatus: input.subscriptionStatus,
    setupComplete: input.setupComplete,
    provisioningStatuses: input.provisioningStatuses
  });
  if (bucket === "pending_provisioning") return "provisioning";
  if (bucket === "suspended") return "suspended";
  if (bucket === "trial") return "trial";
  if (bucket === "active") {
    if (!input.setupComplete) return "setup";
    return "active";
  }
  if (!input.setupComplete) return "setup";
  return "other";
}

export function capacityUtilizationPercent(
  managed: number | null,
  capacity: number | null
): { value: number | null; availability: "authoritative" | "unavailable"; note?: string } {
  if (managed == null || capacity == null || capacity <= 0) {
    return {
      value: null,
      availability: "unavailable",
      note: "Utilization requires managed units and authorized capacity > 0"
    };
  }
  return {
    value: Math.round((managed / capacity) * 1000) / 10,
    availability: "authoritative"
  };
}

export function buildModuleStates(sku: ProductSku | null): Ma2ModuleState[] {
  const products: ProductSku[] = [
    "mpa_property_manager",
    "mpa_facility_operations",
    "mpa_complete_platform"
  ];
  return products.map((candidate) => {
    const enabled =
      sku != null &&
      (candidate === sku ||
        (candidate === "mpa_property_manager" && skuIncludesPropertyManager(sku)) ||
        (candidate === "mpa_facility_operations" && skuIncludesFacilityOperations(sku)));
    // Complete is enabled only when SKU is complete; PM/FO show as included under Complete.
    const commercialState: Ma2ModuleState["commercialState"] =
      sku === candidate
        ? "current_product"
        : enabled
          ? "included"
          : "not_included";
    const entitlementCount = entitlementsForSku(candidate).length;
    return {
      sku: candidate,
      label: toSkuLabel(candidate),
      enabled: sku === candidate ? true : commercialState === "included",
      entitlementCount,
      commercialState
    };
  });
}

/** Normalize module cards: Complete SKU enables PM+FO as included; Complete itself current. */
export function buildModuleStatesForOrg(sku: ProductSku | null): Ma2ModuleState[] {
  if (!sku || !isProductSku(sku)) {
    return buildModuleStates(null).map((m) => ({
      ...m,
      enabled: false,
      commercialState: "not_included" as const
    }));
  }
  const entitlements = entitlementsForSku(sku);
  return [
    {
      sku: "mpa_property_manager",
      label: "Property Manager",
      enabled: skuIncludesPropertyManager(sku),
      entitlementCount: entitlements.filter((e) => e.startsWith("pm.")).length,
      commercialState:
        sku === "mpa_property_manager"
          ? "current_product"
          : skuIncludesPropertyManager(sku)
            ? "included"
            : "not_included"
    },
    {
      sku: "mpa_facility_operations",
      label: "Facility Operations",
      enabled: skuIncludesFacilityOperations(sku),
      entitlementCount: entitlements.filter((e) => e.startsWith("facility.")).length,
      commercialState:
        sku === "mpa_facility_operations"
          ? "current_product"
          : skuIncludesFacilityOperations(sku)
            ? "included"
            : "not_included"
    },
    {
      sku: "mpa_complete_platform",
      label: "Complete Platform",
      enabled: sku === "mpa_complete_platform",
      entitlementCount: entitlements.length,
      commercialState: sku === "mpa_complete_platform" ? "current_product" : "not_included"
    }
  ];
}

const OPEN_WO = new Set(["submitted", "triaged", "assigned"]);
const IN_PROGRESS_WO = new Set(["in_progress"]);
const COMPLETED_WO = new Set(["completed", "closed"]);
const CANCELLED_WO = new Set(["cancelled"]);
const URGENT_PRIORITY = new Set(["high", "emergency"]);

export function summarizeWorkOrders(
  rows: Array<{ status: string; priority: string | null }> | null,
  degraded?: string
): Ma2WorkOrderSummary {
  if (degraded) {
    return {
      open: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      urgent: 0,
      totalSampled: 0,
      availability: "unavailable",
      note: degraded
    };
  }
  if (!rows) {
    return {
      open: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      urgent: 0,
      totalSampled: 0,
      availability: "unavailable",
      note: "Work-order metrics unavailable"
    };
  }
  let open = 0;
  let inProgress = 0;
  let completed = 0;
  let cancelled = 0;
  let urgent = 0;
  for (const row of rows) {
    if (OPEN_WO.has(row.status)) open += 1;
    else if (IN_PROGRESS_WO.has(row.status)) inProgress += 1;
    else if (COMPLETED_WO.has(row.status)) completed += 1;
    else if (CANCELLED_WO.has(row.status)) cancelled += 1;
    if (URGENT_PRIORITY.has(row.priority ?? "") && !COMPLETED_WO.has(row.status) && !CANCELLED_WO.has(row.status)) {
      urgent += 1;
    }
  }
  return {
    open,
    inProgress,
    completed,
    cancelled,
    urgent,
    totalSampled: rows.length,
    availability: "authoritative",
    ...(rows.length >= 500
      ? { note: "Counts from most recent 500 work orders" }
      : {})
  };
}

export function summarizeVendors(
  vendors: Array<{ status: string }> | null,
  outstandingVendorWo: number,
  degraded?: string
): Ma2VendorSummary {
  if (degraded || !vendors) {
    return {
      total: 0,
      active: 0,
      inactive: 0,
      outstandingWorkOrders: 0,
      availability: "unavailable",
      note: degraded ?? "Vendor metrics unavailable"
    };
  }
  const active = vendors.filter((v) => v.status === "active").length;
  return {
    total: vendors.length,
    active,
    inactive: vendors.length - active,
    outstandingWorkOrders: outstandingVendorWo,
    availability: "authoritative"
  };
}

export function deriveOrgHealth(input: {
  lifecycle: Ma2LifecycleLabel;
  failedProvisioning: number;
  problemSubscription: boolean;
  overCapacity: boolean;
  criticalErrors: number;
  notificationFailures: number;
  unresolvedStripeWebhooks: number;
  authRelatedErrors: number;
}): { tone: HealthTone; issues: Ma2HealthIssue[] } {
  const issues: Ma2HealthIssue[] = [];
  if (input.criticalErrors > 0) {
    issues.push({
      id: "critical-errors",
      severity: "critical",
      title: "Critical application errors",
      detail: `${input.criticalErrors} durable error event(s) for this organization`,
      href: "#errors"
    });
  }
  if (input.failedProvisioning > 0) {
    issues.push({
      id: "provisioning",
      severity: "warn",
      title: "Provisioning failures",
      detail: `${input.failedProvisioning} terminal provisioning checkpoint(s)`,
      href: "#checkout"
    });
  }
  if (input.problemSubscription) {
    issues.push({
      id: "subscription",
      severity: "warn",
      title: "Subscription issues",
      detail: "Subscription status indicates billing/lifecycle risk",
      href: "#subscription"
    });
  }
  if (input.overCapacity) {
    issues.push({
      id: "capacity",
      severity: "warn",
      title: "Capacity issues",
      detail: "Managed units exceed authorized capacity",
      href: "#capacity"
    });
  }
  if (input.unresolvedStripeWebhooks > 0) {
    issues.push({
      id: "webhooks",
      severity: "warn",
      title: "Webhook unresolved events",
      detail: `${input.unresolvedStripeWebhooks} Stripe SaaS event(s) without processed_at`,
      href: "#webhooks"
    });
  }
  if (input.notificationFailures > 0) {
    issues.push({
      id: "notifications",
      severity: "warn",
      title: "Notification failures",
      detail: `${input.notificationFailures} failed email delivery attempt(s)`,
      href: "#notifications"
    });
  }
  if (input.authRelatedErrors > 0) {
    issues.push({
      id: "auth",
      severity: "info",
      title: "Authorization / security signals",
      detail: `${input.authRelatedErrors} durable error(s) matching auth/RLS heuristics`,
      href: "#errors"
    });
  }
  if (input.lifecycle === "suspended" || input.lifecycle === "cancellation") {
    issues.push({
      id: "lifecycle",
      severity: "warn",
      title: `Lifecycle: ${input.lifecycle}`,
      detail: "Organization is not in a healthy active operating state",
      href: "#summary"
    });
  }

  let tone: HealthTone = "ok";
  if (issues.some((i) => i.severity === "critical")) tone = "down";
  else if (issues.length > 0) tone = "warn";
  return { tone, issues };
}

export function scrubAuditContext(payload: unknown): Record<string, unknown> {
  const scrubbed = scrubUnknown(payload ?? {});
  if (scrubbed && typeof scrubbed === "object" && !Array.isArray(scrubbed)) {
    return scrubbed as Record<string, unknown>;
  }
  return {};
}

export function countAuthRelatedErrors(
  rows: Array<{ message: string; route: string | null; metadata: Record<string, unknown> }>
): number {
  return rows.filter((r) =>
    isAuthRelatedError({ message: r.message, route: r.route, metadata: r.metadata })
  ).length;
}

export const PROBLEM_SUB_STATUSES = new Set([
  "past_due",
  "unpaid",
  "incomplete",
  "incomplete_expired",
  "paused",
  "dispute_hold",
  "expired"
]);
