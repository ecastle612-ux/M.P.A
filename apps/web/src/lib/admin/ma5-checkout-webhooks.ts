/**
 * MA-5 — Checkout / Provisioning / Webhook Health pure helpers (read-only).
 * Reuses shared provisioning + unit-volume metadata keys. No mutations. No replay.
 */

import {
  isProductSku,
  isProvisioningComplete,
  isTerminalFailure,
  toSkuLabel,
  UNIT_VOLUME_METADATA_KEYS,
  type ProductSku,
  type ProvisioningJob,
  type ProvisioningStatus
} from "@mpa/shared";
import type { StoredSaasPurchase, StoredSaasWebhookEvent } from "../saas-stripe/purchase-store";
import { scrubUnknown } from "../observability/scrub";
import { parseErrorTimeRange } from "./platform-errors";
import type { HealthTone } from "./command-center-metrics";

export type Ma5DiagTone = "healthy" | "attention" | "failed" | "unknown";

export type Ma5Anomaly = {
  code: string;
  severity: "attention" | "failed" | "info";
  reason: string;
  href?: string;
};

export type Ma5LifecycleStage = {
  id: string;
  label: string;
  status: Ma5DiagTone;
  detail: string;
  at: string | null;
  identifier: string | null;
};

export type Ma5CheckoutRow = {
  id: string;
  stripeCheckoutSessionId: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string | null;
  organizationName: string | null;
  customerEmail: string | null;
  productSku: string | null;
  productLabel: string | null;
  billingCycle: string | null;
  quotedUnits: number | null;
  quotedAmountLabel: string | null;
  additionalBlocks: number | null;
  authorizedCapacity: number | null;
  trialEligible: boolean | null;
  trialDays: number | null;
  quoteId: string | null;
  checkoutStatus: string;
  paymentState: string;
  provisioned: boolean;
  provisioningCheckpoint: string | null;
  provisioningError: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  resultingSubscriptionLinked: boolean;
  checkoutHealth: Ma5DiagTone;
  provisioningHealth: Ma5DiagTone;
  anomalies: Ma5Anomaly[];
  lastEventAt: string;
  source: "database" | "memory";
};

export type Ma5WebhookRow = {
  id: string;
  provider: "stripe" | "signwell";
  eventId: string;
  eventType: string;
  receivedAt: string;
  processedAt: string | null;
  processingStatus: "processed" | "unresolved" | "unknown";
  organizationId: string | null;
  organizationName: string | null;
  subscriptionId: string | null;
  checkoutSessionId: string | null;
  objectId: string | null;
  failureReason: string | null;
  idempotencyNote: string;
  health: Ma5DiagTone;
  correlationId: string | null;
  safeMetadata: Record<string, unknown>;
};

export type Ma5CheckoutFilters = {
  q?: string;
  sku?: string;
  billingCycle?: string;
  checkoutStatus?: string;
  paymentStatus?: string;
  provisioningStatus?: string;
  trial?: "eligible" | "ineligible" | "active_unknown";
  range?: string;
  since?: string;
  health?: Ma5DiagTone;
  organizationId?: string;
  page: number;
  pageSize: number;
  rangeLabel?: string;
};

export type Ma5WebhookFilters = {
  q?: string;
  provider?: "stripe" | "signwell" | "all";
  status?: "processed" | "unresolved" | "all";
  eventType?: string;
  organizationId?: string;
  range?: string;
  since?: string;
  health?: Ma5DiagTone;
  page: number;
  pageSize: number;
  rangeLabel?: string;
};

export type Ma5Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

const DEFAULT_PAGE = 50;
const MAX_PAGE = 100;

