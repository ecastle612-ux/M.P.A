/**
 * MA-4 — Subscriptions + Capacity pure helpers (read-only).
 * Reuses @mpa/shared unit-volume / unit-capacity / entitlements / SKUs.
 * Never invents anomalies from missing data.
 */

import {
  additionalUnitBlocks,
  authorizedUnitCapacity,
  entitlementsForSku,
  evaluateUnitCapacityState,
  isProductSku,
  isUnitVolumeTrialEligible,
  planStripeCapacityAction,
  resolveAuthorizedUnitCapacity,
  toSkuLabel,
  UNIT_BLOCK_SIZE,
  UNIT_VOLUME_TRIAL_DAYS,
  type ProductSku
} from "@mpa/shared";
import { scrubUnknown } from "../observability/scrub";
import type { HealthTone } from "./command-center-metrics";
import {
  buildModuleStatesForOrg,
  capacityUtilizationPercent
} from "./ma2-org-detail";

// Re-export module builders used by detail UI (avoid duplicating MA-2 logic).
export { buildModuleStatesForOrg, capacityUtilizationPercent };

export type Ma4HealthTone = "healthy" | "attention" | "unknown";

export type Ma4Anomaly = {
  code: string;
  severity: "attention" | "info";
  reason: string;
};

export type Ma4EntitlementModule = {
  sku: ProductSku;
  label: string;
  entitled: boolean;
  state: "active" | "inactive" | "not_included" | "legacy";
  commercialState: "current_product" | "included" | "not_included";
  entitlementCount: number;
};

export type Ma4SubscriptionRow = {
  organizationId: string;
  organizationName: string;
  skuCode: string | null;
  skuLabel: string | null;
  billingCycle: string | null;
  status: string | null;
  trialActive: boolean;
  trialEndsAt: string | null;
  trialEligible: boolean | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  managedUnitCount: number | null;
  authorizedUnitCapacity: number | null;
  authorizedAdditionalBlocks: number | null;
  pendingAuthorizedUnitCapacity: number | null;
  pendingAdditionalBlocks: number | null;
  declaredUnitCount: number | null;
  utilizationPercent: number | null;
  entitlementState: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeBaseItemId: string | null;
  stripeAdditionalCapacityItemId: string | null;
  lastCapacityAuthorizedAt: string | null;
  updatedAt: string | null;
  quoteId: string | null;
  planTier: string | null;
  scaRequired: boolean | null;
  graceStartedAt: string | null;
  health: Ma4HealthTone;
  anomalies: Ma4Anomaly[];
  capacityStatus: string | null;
};

export type Ma4SubscriptionFilters = {
  q?: string;
  sku?: string;
  billingCycle?: string;
  status?: string;
  trial?: "active" | "inactive" | "eligible" | "ineligible";
  cancelAtPeriodEnd?: "yes" | "no";
  health?: Ma4HealthTone;
  organizationId?: string;
  page: number;
  pageSize: number;
};

export type Ma4Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

export function parseSubscriptionFilters(
  params: URLSearchParams | Record<string, string | string[] | undefined>
): Ma4SubscriptionFilters {
  const get = (key: string): string | undefined => {
    if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
    const raw = params[key];
    return Array.isArray(raw) ? raw[0] : raw;
  };

  const pageRaw = Number(get("page") ?? "1");
  const sizeRaw = Number(get("pageSize") ?? String(DEFAULT_PAGE_SIZE));
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const pageSize = Number.isFinite(sizeRaw)
    ? Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(sizeRaw)))
    : DEFAULT_PAGE_SIZE;

  const out: Ma4SubscriptionFilters = { page, pageSize };
  const q = get("q")?.trim();
  const sku = get("sku")?.trim() || get("product")?.trim();
  const billingCycle = get("billingCycle")?.trim() || get("interval")?.trim();
  const status = get("status")?.trim();
  const trial = get("trial")?.trim();
  const cancel = get("cancelAtPeriodEnd")?.trim() || get("cancellation")?.trim();
  const health = get("health")?.trim();
  const organizationId = get("organizationId")?.trim();

  if (q) out.q = q;
  if (sku) out.sku = sku;
  if (billingCycle === "monthly" || billingCycle === "annual") out.billingCycle = billingCycle;
  if (status) out.status = status;
  if (trial === "active" || trial === "inactive" || trial === "eligible" || trial === "ineligible") {
    out.trial = trial;
  }
  if (cancel === "yes" || cancel === "no" || cancel === "true" || cancel === "false") {
    out.cancelAtPeriodEnd = cancel === "yes" || cancel === "true" ? "yes" : "no";
  }
  if (health === "healthy" || health === "attention" || health === "unknown") out.health = health;
  if (organizationId) out.organizationId = organizationId;
  return out;
}

