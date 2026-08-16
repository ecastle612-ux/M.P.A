import { describe, expect, it } from "vitest";
import {
  DOCS_146_CURRENCY_PROVENANCE_MIGRATION_DEFAULT,
  DOCS_146_CURRENCY_PROVENANCE_SOURCE,
  isUsableStripeCustomerId,
  julyCurrencyProvenance,
  julyMetadataHasStripeIdentity,
  ledgerIdempotencyKey,
  mapJulyChargeStatus,
  mapJulyChargeType,
  mapJulyLeaseStatus,
  mapJulyPaymentMethod,
  mapLegacyUnitLabel,
  mapLegacyUnitStatus,
  normalizeJulyCurrency
} from "./docs-140-m2-maps";

describe("docs/140 M2 mapping tables", () => {
  it("maps certified July charge types without inventing deposit/escrow", () => {
    expect(mapJulyChargeType("monthly_rent")).toBe("rent");
    expect(mapJulyChargeType("custom")).toBe("one_time");
    expect(mapJulyChargeType("other")).toBe("one_time");
    expect(mapJulyChargeType("security_deposit")).toBe("one_time");
    expect(() => mapJulyChargeType("late_fee")).toThrow("unsupported_charge_type");
  });

  it("maps statuses from paid balance, not late_status", () => {
    expect(mapJulyChargeStatus("paid", 100)).toBe("paid");
    expect(mapJulyChargeStatus("partial", 50)).toBe("partially_paid");
    expect(mapJulyChargeStatus("overdue", 0)).toBe("open");
    expect(mapJulyChargeStatus("overdue", 10)).toBe("partially_paid");
    expect(() => mapJulyChargeStatus("draft", 0)).toThrow("unsupported_charge_status");
  });

  it("maps payment methods without fabricating Stripe execution", () => {
    expect(mapJulyPaymentMethod("manual")).toBe("manual_other");
    expect(mapJulyPaymentMethod("check")).toBe("manual_check");
    expect(mapJulyPaymentMethod("card", { provider: "manual" })).toBe("manual_other");
    expect(() => mapJulyPaymentMethod("card", { stripe_payment_intent_id: "pi_x" })).toThrow(
      "unexpected_stripe_source"
    );
    expect(() => mapJulyPaymentMethod("ach")).toThrow("unsupported_payment_method");
  });

  it("maps lease statuses into the canonical check", () => {
    expect(mapJulyLeaseStatus("active")).toBe("active");
    expect(mapJulyLeaseStatus("expired")).toBe("ended");
    expect(mapJulyLeaseStatus("terminated")).toBe("ended");
    expect(() => mapJulyLeaseStatus("mystery")).toThrow("unsupported_lease_status");
  });

  it("accepts only real-shaped Stripe customer ids for metadata mapping", () => {
    expect(isUsableStripeCustomerId("cus_FIXTURE01")).toBe(true);
    expect(isUsableStripeCustomerId("not-a-customer")).toBe(false);
    expect(isUsableStripeCustomerId("")).toBe(false);
    expect(julyMetadataHasStripeIdentity({ checkout_session_id: "cs_x" })).toBe(true);
  });

  it("builds deterministic ledger idempotency keys", () => {
    expect(ledgerIdempotencyKey("charge", "c1")).toBe("july-charge:c1");
    expect(ledgerIdempotencyKey("allocation", "p1", "c1")).toBe("july-allocation:p1:c1");
    expect(ledgerIdempotencyKey("vendor_invoice", "v1")).toBe("july-vendor-invoice:v1");
  });

  it("defaults missing July currency to USD and fails closed on explicit non-USD", () => {
    expect(normalizeJulyCurrency(null)).toBe("USD");
    expect(normalizeJulyCurrency("")).toBe("USD");
    expect(normalizeJulyCurrency("usd")).toBe("USD");
    expect(julyCurrencyProvenance(false)).toBe(DOCS_146_CURRENCY_PROVENANCE_MIGRATION_DEFAULT);
    expect(julyCurrencyProvenance(true)).toBe(DOCS_146_CURRENCY_PROVENANCE_SOURCE);
    expect(() => normalizeJulyCurrency("EUR")).toThrow("unsupported_currency:EUR");
  });

  it("maps proven legacy unit labels and occupancy without inventing placeholders", () => {
    expect(mapLegacyUnitLabel("101", "003")).toBe("101");
    expect(mapLegacyUnitLabel("  ", "003")).toBe("003");
    expect(mapLegacyUnitStatus("occupied")).toBe("occupied");
    expect(mapLegacyUnitStatus("vacant_ready")).toBe("available");
    expect(mapLegacyUnitStatus("vacant")).toBe("available");
    expect(() => mapLegacyUnitLabel(" ", "")).toThrow("missing_unit_label");
    expect(() => mapLegacyUnitStatus("mystery")).toThrow("unsupported_legacy_unit_occupancy");
  });
});