function getParam(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const raw = params[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

function parsePage(params: URLSearchParams | Record<string, string | string[] | undefined>) {
  const pageRaw = Number(getParam(params, "page") ?? "1");
  const sizeRaw = Number(getParam(params, "pageSize") ?? String(DEFAULT_PAGE));
  return {
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1,
    pageSize: Number.isFinite(sizeRaw)
      ? Math.min(MAX_PAGE, Math.max(1, Math.floor(sizeRaw)))
      : DEFAULT_PAGE
  };
}

export function parseCheckoutFilters(
  params: URLSearchParams | Record<string, string | string[] | undefined>
): Ma5CheckoutFilters {
  const { page, pageSize } = parsePage(params);
  const range = getParam(params, "range") ?? "7d";
  const parsedRange = parseErrorTimeRange(range);
  const out: Ma5CheckoutFilters = { page, pageSize, range, rangeLabel: parsedRange.label };
  if (parsedRange.since) out.since = parsedRange.since;

  const q = getParam(params, "q")?.trim();
  const sku = getParam(params, "sku")?.trim() || getParam(params, "product")?.trim();
  const billingCycle = getParam(params, "billingCycle")?.trim();
  const checkoutStatus = getParam(params, "checkoutStatus")?.trim();
  const paymentStatus = getParam(params, "paymentStatus")?.trim();
  const provisioningStatus = getParam(params, "provisioningStatus")?.trim();
  const trial = getParam(params, "trial")?.trim();
  const health = getParam(params, "health")?.trim();
  const organizationId = getParam(params, "organizationId")?.trim();

  if (q) out.q = q;
  if (sku) out.sku = sku;
  if (billingCycle === "monthly" || billingCycle === "annual") out.billingCycle = billingCycle;
  if (checkoutStatus) out.checkoutStatus = checkoutStatus;
  if (paymentStatus) out.paymentStatus = paymentStatus;
  if (provisioningStatus) out.provisioningStatus = provisioningStatus;
  if (trial === "eligible" || trial === "ineligible" || trial === "active_unknown") out.trial = trial;
  if (health === "healthy" || health === "attention" || health === "failed" || health === "unknown") {
    out.health = health;
  }
  if (organizationId) out.organizationId = organizationId;
  return out;
}

export function parseWebhookFilters(
  params: URLSearchParams | Record<string, string | string[] | undefined>
): Ma5WebhookFilters {
  const { page, pageSize } = parsePage(params);
  const range = getParam(params, "range") ?? "7d";
  const parsedRange = parseErrorTimeRange(range);
  const out: Ma5WebhookFilters = {
    page,
    pageSize,
    range,
    rangeLabel: parsedRange.label,
    provider: "all",
    status: "all"
  };
  if (parsedRange.since) out.since = parsedRange.since;

  const q = getParam(params, "q")?.trim();
  const provider = getParam(params, "provider")?.trim();
  const status = getParam(params, "status")?.trim();
  const eventType = getParam(params, "eventType")?.trim();
  const organizationId = getParam(params, "organizationId")?.trim();
  const health = getParam(params, "health")?.trim();

  if (q) out.q = q;
  if (provider === "stripe" || provider === "signwell" || provider === "all") out.provider = provider;
  if (status === "processed" || status === "unresolved" || status === "all") out.status = status;
  if (eventType) out.eventType = eventType;
  if (organizationId) out.organizationId = organizationId;
  if (health === "healthy" || health === "attention" || health === "failed" || health === "unknown") {
    out.health = health;
  }
  return out;
}

export function paginationMeta(total: number, page: number, pageSize: number): Ma5Pagination {
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

export function paginateRows<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = (Math.max(1, page) - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function scrubMa5Payload(payload: unknown): Record<string, unknown> {
  const scrubbed = scrubUnknown(payload ?? {});
  if (scrubbed && typeof scrubbed === "object" && !Array.isArray(scrubbed)) {
    return scrubbed as Record<string, unknown>;
  }
  return {};
}

function metaNum(meta: Record<string, string>, key: string): number | null {
  const raw = meta[key];
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function metaBool(meta: Record<string, string>, key: string): boolean | null {
  const raw = meta[key];
  if (raw == null) return null;
  if (raw === "true") return true;
  if (raw === "false") return false;
  return null;
}

function paymentStateFromCheckout(status: string): string {
  if (status === "checkout_completed") return "paid_or_completed";
  if (status === "payment_failed") return "failed";
  if (status === "checkout_expired") return "expired";
  if (status === "checkout_canceled") return "canceled";
  if (status === "checkout_created") return "pending";
  return "unknown";
}

function checkoutTone(status: string): Ma5DiagTone {
  if (status === "checkout_completed") return "healthy";
  if (status === "payment_failed") return "failed";
  if (status === "checkout_expired" || status === "checkout_canceled") return "attention";
  if (status === "checkout_created") return "attention";
  return "unknown";
}

function provisioningTone(checkpoint: string | null, lastError: string | null): Ma5DiagTone {
  if (!checkpoint) return "unknown";
  if (isTerminalFailure(checkpoint as ProvisioningStatus) || checkpoint === "compensating") {
    return "failed";
  }
  if (isProvisioningComplete(checkpoint as ProvisioningStatus)) return "healthy";
  if (lastError) return "attention";
  return "attention";
}

export function reconcileCheckoutAnomalies(input: {
  purchase: StoredSaasPurchase;
  job: ProvisioningJob | null;
  subscriptionExists: boolean | null;
  entitlementOk: boolean | null;
}): Ma5Anomaly[] {
  const anomalies: Ma5Anomaly[] = [];
  const p = input.purchase;
  const meta = p.metadata ?? {};
  const quoteId = meta[UNIT_VOLUME_METADATA_KEYS.quoteId] ?? null;
  const managed = metaNum(meta, UNIT_VOLUME_METADATA_KEYS.managedUnits);
  const capacity = metaNum(meta, UNIT_VOLUME_METADATA_KEYS.authorizedCapacity);
  const blocks = metaNum(meta, UNIT_VOLUME_METADATA_KEYS.additionalBlocks);
  const trialEligible = metaBool(meta, UNIT_VOLUME_METADATA_KEYS.trialEligible);

  // Quoted amount is not stored on checkout row — do not invent a mismatch.
  if (!meta["mpa_quoted_amount_usd"] && !meta["amount_total"]) {
    // info only when completed — operators know amount lives on Stripe/quote memory
  }

  if (p.status === "checkout_completed" && !p.organizationId && !input.job?.organizationId) {
    anomalies.push({
      code: "missing_organization_after_payment",
      severity: "failed",
      reason: "Checkout completed but no organization id is linked on checkout or provisioning job.",
      href: `/admin/checkout/${encodeURIComponent(p.stripeCheckoutSessionId)}`
    });
  }

  if (p.status === "checkout_completed" && !p.provisioned && (!input.job || !isProvisioningComplete(input.job.checkpoint))) {
    anomalies.push({
      code: "provisioning_incomplete_after_checkout",
      severity: "attention",
      reason: "Checkout completed but provisioning is incomplete or missing.",
      href: `/admin/checkout/${encodeURIComponent(p.stripeCheckoutSessionId)}`
    });
  }

  if (input.job && isTerminalFailure(input.job.checkpoint)) {
    anomalies.push({
      code: "provisioning_failed",
      severity: "failed",
      reason: input.job.lastError
        ? `Provisioning ${input.job.checkpoint}: ${input.job.lastError}`
        : `Provisioning terminal failure: ${input.job.checkpoint}`,
      href: `/admin/checkout/${encodeURIComponent(p.stripeCheckoutSessionId)}`
    });
  }

  if (
    input.job &&
    isProvisioningComplete(input.job.checkpoint) &&
    !input.job.stripeSubscriptionId &&
    !p.stripeSubscriptionId
  ) {
    anomalies.push({
      code: "missing_subscription_after_provisioning",
      severity: "failed",
      reason: "Provisioning marked complete/ready but Stripe subscription id is missing.",
      href: `/admin/checkout/${encodeURIComponent(p.stripeCheckoutSessionId)}`
    });
  }

  if (input.subscriptionExists === false && (p.stripeSubscriptionId || input.job?.stripeSubscriptionId)) {
    anomalies.push({
      code: "subscription_row_missing",
      severity: "attention",
      reason: "Stripe subscription id present but durable organization_subscriptions row not found.",
      href: p.organizationId
        ? `/admin/subscriptions/${p.organizationId}`
        : `/admin/checkout/${encodeURIComponent(p.stripeCheckoutSessionId)}`
    });
  }

  if (input.entitlementOk === false) {
    anomalies.push({
      code: "missing_entitlement",
      severity: "attention",
      reason: "Provisioning reached entitled/ready but SKU entitlements could not be resolved for product.",
      href: `/admin/checkout/${encodeURIComponent(p.stripeCheckoutSessionId)}`
    });
  }

  if (trialEligible === true && managed != null && managed > 500) {
    anomalies.push({
      code: "trial_state_mismatch",
      severity: "attention",
      reason: `Metadata trial_eligible=true but managed units (${managed}) exceed 500.`,
      href: `/admin/checkout/${encodeURIComponent(p.stripeCheckoutSessionId)}`
    });
  }

  if (managed != null && capacity != null && blocks != null) {
    const expected = 500 * (1 + Math.max(0, Math.floor(blocks)));
    if (capacity !== expected) {
      anomalies.push({
        code: "capacity_mismatch",
        severity: "attention",
        reason: `Metadata capacity (${capacity}) does not match blocks math (${blocks} → ${expected}).`,
        href: `/admin/checkout/${encodeURIComponent(p.stripeCheckoutSessionId)}`
      });
    }
  }

  if (p.status === "checkout_completed" && !p.stripeSubscriptionId && !input.job?.stripeSubscriptionId) {
    anomalies.push({
      code: "missing_stripe_subscription",
      severity: "attention",
      reason: "Checkout completed without a Stripe subscription id on checkout or job.",
      href: `/admin/checkout/${encodeURIComponent(p.stripeCheckoutSessionId)}`
    });
  }

  // Price ID mismatch: only when both authoritative env key and metadata price id exist.
  const metaPrice = meta["mpa_price_id"] || meta["stripe_price_id"];
  const expectedPrice = meta["mpa_expected_price_id"];
  if (metaPrice && expectedPrice && metaPrice !== expectedPrice) {
    anomalies.push({
      code: "price_id_mismatch",
      severity: "attention",
      reason: `Checkout Price ID (${metaPrice}) differs from expected (${expectedPrice}).`,
      href: `/admin/checkout/${encodeURIComponent(p.stripeCheckoutSessionId)}`
    });
  }

  const quotedAmount = meta["mpa_quoted_amount_usd"];
  const checkoutAmount = meta["amount_total"] || meta["mpa_checkout_amount_usd"];
  if (quotedAmount && checkoutAmount && quotedAmount !== checkoutAmount) {
    anomalies.push({
      code: "quote_amount_mismatch",
      severity: "attention",
      reason: `Checkout amount (${checkoutAmount}) differs from quote amount (${quotedAmount}).`,
      href: `/admin/checkout/${encodeURIComponent(p.stripeCheckoutSessionId)}`
    });
  }

  void quoteId;
  return anomalies;
}

export function mapCheckoutRow(input: {
  purchase: StoredSaasPurchase;
  job: ProvisioningJob | null;
  organizationName: string | null;
  subscriptionExists: boolean | null;
  source: "database" | "memory";
}): Ma5CheckoutRow {
  const p = input.purchase;
  const meta = p.metadata ?? {};
  const sku = isProductSku(p.productSku) ? p.productSku : p.productSku;
  const entitlementOk =
    input.job &&
    (input.job.checkpoint === "entitled" ||
      input.job.checkpoint === "owner_pending" ||
      input.job.checkpoint === "owner_bound" ||
      input.job.checkpoint === "welcome_sent" ||
      input.job.checkpoint === "ready")
      ? isProductSku(p.productSku)
      : null;

  const anomalies = reconcileCheckoutAnomalies({
    purchase: p,
    job: input.job,
    subscriptionExists: input.subscriptionExists,
    entitlementOk
  });

  const checkoutHealth = anomalies.some((a) => a.severity === "failed" && a.code.includes("organization"))
    ? "failed"
    : checkoutTone(p.status);
  let provisioningHealth = provisioningTone(input.job?.checkpoint ?? null, input.job?.lastError ?? null);
  if (!input.job && p.status === "checkout_completed" && !p.provisioned) {
    provisioningHealth = "attention";
  }
  if (!input.job && p.status !== "checkout_completed") {
    provisioningHealth = "unknown";
  }

  const overallFailed = anomalies.some((a) => a.severity === "failed");
  const overallAttention = anomalies.some((a) => a.severity === "attention");

  return {
    id: p.stripeCheckoutSessionId,
    stripeCheckoutSessionId: p.stripeCheckoutSessionId,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    organizationId: p.organizationId ?? input.job?.organizationId ?? null,
    organizationName: input.organizationName,
    customerEmail: p.customerEmail,
    productSku: sku,
    productLabel: isProductSku(p.productSku) ? toSkuLabel(p.productSku as ProductSku) : sku,
    billingCycle: p.billingCycle,
    quotedUnits: metaNum(meta, UNIT_VOLUME_METADATA_KEYS.managedUnits),
    quotedAmountLabel:
      meta["mpa_quoted_amount_usd"] || meta["amount_total"]
        ? String(meta["mpa_quoted_amount_usd"] || meta["amount_total"])
        : null,
    additionalBlocks: metaNum(meta, UNIT_VOLUME_METADATA_KEYS.additionalBlocks),
    authorizedCapacity: metaNum(meta, UNIT_VOLUME_METADATA_KEYS.authorizedCapacity),
    trialEligible: metaBool(meta, UNIT_VOLUME_METADATA_KEYS.trialEligible),
    trialDays: metaNum(meta, UNIT_VOLUME_METADATA_KEYS.trialDays),
    quoteId: meta[UNIT_VOLUME_METADATA_KEYS.quoteId] ?? null,
    checkoutStatus: p.status,
    paymentState: paymentStateFromCheckout(p.status),
    provisioned: p.provisioned,
    provisioningCheckpoint: input.job?.checkpoint ?? null,
    provisioningError: input.job?.lastError ?? null,
    stripeCustomerId: p.stripeCustomerId ?? input.job?.stripeCustomerId ?? null,
    stripeSubscriptionId: p.stripeSubscriptionId ?? input.job?.stripeSubscriptionId ?? null,
    resultingSubscriptionLinked: Boolean(
      p.stripeSubscriptionId || input.job?.stripeSubscriptionId || input.subscriptionExists
    ),
    checkoutHealth: overallFailed
      ? "failed"
      : overallAttention && checkoutHealth === "healthy"
        ? "attention"
        : checkoutHealth,
    provisioningHealth,
    anomalies,
    lastEventAt: input.job?.updatedAt ?? p.updatedAt,
    source: input.source
  };
}

export function buildCheckoutLifecycle(row: Ma5CheckoutRow, job: ProvisioningJob | null): Ma5LifecycleStage[] {
  const stages: Ma5LifecycleStage[] = [
    {
      id: "questionnaire",
      label: "Questionnaire",
      status: "unknown",
      detail: "Acquisition questionnaire is process-memory only — not durable in Master Admin.",
      at: null,
      identifier: null
    },
    {
      id: "quote",
      label: "Quote",
      status: row.quoteId ? "healthy" : "unknown",
      detail: row.quoteId
        ? "Quote id present on checkout metadata."
        : "Quote id not persisted on this checkout row.",
      at: null,
      identifier: row.quoteId
    },
    {
      id: "confirm_plan",
      label: "Confirm Plan",
      status: "unknown",
      detail: "Confirm Plan view state is not durable — DATA UNAVAILABLE.",
      at: null,
      identifier: null
    },
    {
      id: "checkout",
      label: "Checkout",
      status: checkoutTone(row.checkoutStatus),
      detail: row.checkoutStatus,
      at: row.createdAt,
      identifier: row.stripeCheckoutSessionId
    },
    {
      id: "stripe",
      label: "Stripe",
      status: row.stripeCustomerId || row.stripeSubscriptionId ? "healthy" : row.checkoutStatus === "checkout_completed" ? "attention" : "unknown",
      detail: [
        row.stripeCustomerId ? `customer ${row.stripeCustomerId}` : null,
        row.stripeSubscriptionId ? `subscription ${row.stripeSubscriptionId}` : null
      ]
        .filter(Boolean)
        .join(" · ") || "Stripe ids not yet linked",
      at: row.updatedAt,
      identifier: row.stripeCheckoutSessionId
    },
    {
      id: "payment",
      label: "Payment",
      status:
        row.paymentState === "paid_or_completed"
          ? "healthy"
          : row.paymentState === "failed"
            ? "failed"
            : row.paymentState === "pending"
              ? "attention"
              : "unknown",
      detail: row.paymentState,
      at: row.updatedAt,
      identifier: null
    },
    {
      id: "provisioning",
      label: "Provisioning",
      status: provisioningTone(job?.checkpoint ?? row.provisioningCheckpoint, job?.lastError ?? row.provisioningError),
      detail: job?.checkpoint ?? row.provisioningCheckpoint ?? "No provisioning job",
      at: job?.updatedAt ?? null,
      identifier: job?.id ?? null
    },
    {
      id: "organization",
      label: "Organization",
      status: row.organizationId ? "healthy" : row.checkoutStatus === "checkout_completed" ? "failed" : "unknown",
      detail: row.organizationName ?? row.organizationId ?? "Not linked",
      at: job?.updatedAt ?? null,
      identifier: row.organizationId
    },
    {
      id: "subscription",
      label: "Subscription",
      status: row.resultingSubscriptionLinked
        ? "healthy"
        : row.provisioningCheckpoint === "ready" || row.provisioned
          ? "failed"
          : "unknown",
      detail: row.stripeSubscriptionId ?? "Not linked",
      at: null,
      identifier: row.stripeSubscriptionId
    },
    {
      id: "entitlement",
      label: "Entitlement",
      status:
        job &&
        (job.checkpoint === "entitled" ||
          job.checkpoint === "owner_pending" ||
          job.checkpoint === "owner_bound" ||
          job.checkpoint === "welcome_sent" ||
          job.checkpoint === "ready")
          ? row.productSku && isProductSku(row.productSku)
            ? "healthy"
            : "attention"
          : "unknown",
      detail: row.productLabel ?? "SKU entitlement dictionary (no separate entitlement store)",
      at: null,
      identifier: row.productSku
    }
  ];
  return stages;
}

export function filterCheckoutRows(rows: Ma5CheckoutRow[], filters: Ma5CheckoutFilters): Ma5CheckoutRow[] {
  const q = filters.q?.toLowerCase();
  return rows.filter((row) => {
    if (filters.since && row.createdAt < filters.since) return false;
    if (filters.organizationId && row.organizationId !== filters.organizationId) return false;
    if (filters.sku && row.productSku !== filters.sku) return false;
    if (filters.billingCycle && row.billingCycle !== filters.billingCycle) return false;
    if (filters.checkoutStatus && row.checkoutStatus !== filters.checkoutStatus) return false;
    if (filters.paymentStatus && row.paymentState !== filters.paymentStatus) return false;
    if (filters.provisioningStatus) {
      const cp = row.provisioningCheckpoint ?? "";
      if (filters.provisioningStatus === "missing" && row.provisioningCheckpoint) return false;
      if (filters.provisioningStatus !== "missing" && cp !== filters.provisioningStatus) return false;
    }
    if (filters.trial === "eligible" && row.trialEligible !== true) return false;
    if (filters.trial === "ineligible" && row.trialEligible !== false) return false;
    if (filters.health) {
      const tone =
        row.checkoutHealth === "failed" || row.provisioningHealth === "failed"
          ? "failed"
          : row.checkoutHealth === "attention" || row.provisioningHealth === "attention"
            ? "attention"
            : row.checkoutHealth === "unknown" && row.provisioningHealth === "unknown"
              ? "unknown"
              : "healthy";
      if (tone !== filters.health) return false;
    }
    if (q) {
      const hay = [
        row.stripeCheckoutSessionId,
        row.organizationId ?? "",
        row.organizationName ?? "",
        row.customerEmail ?? "",
        row.stripeCustomerId ?? "",
        row.stripeSubscriptionId ?? "",
        row.quoteId ?? ""
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function mapStripeWebhookRow(
  event: StoredSaasWebhookEvent,
  orgName: string | null = null,
  subscriptionId: string | null = null
): Ma5WebhookRow {
  const safe = scrubMa5Payload(event.payload);
  const processed = Boolean(event.processedAt);
  let health: Ma5DiagTone = processed ? "healthy" : "attention";
  if (event.eventType.toLowerCase().includes("fail")) health = "failed";

  return {
    id: event.stripeEventId,
    provider: "stripe",
    eventId: event.stripeEventId,
    eventType: event.eventType,
    receivedAt: event.createdAt,
    processedAt: event.processedAt,
    processingStatus: processed ? "processed" : "unresolved",
    organizationId: typeof safe["organization_id"] === "string" ? safe["organization_id"] : null,
    organizationName: orgName,
    subscriptionId,
    checkoutSessionId: event.checkoutSessionId,
    objectId: event.checkoutSessionId,
    failureReason: null,
    idempotencyNote: "Idempotent on stripe_event_id (unique). Duplicate processed events are skipped.",
    health,
    correlationId: typeof safe["id"] === "string" ? safe["id"] : event.stripeEventId,
    safeMetadata: safe
  };
}

export function mapSignWellWebhookRow(row: {
  id: string;
  event_id?: string | null;
  event_type: string;
  processed_at: string;
  organization_id: string | null;
  document_id: string | null;
  payload?: unknown;
  organizationName?: string | null;
}): Ma5WebhookRow {
  const safe = scrubMa5Payload(row.payload);
  const orgId = row.organization_id;
  let health: Ma5DiagTone = "healthy";
  // Unknown org when org id missing on a persisted delivery — attention, not invented failure.
  if (!orgId) health = "attention";

  return {
    id: row.id,
    provider: "signwell",
    eventId: row.event_id ?? row.id,
    eventType: row.event_type,
    receivedAt: row.processed_at,
    processedAt: row.processed_at,
    processingStatus: "processed",
    organizationId: orgId,
    organizationName: row.organizationName ?? null,
    subscriptionId: null,
    checkoutSessionId: null,
    objectId: row.document_id,
    failureReason: orgId
      ? null
      : "Organization not resolvable on this delivery (signature rejects are not persisted).",
    idempotencyNote: "Idempotent on (event_type, document_id, event_id).",
    health,
    correlationId: row.event_id ?? row.id,
    safeMetadata: safe
  };
}

export function filterWebhookRows(rows: Ma5WebhookRow[], filters: Ma5WebhookFilters): Ma5WebhookRow[] {
  const q = filters.q?.toLowerCase();
  return rows.filter((row) => {
    if (filters.since && row.receivedAt < filters.since) return false;
    if (filters.provider && filters.provider !== "all" && row.provider !== filters.provider) return false;
    if (filters.status === "processed" && row.processingStatus !== "processed") return false;
    if (filters.status === "unresolved" && row.processingStatus !== "unresolved") return false;
    if (filters.eventType && !row.eventType.toLowerCase().includes(filters.eventType.toLowerCase())) {
      return false;
    }
    if (filters.organizationId && row.organizationId !== filters.organizationId) return false;
    if (filters.health && row.health !== filters.health) return false;
    if (q) {
      const hay = [
        row.eventId,
        row.eventType,
        row.organizationId ?? "",
        row.organizationName ?? "",
        row.checkoutSessionId ?? "",
        row.subscriptionId ?? "",
        row.objectId ?? ""
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function detectDuplicateWebhookProcessing(rows: Ma5WebhookRow[]): Ma5Anomaly[] {
  const seen = new Map<string, number>();
  for (const r of rows) {
    const key = `${r.provider}:${r.eventId}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  const anomalies: Ma5Anomaly[] = [];
  for (const [key, count] of seen) {
    if (count > 1) {
      anomalies.push({
        code: "duplicate_webhook_processing",
        severity: "attention",
        reason: `Event ${key} appears ${count} times in the inspect sample.`,
        href: "/admin/webhooks"
      });
    }
  }
  return anomalies;
}

export function healthToneToBadge(tone: Ma5DiagTone): HealthTone {
  if (tone === "healthy") return "ok";
  if (tone === "attention") return "warn";
  if (tone === "failed") return "down";
  return "unknown";
}

export function diagLabel(tone: Ma5DiagTone): string {
  if (tone === "healthy") return "HEALTHY";
  if (tone === "attention") return "ATTENTION";
  if (tone === "failed") return "FAILED";
  return "UNKNOWN / DATA UNAVAILABLE";
}
