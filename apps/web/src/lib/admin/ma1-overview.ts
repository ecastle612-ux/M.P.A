/**
 * MA-1 Master Admin Overview — pure metric aggregation.
 * Inspect-only. No mutations. Do not invent unavailable metrics.
 */

import {
  isProvisioningComplete,
  isTerminalFailure,
  type ProvisioningJob,
  type ProvisioningStatus
} from "@mpa/shared";
import type { StoredSaasPurchase, StoredSaasWebhookEvent } from "../saas-stripe/purchase-store";
import type { HealthTone } from "./command-center-metrics";
import { classifyOrganizationBucket, type OrgMetricRow } from "./command-center-metrics";

export type MetricAvailability = "authoritative" | "partial" | "unavailable";

export type Ma1Metric<T> = {
  value: T;
  availability: MetricAvailability;
  note?: string;
};

export type CapacityOrgRow = {
  organizationId: string;
  managedUnitCount: number | null;
  authorizedUnitCapacity: number | null;
  pendingAuthorizedUnitCapacity: number | null;
  declaredUnitCount: number | null;
  lastCapacityAuthorizedAt: string | null;
  subscriptionStatus: string | null;
};

export type SignWellWebhookRow = {
  id: string;
  eventType: string;
  processedAt: string;
  organizationId: string | null;
  createdAt?: string;
};

export type NotificationDeliveryRow = {
  id: string;
  emailDeliveryStatus: string | null;
  createdAt: string;
  organizationId?: string | null;
};

export type Ma1WebhookChannelHealth = {
  recentCount: number;
  processedCount: number;
  unresolvedCount: number;
  failureCount: number | null;
  lastSuccessfulAt: string | null;
  availability: MetricAvailability;
  note?: string;
};

export type Ma1OverviewExtras = {
  overallHealth: HealthTone;
  overallDetail: string;
  organizations: {
    total: number;
    active: number;
    trial: number;
    suspended: number;
    setupIncomplete: number;
    pendingProvisioning: number;
    recentCreated: number;
  };
  commercial: {
    activeSubscriptions: number;
    trialOrganizations: number;
    problemSubscriptions: number;
    capacityPendingOrgs: number;
    lifecycleIssues: number;
  };
  capacity: {
    totalManagedUnits: number;
    orgsWithCapacity: number;
    orgsOverCapacity: number;
    orgsWithPendingCapacity: number;
    recentCapacityChanges: number;
    utilizationPercent: Ma1Metric<number | null>;
  };
  checkout: {
    recentAttempts: number;
    successful: number;
    failed: number;
    pending: number;
    provisioned: number;
    failedProvisioning: number;
    pendingProvisioningJobs: number;
  };
  webhooks: {
    stripe: Ma1WebhookChannelHealth;
    signwell: Ma1WebhookChannelHealth;
  };
  notifications: {
    recentFailed: number;
    recentSent: number;
    recentQueued: number;
    availability: MetricAvailability;
    note?: string;
  };
  criticalErrors: {
    recentCount: number;
    criticalCount: number;
    errorCount: number;
    recentRatePerHour: Ma1Metric<number | null>;
  };
  authSecurity: {
    availability: MetricAvailability;
    note: string;
    relatedErrorCount: number;
  };
};

const PROBLEM_SUB_STATUSES = new Set([
  "past_due",
  "unpaid",
  "incomplete",
  "incomplete_expired",
  "paused",
  "dispute_hold"
]);

const WINDOW_MS = 24 * 60 * 60 * 1000;

function inWindow(iso: string, nowMs: number, windowMs = WINDOW_MS): boolean {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  return nowMs - t <= windowMs;
}

export function utilizationPercent(
  managed: number,
  capacity: number | null
): Ma1Metric<number | null> {
  if (capacity == null || capacity <= 0) {
    return {
      value: null,
      availability: "unavailable",
      note: "Authorized capacity missing or zero — utilization not calculated"
    };
  }
  return {
    value: Math.round((managed / capacity) * 1000) / 10,
    availability: "authoritative"
  };
}

export function buildStripeWebhookHealth(
  events: StoredSaasWebhookEvent[],
  nowIso: string
): Ma1WebhookChannelHealth {
  const nowMs = Date.parse(nowIso);
  const recent = events.filter((e) => inWindow(e.createdAt, nowMs));
  const processed = recent.filter((e) => Boolean(e.processedAt));
  const unresolved = recent.filter((e) => !e.processedAt);
  const lastSuccessfulAt =
    events
      .filter((e) => e.processedAt)
      .map((e) => e.processedAt as string)
      .sort((a, b) => b.localeCompare(a))[0] ?? null;

  return {
    recentCount: recent.length,
    processedCount: processed.length,
    unresolvedCount: unresolved.length,
    // Schema has no explicit failure flag — unprocessed is unresolved, not proven failure.
    failureCount: null,
    lastSuccessfulAt,
    availability: "partial",
    note: "Unresolved = processed_at null. Explicit delivery failures are not stored separately."
  };
}

