import { describe, expect, it } from "vitest";
import {
  buildCommercialQuote,
  createAcquisitionSnapshot,
  isCommercialQuoteExpired,
  resolveCheckoutCancelRecovery,
  validateAcquisitionAnswers
} from "@mpa/shared";
import {
  clearAcquisitionSessionStoreForTests,
  getAcquisitionByQuoteId,
  rememberAcquisitionRecord
} from "../commerce/acquisition-session-store";

async function storeQuote(input: {
  operationalNeed: "property_resident_leasing" | "facility_maintenance" | "both";
  managedUnits: number;
  billingInterval?: "monthly" | "annual";
}) {
  const validated = validateAcquisitionAnswers({
    managedUnits: input.managedUnits,
    operationalNeed: input.operationalNeed,
    billingInterval: input.billingInterval ?? "monthly"
  });
  if (!validated.ok) {
    throw new Error(validated.reason);
  }
  const quote = buildCommercialQuote({ answers: validated.answers });
  const snapshot = createAcquisitionSnapshot(quote);
  await rememberAcquisitionRecord({ quote, snapshot, answers: validated.answers });
  return { quote, snapshot };
}

describe("checkout cancel recovery (unit-volume quote)", () => {
  it("rebuilds FO Confirm Plan retry from stored quote id", async () => {
    clearAcquisitionSessionStoreForTests();
    const { quote, snapshot } = await storeQuote({
      operationalNeed: "facility_maintenance",
      managedUnits: 500
    });
    const record = await getAcquisitionByQuoteId(quote.quote_id);
    expect(record).not.toBeNull();
    const recovery = resolveCheckoutCancelRecovery({
      quote: {
        quoteId: quote.quote_id,
        productSku: quote.module,
        billingCycle: quote.billing_interval,
        snapshotId: snapshot.snapshot_id,
        managedUnits: record!.answers.managedUnits,
        expired: isCommercialQuoteExpired(quote)
      }
    });
    expect(quote.module).toBe("mpa_facility_operations");
    expect(recovery.retryHref).toContain(`quote=${quote.quote_id}`);
    expect(recovery.retryHref).toContain("intent=mpa_facility_operations");
    expect(recovery.pricingHref).toBe("/pricing?intent=mpa_facility_operations");
  });

  it("rebuilds Complete Confirm Plan retry from stored quote id", async () => {
    clearAcquisitionSessionStoreForTests();
    const { quote, snapshot } = await storeQuote({
      operationalNeed: "both",
      managedUnits: 1000,
      billingInterval: "annual"
    });
    const recovery = resolveCheckoutCancelRecovery({
      quote: {
        quoteId: quote.quote_id,
        productSku: quote.module,
        billingCycle: quote.billing_interval,
        snapshotId: snapshot.snapshot_id,
        managedUnits: 1000,
        expired: false
      }
    });
    expect(quote.module).toBe("mpa_complete_platform");
    expect(recovery.retryHref).toContain("intent=mpa_complete_platform");
    expect(recovery.retryHref).toContain("cycle=annual");
    expect(recovery.retryHref).not.toContain("mpa_property_manager");
  });

  it("rebuilds PM Confirm Plan retry from stored quote id", async () => {
    clearAcquisitionSessionStoreForTests();
    const { quote, snapshot } = await storeQuote({
      operationalNeed: "property_resident_leasing",
      managedUnits: 500
    });
    const recovery = resolveCheckoutCancelRecovery({
      quote: {
        quoteId: quote.quote_id,
        productSku: quote.module,
        billingCycle: quote.billing_interval,
        snapshotId: snapshot.snapshot_id,
        managedUnits: 500,
        expired: false
      }
    });
    expect(quote.module).toBe("mpa_property_manager");
    expect(recovery.retryHref).toContain("intent=mpa_property_manager");
    expect(recovery.retryHref).toContain(`quote=${quote.quote_id}`);
  });

  it("does not force PM pricing when quote id is unknown", () => {
    clearAcquisitionSessionStoreForTests();
    const recovery = resolveCheckoutCancelRecovery({});
    expect(recovery.pricingHref).toBe("/pricing");
    expect(recovery.retryHref).toBe("/get-started");
  });
});