export function paginationMeta(total: number, page: number, pageSize: number): Ma4Pagination {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return {
    page: safePage,
    pageSize,
    total,
    totalPages,
    hasMore: safePage < totalPages
  };
}

export function mapEntitlementModules(
  sku: string | null,
  subscriptionStatus: string | null
): Ma4EntitlementModule[] {
  const productSku = sku && isProductSku(sku) ? sku : null;
  const modules = buildModuleStatesForOrg(productSku);
  const inactive =
    subscriptionStatus === "canceled" ||
    subscriptionStatus === "expired" ||
    subscriptionStatus === "unpaid";

  return modules.map((m) => {
    let state: Ma4EntitlementModule["state"] = "not_included";
    if (m.enabled) {
      state = inactive ? "inactive" : "active";
    }
    return {
      sku: m.sku,
      label: m.label,
      entitled: m.enabled,
      state,
      commercialState: m.commercialState,
      entitlementCount: m.entitlementCount
    };
  });
}

export function legacyPlanTierNote(planTier: string | null): string | null {
  if (!planTier) return null;
  if (planTier === "business" || planTier === "professional") {
    return `Legacy plan_tier "${planTier}" — historical SaaS tier label, not a current product SKU.`;
  }
  return null;
}

export type Ma4RawSubscription = {
  organization_id: string;
  organization_name?: string | null;
  sku_code: string | null;
  status: string | null;
  billing_cycle: string | null;
  cancel_at_period_end: boolean | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
  managed_unit_count: number | null;
  authorized_additional_blocks: number | null;
  authorized_unit_capacity: number | null;
  declared_unit_count: number | null;
  pending_additional_blocks: number | null;
  pending_authorized_unit_capacity: number | null;
  last_capacity_authorized_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_base_item_id: string | null;
  stripe_additional_capacity_item_id: string | null;
  quote_id: string | null;
  plan_tier: string | null;
  sca_required: boolean | null;
  grace_started_at: string | null;
  updated_at: string | null;
  created_at?: string | null;
};

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

/**
 * Reconciliation — only emit anomalies when supporting fields are present.
 * Missing data → unknown health, not invented attention.
 */
