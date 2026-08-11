/**
 * Resolve organization-scoped lifecycle for commerce mutations.
 * Memory is a cache only — authoritative source is organization_subscriptions
 * when memory is cold. Never return a row belonging to another organization.
 */

import {
  isBillingCycle,
  isProductSku,
  isSubscriptionPlatformStatus,
  type LifecycleSubscription,
  type ProductSku
} from "@mpa/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getLifecycleByOrganizationId,
  saveLifecycleSubscription
} from "./lifecycle-store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

type OrganizationSubscriptionRow = {
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

function hydrateFromRow(row: OrganizationSubscriptionRow): LifecycleSubscription | null {
  if (!row.stripe_subscription_id) {
    return null;
  }
  if (row.organization_id == null) {
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

/**
 * Load lifecycle for an organization. Memory hit must belong to the same org.
 * On miss, hydrate from organization_subscriptions (organization-scoped).
 */
export async function resolveLifecycleForOrganization(
  organizationId: string,
  supabase?: Db | null
): Promise<LifecycleSubscription | null> {
  const memory = getLifecycleByOrganizationId(organizationId);
  if (memory) {
    if (memory.organizationId !== organizationId) {
      return null;
    }
    return memory;
  }

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("organization_subscriptions")
    .select(
      [
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
      ].join(", ")
    )
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as OrganizationSubscriptionRow;
  if (row.organization_id !== organizationId) {
    return null;
  }

  const hydrated = hydrateFromRow(row);
  if (!hydrated) {
    return null;
  }

  return saveLifecycleSubscription(hydrated);
}