export function buildSignWellWebhookHealth(
  events: SignWellWebhookRow[],
  nowIso: string
): Ma1WebhookChannelHealth {
  const nowMs = Date.parse(nowIso);
  const recent = events.filter((e) => inWindow(e.processedAt || e.createdAt || "", nowMs));
  const lastSuccessfulAt =
    [...events]
      .map((e) => e.processedAt)
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a))[0] ?? null;

  return {
    recentCount: recent.length,
    processedCount: recent.length,
    unresolvedCount: 0,
    failureCount: null,
    lastSuccessfulAt,
    availability: "partial",
    note:
      "Persisted deliveries only. Signature rejects never write rows — failure count unavailable from this store."
  };
}

export function countNotificationDeliveries(
  rows: NotificationDeliveryRow[],
  nowIso: string
): Ma1OverviewExtras["notifications"] {
  const nowMs = Date.parse(nowIso);
  const recent = rows.filter((r) => inWindow(r.createdAt, nowMs));
  if (rows.length === 0) {
    return {
      recentFailed: 0,
      recentSent: 0,
      recentQueued: 0,
      availability: "partial",
      note: "No notification delivery rows in window (or service role unavailable)."
    };
  }
  let recentFailed = 0;
  let recentSent = 0;
  let recentQueued = 0;
  for (const row of recent) {
    if (row.emailDeliveryStatus === "failed") recentFailed += 1;
    else if (row.emailDeliveryStatus === "sent") recentSent += 1;
    else if (row.emailDeliveryStatus === "queued") recentQueued += 1;
  }
  return {
    recentFailed,
    recentSent,
    recentQueued,
    availability: "authoritative",
    note: "Based on maintenance_notifications.email_delivery_status (Sprint 5)."
  };
}

export function deriveOverallHealth(input: {
  supabaseOk: boolean;
  criticalErrorCount: number;
  failedProvisioning: number;
  stripeUnresolved: number;
  notificationFailures: number;
  problemSubscriptions: number;
}): { tone: HealthTone; detail: string } {
  if (!input.supabaseOk) {
    return { tone: "down", detail: "Database/query health failed — platform inspect degraded" };
  }
  if (input.criticalErrorCount > 0) {
    return {
      tone: "warn",
      detail: `${input.criticalErrorCount} critical/error event(s) in durable feed`
    };
  }
  if (
    input.failedProvisioning > 0 ||
    input.stripeUnresolved > 0 ||
    input.notificationFailures > 0 ||
    input.problemSubscriptions > 0
  ) {
    return {
      tone: "warn",
      detail: "Operational failures or unresolved webhook/notification issues require attention"
    };
  }
  return { tone: "ok", detail: "No critical signals in the current inspect window" };
}