export function reconcileCommercialState(row: Ma4RawSubscription): {
  health: Ma4HealthTone;
  anomalies: Ma4Anomaly[];
  capacityStatus: string | null;
} {
  const anomalies: Ma4Anomaly[] = [];
  const managed = num(row.managed_unit_count);
  const authorizedCap = num(row.authorized_unit_capacity);
  const blocks = num(row.authorized_additional_blocks);
  const pendingBlocks = num(row.pending_additional_blocks);
  const pendingCap = num(row.pending_authorized_unit_capacity);
  const status = str(row.status);
  const sku = str(row.sku_code);

  const hasCapacitySignal =
    managed != null || authorizedCap != null || blocks != null || pendingBlocks != null;

  let capacityStatus: string | null = null;
  if (managed != null && (authorizedCap != null || blocks != null) && sku && isProductSku(sku)) {
    const snapshot = evaluateUnitCapacityState({
      module: sku,
      billingInterval: row.billing_cycle === "annual" ? "annual" : "monthly",
      actualUnits: managed,
      authorizedUnitCapacity: authorizedCap,
      authorizedAdditionalBlocks: blocks,
      pendingAdditionalBlocks: pendingBlocks,
      pendingAuthorizedUnitCapacity: pendingCap,
      declaredUnits: num(row.declared_unit_count),
      nextBillingPeriodEnd: row.current_period_end,
      trialActive: status === "trialing"
    });
    capacityStatus = snapshot.capacityStatus;

    if (snapshot.capacityStatus === "requires_authorization") {
      anomalies.push({
        code: "units_exceed_capacity",
        severity: "attention",
        reason: `Managed units (${snapshot.actualUnits}) exceed authorized capacity (${snapshot.authorizedCapacity}).`
      });
    }
    if (snapshot.capacityStatus === "sync_required") {
      anomalies.push({
        code: "stale_capacity_state",
        severity: "attention",
        reason: `Authorized blocks (${snapshot.additionalBlocks}) exceed blocks required for current units (${snapshot.requiredBlocks}) — sync/decrease pending.`
      });
    }
    if (snapshot.capacityStatus === "authorized_pending_period") {
      anomalies.push({
        code: "pending_capacity_change",
        severity: "info",
        reason: `Next-period capacity change pending (blocks ${snapshot.pendingAdditionalBlocks ?? "—"} → capacity ${snapshot.pendingAuthorizedCapacity ?? "—"}).`
      });
    }
  } else if (managed != null && authorizedCap != null && authorizedCap > 0 && managed > authorizedCap) {
    anomalies.push({
      code: "units_exceed_capacity",
      severity: "attention",
      reason: `Managed units (${managed}) exceed authorized capacity (${authorizedCap}).`
    });
  }

  if (authorizedCap != null && blocks != null) {
    const expected = authorizedUnitCapacity(blocks);
    if (authorizedCap !== expected) {
      anomalies.push({
        code: "capacity_blocks_mismatch",
        severity: "attention",
        reason: `Authorized capacity (${authorizedCap}) does not match blocks math (${blocks} → ${expected}).`
      });
    }
  }

  if (pendingBlocks != null && pendingCap != null) {
    const expectedPending = authorizedUnitCapacity(pendingBlocks);
    if (pendingCap !== expectedPending) {
      anomalies.push({
        code: "next_period_capacity_mismatch",
        severity: "attention",
        reason: `Next-period capacity (${pendingCap}) does not match pending blocks math (${pendingBlocks} → ${expectedPending}).`
      });
    }
  }

  const effectiveBlocks =
    blocks != null
      ? blocks
      : authorizedCap != null
        ? Math.max(0, Math.ceil(authorizedCap / UNIT_BLOCK_SIZE) - 1)
        : managed != null
          ? additionalUnitBlocks(managed)
          : null;

  if (effectiveBlocks != null) {
    const action = planStripeCapacityAction({
      additionalCapacityItemId: row.stripe_additional_capacity_item_id,
      currentBlocks: effectiveBlocks,
      nextBlocks: pendingBlocks != null ? pendingBlocks : effectiveBlocks,
      unitBlockPriceEnvKey: "STRIPE_PRICE_ADDITIONAL_UNIT_CAPACITY_MONTHLY"
    });
    if (effectiveBlocks > 0 && !row.stripe_additional_capacity_item_id) {
      anomalies.push({
        code: "missing_capacity_item",
        severity: "attention",
        reason: `Additional blocks (${effectiveBlocks}) are authorized but Stripe additional capacity item id is missing.`
      });
    }
    if (
      effectiveBlocks === 0 &&
      (pendingBlocks == null || pendingBlocks === 0) &&
      Boolean(row.stripe_additional_capacity_item_id)
    ) {
      anomalies.push({
        code: "unexpected_capacity_item",
        severity: "attention",
        reason:
          "Stripe additional capacity item exists while authorized additional blocks are zero."
      });
    }
    // Keep planStripeCapacityAction referenced for parity with domain (noop vs expected).
    void action;
  }

  if (
    status &&
    ["active", "trialing", "past_due", "unpaid", "incomplete"].includes(status) &&
    !row.stripe_subscription_id
  ) {
    anomalies.push({
      code: "missing_stripe_linkage",
      severity: "attention",
      reason: `Subscription status is "${status}" but Stripe subscription id is missing.`
    });
  }

  if (status === "trialing" && row.trial_ends_at) {
    const end = Date.parse(row.trial_ends_at);
    if (Number.isFinite(end) && end < Date.now()) {
      anomalies.push({
        code: "lifecycle_trial_mismatch",
        severity: "attention",
        reason: "Status is trialing but trial_ends_at is in the past."
      });
    }
  }

  if (
    status &&
    ["canceled", "expired"].includes(status) &&
    sku &&
    isProductSku(sku)
  ) {
    // Entitlements from SKU dictionary still resolve; flag inactive commercial vs entitled modules.
    anomalies.push({
      code: "subscription_entitlement_inactive",
      severity: "info",
      reason: `Subscription is ${status}; SKU entitlements for ${toSkuLabel(sku)} are inactive.`
    });
  }

  const legacy = legacyPlanTierNote(row.plan_tier);
  if (legacy) {
    anomalies.push({
      code: "legacy_plan_tier",
      severity: "info",
      reason: legacy
    });
  }

  const attention = anomalies.some((a) => a.severity === "attention");
  if (attention) return { health: "attention", anomalies, capacityStatus };
  if (!hasCapacitySignal && !status && !sku) {
    return { health: "unknown", anomalies, capacityStatus };
  }
  if (!hasCapacitySignal && status == null) {
    return { health: "unknown", anomalies, capacityStatus };
  }
  return { health: "healthy", anomalies, capacityStatus };
}

