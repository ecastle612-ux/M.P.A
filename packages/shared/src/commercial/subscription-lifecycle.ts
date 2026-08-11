/**
 * COM-002 Slice E — self-serve subscription lifecycle (PM / FO / Complete).
 * Binding: 7-day past-due grace; webhooks are access truth.
 */

import type { ProductSku } from "./skus";

export const SUBSCRIPTION_PLATFORM_STATUSES = [
  "pending",
  "active",
  "past_due",
  "canceled",
  "expired",
  "unpaid",
  "incomplete",
  "dispute_hold",
  "trialing"
] as const;

export type SubscriptionPlatformStatus = (typeof SUBSCRIPTION_PLATFORM_STATUSES)[number];

/** Customer-facing phases (no Stripe jargon). */
export const CUSTOMER_LIFECYCLE_PHASES = [
  "pending",
  "active",
  "grace",
  "past_due",
  "canceled",
  "expired",
  "reactivated"
] as const;

export type CustomerLifecyclePhase = (typeof CUSTOMER_LIFECYCLE_PHASES)[number];

export const PAST_DUE_GRACE_DAYS = 7;

export const DUNNING_EMAIL_DAYS = [0, 3, 6, 7] as const;

export type LifecycleAuditEntry = {
  at: string;
  from: SubscriptionPlatformStatus | "none";
  to: SubscriptionPlatformStatus;
  reason: string;
  source: string;
  eventId?: string;
};