export function buildMa1OverviewExtras(input: {
  organizations: OrgMetricRow[];
  capacityRows: CapacityOrgRow[];
  provisioningJobs: ProvisioningJob[];
  purchases: StoredSaasPurchase[];
  stripeWebhooks: StoredSaasWebhookEvent[];
  signwellWebhooks: SignWellWebhookRow[];
  notifications: NotificationDeliveryRow[];
  criticalErrorCount: number;
  criticalSeverityCount: number;
  errorSeverityCount: number;
  authRelatedErrorCount: number;
  supabaseOk: boolean;
  generatedAt?: string;
}): Ma1OverviewExtras {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const nowMs = Date.parse(generatedAt);

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
  let setupIncomplete = 0;
  let recentCreated = 0;

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
    if (!org.setupComplete) setupIncomplete += 1;
    if (inWindow(org.createdAt, nowMs)) recentCreated += 1;
  }

  let activeSubscriptions = 0;
  let problemSubscriptions = 0;
  for (const org of input.organizations) {
    const status = org.subscriptionStatus;
    if (!status) continue;
    if (status === "active" || status === "trialing") activeSubscriptions += 1;
    if (PROBLEM_SUB_STATUSES.has(status)) problemSubscriptions += 1;
  }

  let totalManagedUnits = 0;
  let orgsWithCapacity = 0;
  let orgsOverCapacity = 0;
  let orgsWithPendingCapacity = 0;
  let recentCapacityChanges = 0;
  let capacitySum = 0;
  let capacitySumCount = 0;

  for (const row of input.capacityRows) {
    const managed = row.managedUnitCount ?? 0;
    totalManagedUnits += managed;
    if (row.authorizedUnitCapacity != null && row.authorizedUnitCapacity > 0) {
      orgsWithCapacity += 1;
      capacitySum += row.authorizedUnitCapacity;
      capacitySumCount += 1;
      if (managed > row.authorizedUnitCapacity) orgsOverCapacity += 1;
    }
    if (
      row.pendingAuthorizedUnitCapacity != null &&
      row.pendingAuthorizedUnitCapacity > 0
    ) {
      orgsWithPendingCapacity += 1;
    }
    if (row.lastCapacityAuthorizedAt && inWindow(row.lastCapacityAuthorizedAt, nowMs)) {
      recentCapacityChanges += 1;
    }
  }

  const checkoutRecent = input.purchases.filter((p) => inWindow(p.createdAt, nowMs));
  let successful = 0;
  let failed = 0;
  let pending = 0;
  let provisioned = 0;
  for (const p of checkoutRecent) {
    if (p.status === "checkout_completed") successful += 1;
    else if (
      p.status === "checkout_expired" ||
      p.status === "checkout_canceled" ||
      p.status === "payment_failed"
    ) {
      failed += 1;
    } else pending += 1;
    if (p.provisioned) provisioned += 1;
  }

  const failedProvisioning = input.provisioningJobs.filter((j) =>
    isTerminalFailure(j.checkpoint)
  ).length;
  const pendingProvisioningJobs = input.provisioningJobs.filter(
    (j) => !isProvisioningComplete(j.checkpoint) && !isTerminalFailure(j.checkpoint)
  ).length;

  const stripe = buildStripeWebhookHealth(input.stripeWebhooks, generatedAt);
  const signwell = buildSignWellWebhookHealth(input.signwellWebhooks, generatedAt);
  const notifications = countNotificationDeliveries(input.notifications, generatedAt);

  const hours = 24;
  const recentRatePerHour: Ma1Metric<number | null> =
    input.criticalErrorCount > 0
      ? {
          value: Math.round((input.criticalErrorCount / hours) * 100) / 100,
          availability: "partial",
          note: "Approximate rate from durable feed count ÷ 24h window"
        }
      : {
          value: 0,
          availability: "partial",
          note: "No durable error events in the inspect sample"
        };

  const overall = deriveOverallHealth({
    supabaseOk: input.supabaseOk,
    criticalErrorCount: input.criticalSeverityCount + input.errorSeverityCount,
    failedProvisioning,
    stripeUnresolved: stripe.unresolvedCount,
    notificationFailures: notifications.recentFailed,
    problemSubscriptions
  });

  return {
    overallHealth: overall.tone,
    overallDetail: overall.detail,
    organizations: {
      total: input.organizations.length,
      active,
      trial,
      suspended,
      setupIncomplete,
      pendingProvisioning,
      recentCreated
    },
    commercial: {
      activeSubscriptions,
      trialOrganizations: trial,
      problemSubscriptions,
      capacityPendingOrgs: orgsWithPendingCapacity,
      lifecycleIssues: problemSubscriptions + suspended
    },
    capacity: {
      totalManagedUnits,
      orgsWithCapacity,
      orgsOverCapacity,
      orgsWithPendingCapacity,
      recentCapacityChanges,
      utilizationPercent:
        capacitySumCount > 0
          ? utilizationPercent(totalManagedUnits, capacitySum)
          : {
              value: null,
              availability: "unavailable",
              note: "No organizations with authorized unit capacity"
            }
    },
    checkout: {
      recentAttempts: checkoutRecent.length,
      successful,
      failed,
      pending,
      provisioned,
      failedProvisioning,
      pendingProvisioningJobs
    },
    webhooks: { stripe, signwell },
    notifications,
    criticalErrors: {
      recentCount: input.criticalErrorCount,
      criticalCount: input.criticalSeverityCount,
      errorCount: input.errorSeverityCount,
      recentRatePerHour
    },
    authSecurity: {
      availability: "unavailable",
      note:
        "Dedicated authorization/RLS denial metrics are not instrumented yet. Related durable errors are counted when message/route/metadata suggests auth denial.",
      relatedErrorCount: input.authRelatedErrorCount
    }
  };
}

export function isAuthRelatedError(input: {
  message: string;
  route: string | null;
  metadata: Record<string, unknown>;
}): boolean {
  const hay = [
    input.message,
    input.route ?? "",
    JSON.stringify(input.metadata ?? {})
  ]
    .join(" ")
    .toLowerCase();
  return (
    hay.includes("unauthorized") ||
    hay.includes("forbidden") ||
    hay.includes("not authenticated") ||
    hay.includes("rls") ||
    hay.includes("authorization") ||
    hay.includes("auth denial") ||
    hay.includes("auth_denial")
  );
}