export function mapSubscriptionRow(row: Ma4RawSubscription): Ma4SubscriptionRow {
  const sku = str(row.sku_code);
  const managed = num(row.managed_unit_count);
  const authorizedCap =
    num(row.authorized_unit_capacity) ??
    (num(row.authorized_additional_blocks) != null
      ? resolveAuthorizedUnitCapacity({
          authorizedAdditionalBlocks: num(row.authorized_additional_blocks)
        })
      : null);
  const util = capacityUtilizationPercent(managed, authorizedCap);
  const { health, anomalies, capacityStatus } = reconcileCommercialState(row);
  const status = str(row.status);
  const trialActive = status === "trialing";
  const trialEligible =
    managed != null ? isUnitVolumeTrialEligible(managed) : null;

  let entitlementState = "unknown";
  if (sku && isProductSku(sku)) {
    if (status === "canceled" || status === "expired" || status === "unpaid") {
      entitlementState = "inactive";
    } else if (status === "active" || status === "trialing" || status === "past_due") {
      entitlementState = "active";
    } else if (status === "pending" || status === "incomplete") {
      entitlementState = "pending";
    } else {
      entitlementState = "mapped";
    }
  } else if (sku) {
    entitlementState = "legacy_or_unknown_sku";
  }

  return {
    organizationId: row.organization_id,
    organizationName: row.organization_name?.trim() || "Organization",
    skuCode: sku,
    skuLabel: sku && isProductSku(sku) ? toSkuLabel(sku) : sku,
    billingCycle: str(row.billing_cycle),
    status,
    trialActive,
    trialEndsAt: str(row.trial_ends_at),
    trialEligible,
    currentPeriodEnd: str(row.current_period_end),
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    managedUnitCount: managed,
    authorizedUnitCapacity: authorizedCap,
    authorizedAdditionalBlocks: num(row.authorized_additional_blocks),
    pendingAuthorizedUnitCapacity: num(row.pending_authorized_unit_capacity),
    pendingAdditionalBlocks: num(row.pending_additional_blocks),
    declaredUnitCount: num(row.declared_unit_count),
    utilizationPercent: util.value,
    entitlementState,
    stripeCustomerId: str(row.stripe_customer_id),
    stripeSubscriptionId: str(row.stripe_subscription_id),
    stripeBaseItemId: str(row.stripe_base_item_id),
    stripeAdditionalCapacityItemId: str(row.stripe_additional_capacity_item_id),
    lastCapacityAuthorizedAt: str(row.last_capacity_authorized_at),
    updatedAt: str(row.updated_at),
    quoteId: str(row.quote_id),
    planTier: str(row.plan_tier),
    scaRequired: row.sca_required == null ? null : Boolean(row.sca_required),
    graceStartedAt: str(row.grace_started_at),
    health,
    anomalies,
    capacityStatus
  };
}

