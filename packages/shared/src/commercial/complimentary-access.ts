import { isProductSku, type ProductSku } from "./skus";

/** Entitlement sources (ADR-022 / ADM-001). */
export const ENTITLEMENT_SOURCES = [
  "STRIPE_SUBSCRIPTION",
  "MASTER_ADMIN_GRANT",
  "LEGACY_ADMIN_ASSIGN"
] as const;

export type EntitlementSource = (typeof ENTITLEMENT_SOURCES)[number];

export const MASTER_ADMIN_GRANT_STATUSES = ["active", "revoked", "expired"] as const;
export type MasterAdminGrantStatus = (typeof MASTER_ADMIN_GRANT_STATUSES)[number];

export const MASTER_ADMIN_GRANT_AUDIT_EVENTS = {
  CREATED: "MASTER_ADMIN_GRANT_CREATED",
  EXTENDED: "MASTER_ADMIN_GRANT_EXTENDED",
  REVOKED: "MASTER_ADMIN_GRANT_REVOKED",
  EXPIRED: "MASTER_ADMIN_GRANT_EXPIRED"
} as const;

export type MasterAdminGrantAuditEvent =
  (typeof MASTER_ADMIN_GRANT_AUDIT_EVENTS)[keyof typeof MASTER_ADMIN_GRANT_AUDIT_EVENTS];

/** Stripe-backed statuses that win over complimentary grants. */
export const STRIPE_ENTITLEMENT_STATUSES = ["active", "trialing", "past_due"] as const;

export type StripeEntitlementStatus = (typeof STRIPE_ENTITLEMENT_STATUSES)[number];

export function isStripeEntitlementStatus(status: string | null | undefined): boolean {
  return (
    typeof status === "string" &&
    (STRIPE_ENTITLEMENT_STATUSES as readonly string[]).includes(status)
  );
}

export function isMasterAdminGrantStatus(value: unknown): value is MasterAdminGrantStatus {
  return (
    typeof value === "string" &&
    (MASTER_ADMIN_GRANT_STATUSES as readonly string[]).includes(value)
  );
}

export type ComplimentaryGrantWindow = {
  grant_status: string;
  start_date: string;
  expiration_date: string | null;
};

/** True when grant_status is active and the time window includes `now`. */
export function isActiveComplimentaryGrant(
  grant: ComplimentaryGrantWindow,
  now: Date = new Date()
): boolean {
  if (grant.grant_status !== "active") return false;
  const start = Date.parse(grant.start_date);
  if (Number.isNaN(start) || start > now.getTime()) return false;
  if (grant.expiration_date == null) return true;
  const exp = Date.parse(grant.expiration_date);
  if (Number.isNaN(exp)) return false;
  return exp > now.getTime();
}

/** Active row that has passed expiration_date (lazy expire candidate). */
export function isComplimentaryGrantPastExpiration(
  grant: ComplimentaryGrantWindow,
  now: Date = new Date()
): boolean {
  if (grant.grant_status !== "active") return false;
  if (grant.expiration_date == null) return false;
  const exp = Date.parse(grant.expiration_date);
  if (Number.isNaN(exp)) return false;
  return exp <= now.getTime();
}

export type SubscriptionEntitlementInput = {
  sku_code: string | null | undefined;
  status: string | null | undefined;
  stripe_subscription_id?: string | null;
};

export type GrantEntitlementInput = ComplimentaryGrantWindow & {
  plan_granted: string;
};

export type ResolvedCommercialEntitlement = {
  sku: ProductSku | null;
  source: EntitlementSource | null;
};

/**
 * ADR-022 precedence:
 * 1. Active Stripe-backed subscription
 * 2. Active Master Admin grant
 * 3. Legacy non-Stripe admin SKU assign (coexistence; not complimentary grant)
 * 4. Fail closed (null)
 */
export function resolveCommercialEntitlement(input: {
  subscription?: SubscriptionEntitlementInput | null;
  grant?: GrantEntitlementInput | null;
  now?: Date;
}): ResolvedCommercialEntitlement {
  const now = input.now ?? new Date();
  const sub = input.subscription;
  if (
    sub &&
    typeof sub.stripe_subscription_id === "string" &&
    sub.stripe_subscription_id.length > 0 &&
    isStripeEntitlementStatus(sub.status) &&
    isProductSku(sub.sku_code)
  ) {
    return { sku: sub.sku_code, source: "STRIPE_SUBSCRIPTION" };
  }

  const grant = input.grant;
  if (grant && isActiveComplimentaryGrant(grant, now) && isProductSku(grant.plan_granted)) {
    return { sku: grant.plan_granted, source: "MASTER_ADMIN_GRANT" };
  }

  if (
    sub &&
    (!sub.stripe_subscription_id || sub.stripe_subscription_id.length === 0) &&
    sub.status &&
    sub.status !== "canceled" &&
    sub.status !== "expired" &&
    isProductSku(sub.sku_code)
  ) {
    return { sku: sub.sku_code, source: "LEGACY_ADMIN_ASSIGN" };
  }

  return { sku: null, source: null };
}
