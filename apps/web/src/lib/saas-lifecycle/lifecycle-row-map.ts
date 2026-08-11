/**
 * STAB-005 — map organization_subscriptions rows ↔ LifecycleSubscription.
 * Single mapping for durable reads/writes (no duplicate billing schema).
 */

import {
  isBillingCycle,
  isProductSku,
  isSubscriptionPlatformStatus,
  type LifecycleSubscription,
  type ProductSku
} from "@mpa/shared";

export type OrganizationSubscriptionRow = {
  organization_id: string;
  sku_code: string;
  status: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  plan_tier: string | null;
  billing_cycle: string | null;
  cancel_at_period_end: boolean | null;
  current_period_end: string | null;
  grace_started_at: string | null;
  seat_limit: number | null;
  property_limit: number | null;
  stripe_base_item_id: string | null;
  stripe_additional_capacity_item_id: string | null;
  managed_unit_count: number | null;
  authorized_additional_blocks: number | null;
  authorized_unit_capacity: number | null;
  declared_unit_count: number | null;
  pending_additional_blocks: number | null;
  pending_authorized_unit_capacity: number | null;
  last_capacity_authorized_at: string | null;
  quote_id: string | null;
  trial_ends_at: string | null;
  pending_plan_tier: string | null;
  sca_required: boolean | null;
  lifecycle_audit: LifecycleSubscription["audit"] | null;
  lifecycle_emails_sent: string[] | null;
  payment_history: LifecycleSubscription["paymentHistory"] | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export const ORGANIZATION_SUBSCRIPTION_SELECT = [
  "organization_id",
  "sku_code",
  "status",
  "stripe_subscription_id",
  "stripe_customer_id",
  "plan_tier",
  "billing_cycle",
  "cancel_at_period_end",
  "current_period_end",
  "grace_started_at",
  "seat_limit",
  "property_limit",
  "stripe_base_item_id",
  "stripe_additional_capacity_item_id",
  "managed_unit_count",
  "authorized_additional_blocks",
  "authorized_unit_capacity",
  "declared_unit_count",
  "pending_additional_blocks",
  "pending_authorized_unit_capacity",
  "last_capacity_authorized_at",
  "quote_id",
  "trial_ends_at",
  "pending_plan_tier",
  "sca_required",
  "lifecycle_audit",
  "lifecycle_emails_sent",
  "payment_history",
  "created_at",
  "updated_at"
].join(", ");

export function lifecycleFromOrganizationSubscriptionRow(
  row: OrganizationSubscriptionRow
): LifecycleSubscription | null {
  if (!row.stripe_subscription_id || !row.organization_id) {
    return null;
  }
  const productSku: ProductSku = isProductSku(row.sku_code)
    ? row.sku_code
    : "mpa_property_manager";
  const status = isSubscriptionPlatformStatus(row.status) ? row.status : "pending";
  const planTier =
    row.plan_tier === "business" || row.plan_tier === "professional"
      ? row.plan_tier
      : "professional";
  const billingCycle = isBillingCycle(row.billing_cycle) ? row.billing_cycle : "monthly";
  const now = new Date().toISOString();

  return {
    id: `orgsub_${row.organization_id}`,
    organizationId: row.organization_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    stripeCustomerId: row.stripe_customer_id,
    productSku,
    planTier,
    billingCycle,
    status,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    currentPeriodEnd: row.current_period_end,
    graceStartedAt: row.grace_started_at,
    seatLimit: row.seat_limit,
    propertyLimit: row.property_limit,
    stripeBaseItemId: row.stripe_base_item_id,
    stripeAdditionalCapacityItemId: row.stripe_additional_capacity_item_id,
    managedUnitCount: row.managed_unit_count,
    authorizedAdditionalBlocks: row.authorized_additional_blocks,
    authorizedUnitCapacity: row.authorized_unit_capacity,
    declaredUnitCount: row.declared_unit_count,
    pendingAdditionalBlocks: row.pending_additional_blocks,
    pendingAuthorizedUnitCapacity: row.pending_authorized_unit_capacity,
    lastCapacityAuthorizedAt: row.last_capacity_authorized_at,
    quoteId: row.quote_id,
    trialEndsAt: row.trial_ends_at,
    pendingPlanTier:
      row.pending_plan_tier === "business" || row.pending_plan_tier === "professional"
        ? row.pending_plan_tier
        : null,
    lastInvoiceStatus: null,
    scaRequired: Boolean(row.sca_required),
    emailsSent: Array.isArray(row.lifecycle_emails_sent) ? row.lifecycle_emails_sent : [],
    audit: Array.isArray(row.lifecycle_audit) ? row.lifecycle_audit : [],
    paymentHistory: Array.isArray(row.payment_history) ? row.payment_history : [],
    createdAt: row.created_at ?? now,
    updatedAt: row.updated_at ?? now
  };
}

export function organizationSubscriptionUpsertPayload(sub: LifecycleSubscription) {
  if (!sub.organizationId) {
    return null;
  }
  return {
    organization_id: sub.organizationId,
    sku_code: sub.productSku,
    status: sub.status === "pending" ? "incomplete" : sub.status,
    stripe_subscription_id: sub.stripeSubscriptionId,
    stripe_customer_id: sub.stripeCustomerId,
    plan_tier: sub.planTier,
    billing_cycle: sub.billingCycle,
    cancel_at_period_end: sub.cancelAtPeriodEnd,
    current_period_end: sub.currentPeriodEnd,
    grace_started_at: sub.graceStartedAt,
    seat_limit: sub.seatLimit,
    property_limit: sub.propertyLimit,
    stripe_base_item_id: sub.stripeBaseItemId,
    stripe_additional_capacity_item_id: sub.stripeAdditionalCapacityItemId,
    managed_unit_count: sub.managedUnitCount,
    authorized_additional_blocks: sub.authorizedAdditionalBlocks,
    authorized_unit_capacity: sub.authorizedUnitCapacity,
    declared_unit_count: sub.declaredUnitCount,
    pending_additional_blocks: sub.pendingAdditionalBlocks,
    pending_authorized_unit_capacity: sub.pendingAuthorizedUnitCapacity,
    last_capacity_authorized_at: sub.lastCapacityAuthorizedAt,
    quote_id: sub.quoteId,
    trial_ends_at: sub.trialEndsAt,
    pending_plan_tier: sub.pendingPlanTier,
    sca_required: sub.scaRequired,
    lifecycle_audit: sub.audit,
    lifecycle_emails_sent: sub.emailsSent,
    payment_history: sub.paymentHistory,
    updated_at: sub.updatedAt
  };
}