export type LifecycleSubscription = {
  id: string;
  organizationId: string | null;
  stripeSubscriptionId: string;
  stripeCustomerId: string | null;
  productSku: ProductSku;
  planTier: "professional" | "business";
  billingCycle: "monthly" | "annual";
  status: SubscriptionPlatformStatus;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  graceStartedAt: string | null;
  /** @deprecated Commercial seat capacity removed — always null for new records. */
  seatLimit: number | null;
  /** @deprecated Commercial property capacity removed — always null for new records. */
  propertyLimit: number | null;
  /** Stripe subscription item id for module base Price (qty 1). */
  stripeBaseItemId: string | null;
  /** Stripe subscription item id for Additional Unit Capacity Price (omitted when blocks=0). */
  stripeAdditionalCapacityItemId: string | null;
  /** Declared / reconciled managed unit count. */
  managedUnitCount: number | null;
  /** Authorized Additional Unit Capacity blocks. */
  authorizedAdditionalBlocks: number | null;
  /** Authorized unit capacity ceiling = 500 × (1 + blocks). */
  authorizedUnitCapacity: number | null;
  /** Questionnaire / acquisition declared units (not the billing source of truth). */
  declaredUnitCount: number | null;
  /** Next-period Additional Unit Capacity blocks (Stripe qty after authorize/decrease). */
  pendingAdditionalBlocks: number | null;
  /** Next-period authorized capacity ceiling. */
  pendingAuthorizedUnitCapacity: number | null;
  /** Last successful capacity authorization timestamp. */
  lastCapacityAuthorizedAt: string | null;
  /** Acquisition quote id when provisioned via unit-volume Checkout. */
  quoteId: string | null;
  trialEndsAt: string | null;
  pendingPlanTier: "professional" | "business" | null;
  lastInvoiceStatus: string | null;
  scaRequired: boolean;
  emailsSent: string[];
  audit: LifecycleAuditEntry[];
  paymentHistory: Array<{
    at: string;
    kind: "paid" | "failed" | "refunded" | "action_required";
    amountCents?: number;
    note: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export function isSubscriptionPlatformStatus(value: string): value is SubscriptionPlatformStatus {
  return (SUBSCRIPTION_PLATFORM_STATUSES as readonly string[]).includes(value);
}

export function mapStripeSubscriptionStatus(
  stripeStatus: string | null | undefined
): SubscriptionPlatformStatus {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "unpaid":
      return "unpaid";
    case "incomplete":
    case "incomplete_expired":
      return "incomplete";
    case "trialing":
      return "trialing";
    case "paused":
      return "canceled";
    default:
      return "pending";
  }
}

export function graceEndsAt(graceStartedAt: string): string {
  const start = Date.parse(graceStartedAt);
  return new Date(start + PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export function isWithinGracePeriod(
  graceStartedAt: string | null,
  nowMs: number = Date.now()
): boolean {
  if (!graceStartedAt) return false;
  return nowMs < Date.parse(graceEndsAt(graceStartedAt));
}

export function daysIntoGrace(
  graceStartedAt: string | null,
  nowMs: number = Date.now()
): number | null {
  if (!graceStartedAt) return null;
  const days = Math.floor((nowMs - Date.parse(graceStartedAt)) / (24 * 60 * 60 * 1000));
  return Math.max(0, days);
}

/**
 * Module / Mission Control access — billing & setup remain reachable separately.
 */
export function hasLifecycleModuleAccess(
  sub: Pick<LifecycleSubscription, "status" | "graceStartedAt" | "cancelAtPeriodEnd">,
  nowMs: number = Date.now()
): boolean {
  if (sub.status === "active" || sub.status === "trialing") {
    return true;
  }
  if (sub.status === "past_due" && isWithinGracePeriod(sub.graceStartedAt, nowMs)) {
    return true;
  }
  return false;
}

export function customerLifecyclePhase(
  sub: Pick<
    LifecycleSubscription,
    "status" | "graceStartedAt" | "audit" | "cancelAtPeriodEnd"
  >,
  nowMs: number = Date.now()
): CustomerLifecyclePhase {
  if (sub.status === "incomplete" || sub.status === "pending") {
    return "pending";
  }
  if (sub.status === "canceled") {
    return "canceled";
  }
  if (sub.status === "expired" || sub.status === "unpaid") {
    return "expired";
  }
  if (sub.status === "dispute_hold") {
    return "past_due";
  }
  if (sub.status === "past_due") {
    return isWithinGracePeriod(sub.graceStartedAt, nowMs) ? "grace" : "past_due";
  }
  const last = sub.audit[sub.audit.length - 1];
  if (
    sub.status === "active" &&
    last?.reason === "reactivated" &&
    Date.parse(last.at) > nowMs - 24 * 60 * 60 * 1000
  ) {
    return "reactivated";
  }
  return "active";
}

export function transitionLifecycle(
  sub: LifecycleSubscription,
  to: SubscriptionPlatformStatus,
  reason: string,
  source: string,
  eventId?: string
): LifecycleSubscription {
  const entry: LifecycleAuditEntry = {
    at: new Date().toISOString(),
    from: sub.status,
    to,
    reason,
    source,
    ...(eventId ? { eventId } : {})
  };
  return {
    ...sub,
    status: to,
    updatedAt: entry.at,
    audit: [...sub.audit, entry]
  };
}

export function customerStatusCopy(phase: CustomerLifecyclePhase): {
  title: string;
  detail: string;
  requiredAction: string | null;
} {
  switch (phase) {
    case "pending":
      return {
        title: "Setting up billing",
        detail: "Your subscription is being confirmed. This usually finishes in a moment.",
        requiredAction: null
      };
    case "active":
      return {
        title: "Active",
        detail: "Your subscription is in good standing. Renewals are automatic.",
        requiredAction: null
      };
    case "reactivated":
      return {
        title: "Restored",
        detail: "Your subscription is active again. Welcome back.",
        requiredAction: null
      };
    case "grace":
      return {
        title: "Payment needs attention",
        detail:
          "We could not collect your latest payment. Your workspace stays available for a short grace period while we retry.",
        requiredAction: "Update your payment method to avoid interruption."
      };
    case "past_due":
      return {
        title: "Access paused",
        detail:
          "Payment was not received during the grace period. Your data is safe. Restore payment to reopen your workspace.",
        requiredAction: "Restore your subscription to continue."
      };
    case "canceled":
      return {
        title: "Canceled",
        detail: "Your subscription is canceled. Access ends at the close of the current billing period when applicable.",
        requiredAction: "Reactivate anytime to restore access."
      };
    case "expired":
      return {
        title: "Ended",
        detail: "Your subscription has ended. Your data is retained. Reactivate to return to Mission Control.",
        requiredAction: "Reactivate your plan to continue."
      };
  }
}

export function dunningEmailKindForDay(
  day: number
): "payment_failed" | "grace_warning" | "subscription_canceled" | null {
  if (day === 0) return "payment_failed";
  if (day === 3 || day === 6) return "grace_warning";
  if (day >= 7) return "subscription_canceled";
  return null;
}

/**
 * Commercial seat/property caps removed (unit-volume capacity model).
 * Kept as a no-op helper so lifecycle callers stop writing capacity meters.
 */
export function limitsForPlanTier(_tier: "professional" | "business"): {
  seatLimit: null;
  propertyLimit: null;
} {
  void _tier;
  return { seatLimit: null, propertyLimit: null };
}

export function isSelfServeLifecycleSku(sku: string): sku is "mpa_property_manager" {
  return sku === "mpa_property_manager";
}