export function filterSubscriptionRows(
  rows: Ma4SubscriptionRow[],
  filters: Ma4SubscriptionFilters
): Ma4SubscriptionRow[] {
  const q = filters.q?.toLowerCase();
  return rows.filter((row) => {
    if (filters.organizationId && row.organizationId !== filters.organizationId) return false;
    if (filters.sku && row.skuCode !== filters.sku) return false;
    if (filters.billingCycle && row.billingCycle !== filters.billingCycle) return false;
    if (filters.status && row.status !== filters.status) return false;
    if (filters.cancelAtPeriodEnd === "yes" && !row.cancelAtPeriodEnd) return false;
    if (filters.cancelAtPeriodEnd === "no" && row.cancelAtPeriodEnd) return false;
    if (filters.health && row.health !== filters.health) return false;
    if (filters.trial === "active" && !row.trialActive) return false;
    if (filters.trial === "inactive" && row.trialActive) return false;
    if (filters.trial === "eligible" && row.trialEligible !== true) return false;
    if (filters.trial === "ineligible" && row.trialEligible !== false) return false;
    if (q) {
      const hay = `${row.organizationId} ${row.organizationName} ${row.skuCode ?? ""} ${row.stripeCustomerId ?? ""} ${row.stripeSubscriptionId ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function paginateRows<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = (Math.max(1, page) - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function buildSubscriptionDetail(row: Ma4SubscriptionRow) {
  const modules = mapEntitlementModules(row.skuCode, row.status);
  const entitlementKeys =
    row.skuCode && isProductSku(row.skuCode) ? entitlementsForSku(row.skuCode) : [];

  const requiredBlocks =
    row.managedUnitCount != null ? additionalUnitBlocks(row.managedUnitCount) : null;
  const includedCapacity = UNIT_BLOCK_SIZE;
  const nextPeriodBlocks =
    row.pendingAdditionalBlocks != null
      ? row.pendingAdditionalBlocks
      : row.authorizedAdditionalBlocks;
  const nextPeriodCapacity =
    row.pendingAuthorizedUnitCapacity != null
      ? row.pendingAuthorizedUnitCapacity
      : row.authorizedUnitCapacity;

  let capacityChange: "increase" | "decrease" | "none" | "unknown" = "unknown";
  if (row.authorizedAdditionalBlocks != null && row.pendingAdditionalBlocks != null) {
    if (row.pendingAdditionalBlocks > row.authorizedAdditionalBlocks) capacityChange = "increase";
    else if (row.pendingAdditionalBlocks < row.authorizedAdditionalBlocks) capacityChange = "decrease";
    else capacityChange = "none";
  } else if (row.pendingAdditionalBlocks == null && row.authorizedAdditionalBlocks != null) {
    capacityChange = "none";
  }

  const trial = {
    active: row.trialActive,
    endsAt: row.trialEndsAt,
    eligible: row.trialEligible,
    eligibilityBasis:
      row.managedUnitCount == null
        ? "Managed units unavailable — eligibility not computed"
        : row.trialEligible
          ? `Managed units (${row.managedUnitCount}) ≤ ${UNIT_BLOCK_SIZE} — ${UNIT_VOLUME_TRIAL_DAYS}-day trial eligible`
          : `Managed units (${row.managedUnitCount}) > ${UNIT_BLOCK_SIZE} — trial not eligible`,
    trialDays: UNIT_VOLUME_TRIAL_DAYS,
    paymentMethodNote: row.scaRequired
      ? "SCA / payment method action may be required (sca_required=true)"
      : "Payment method requirement not flagged on durable row",
    currentUnits: row.managedUnitCount
  };

  const stripe = {
    customerId: row.stripeCustomerId,
    subscriptionId: row.stripeSubscriptionId,
    baseItemId: row.stripeBaseItemId,
    additionalCapacityItemId: row.stripeAdditionalCapacityItemId,
    priceIdsNote:
      "Authoritative Stripe Price IDs are not stored on organization_subscriptions; item IDs are shown when present.",
    linked: Boolean(row.stripeCustomerId || row.stripeSubscriptionId),
    lifecycleStatus: row.status,
    lastCapacityAuthorizedAt: row.lastCapacityAuthorizedAt
  };

  return {
    commercial: row,
    entitlements: {
      modules,
      keys: entitlementKeys,
      state: row.entitlementState,
      legacyPlanTier: legacyPlanTierNote(row.planTier)
    },
    capacity: {
      managedUnitCount: row.managedUnitCount,
      includedCapacity,
      additionalBlocks: row.authorizedAdditionalBlocks,
      totalCapacity: row.authorizedUnitCapacity,
      utilizationPercent: row.utilizationPercent,
      requiredBlocks,
      nextPeriodBlocks,
      nextPeriodCapacity,
      capacityChange,
      capacityStatus: row.capacityStatus,
      declaredUnitCount: row.declaredUnitCount,
      lastCapacityAuthorizedAt: row.lastCapacityAuthorizedAt
    },
    trial,
    stripe,
    health: row.health,
    anomalies: row.anomalies
  };
}

export type Ma4SubscriptionDetail = ReturnType<typeof buildSubscriptionDetail>;

export function scrubStripePayload(payload: unknown): Record<string, unknown> {
  const scrubbed = scrubUnknown(payload ?? {});
  if (scrubbed && typeof scrubbed === "object" && !Array.isArray(scrubbed)) {
    return scrubbed as Record<string, unknown>;
  }
  return {};
}

export function healthToneToBadge(health: Ma4HealthTone): HealthTone {
  if (health === "healthy") return "ok";
  if (health === "attention") return "warn";
  return "unknown";
}

export const MA4_SELECT = [
  "organization_id",
  "sku_code",
  "status",
  "billing_cycle",
  "cancel_at_period_end",
  "current_period_end",
  "trial_ends_at",
  "managed_unit_count",
  "authorized_additional_blocks",
  "authorized_unit_capacity",
  "declared_unit_count",
  "pending_additional_blocks",
  "pending_authorized_unit_capacity",
  "last_capacity_authorized_at",
  "stripe_customer_id",
  "stripe_subscription_id",
  "stripe_base_item_id",
  "stripe_additional_capacity_item_id",
  "quote_id",
  "plan_tier",
  "sca_required",
  "grace_started_at",
  "updated_at",
  "created_at"
].join(", ");
