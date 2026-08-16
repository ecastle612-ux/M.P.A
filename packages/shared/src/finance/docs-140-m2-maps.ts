/** docs/140 M2 mapping tables. SQL `finance_m2_*` functions are authoritative for execution. */

export const DOCS_140_M2_MIGRATION_VERSION = "20260816020000";

export const DOCS_146_CURRENCY_PROVENANCE_MIGRATION_DEFAULT = "migration_default_usd";
export const DOCS_146_CURRENCY_PROVENANCE_SOURCE = "source";

export const JULY_IMMUTABLE_TABLES = [
  "rent_charges",
  "payments",
  "vendor_invoices",
  "vendor_payments",
  "billing_ledger_entries",
  "financial_activity",
  "expenses",
  "owner_statements",
  "payment_receipts",
  "payment_customers"
] as const;

const STRIPE_METADATA_KEYS = [
  "stripe_payment_intent_id",
  "payment_intent",
  "stripe_checkout_session_id",
  "checkout_session_id",
  "stripe_charge_id"
] as const;

export function mapJulyChargeType(chargeType: string): "rent" | "one_time" {
  if (chargeType === "monthly_rent") {
    return "rent";
  }
  if (chargeType === "custom" || chargeType === "other" || chargeType === "security_deposit") {
    return "one_time";
  }
  throw new Error(`unsupported_charge_type:${chargeType}`);
}

export function mapJulyChargeStatus(
  status: string,
  amountPaid: number
): "paid" | "partially_paid" | "open" | "void" {
  if (status === "paid") {
    return "paid";
  }
  if (status === "partial") {
    return "partially_paid";
  }
  if (status === "overdue") {
    return amountPaid > 0 ? "partially_paid" : "open";
  }
  throw new Error(`unsupported_charge_status:${status}`);
}

export function julyMetadataHasStripeIdentity(metadata: Record<string, unknown> | null | undefined): boolean {
  if (!metadata) {
    return false;
  }
  return STRIPE_METADATA_KEYS.some((key) => {
    const value = metadata[key];
    return typeof value === "string" && value.trim().length > 0;
  });
}

export function mapJulyPaymentMethod(
  method: string,
  metadata?: Record<string, unknown> | null
): "manual_other" | "manual_check" {
  if (julyMetadataHasStripeIdentity(metadata)) {
    throw new Error("unexpected_stripe_source");
  }
  if (method === "manual" || method === "card") {
    return "manual_other";
  }
  if (method === "check") {
    return "manual_check";
  }
  throw new Error(`unsupported_payment_method:${method}`);
}

export function mapJulyLeaseStatus(status: string): "draft" | "active" | "ended" {
  if (status === "draft") {
    return "draft";
  }
  if (status === "active") {
    return "active";
  }
  if (status === "expired" || status === "terminated" || status === "ended") {
    return "ended";
  }
  throw new Error(`unsupported_lease_status:${status}`);
}

export function isUsableStripeCustomerId(value: string | null | undefined): boolean {
  return Boolean(value && /^cus_[A-Za-z0-9]+$/.test(value));
}

export function ledgerIdempotencyKey(
  kind: "charge" | "payment" | "allocation" | "vendor_invoice" | "vendor_payment",
  sourceId: string,
  relatedId?: string
): string {
  if (kind === "allocation") {
    return `july-allocation:${sourceId}:${relatedId}`;
  }
  if (kind === "vendor_invoice") {
    return `july-vendor-invoice:${sourceId}`;
  }
  if (kind === "vendor_payment") {
    return `july-vendor-payment:${sourceId}`;
  }
  return `july-${kind}:${sourceId}`;
}

export function normalizeJulyCurrency(value: string | null | undefined): "USD" {
  if (value == null || value.trim() === "") {
    return "USD";
  }
  if (value.toUpperCase() === "USD") {
    return "USD";
  }
  throw new Error(`unsupported_currency:${value}`);
}

export function julyCurrencyProvenance(columnExists: boolean): "source" | "migration_default_usd" {
  return columnExists ? DOCS_146_CURRENCY_PROVENANCE_SOURCE : DOCS_146_CURRENCY_PROVENANCE_MIGRATION_DEFAULT;
}

export function mapLegacyUnitLabel(label: string | null | undefined, unitNumber: string | null | undefined): string {
  const mapped = (label ?? "").trim() || (unitNumber ?? "").trim();
  if (!mapped) {
    throw new Error("missing_unit_label");
  }
  return mapped;
}

export function mapLegacyUnitStatus(occupancy: string | null | undefined): "occupied" | "available" {
  if (occupancy === "occupied") {
    return "occupied";
  }
  if (occupancy === "vacant_ready" || occupancy === "vacant") {
    return "available";
  }
  throw new Error(`unsupported_legacy_unit_occupancy:${occupancy ?? ""}`);
}
