import { describe, expect, it } from "vitest";
import { resolveInvoiceSubscriptionId } from "./invoice-subscription";

describe("resolveInvoiceSubscriptionId", () => {
  it("reads top-level invoice.subscription string", () => {
    expect(
      resolveInvoiceSubscriptionId({
        subscription: "sub_top_level_1"
      })
    ).toBe("sub_top_level_1");
  });

  it("reads top-level expanded subscription object", () => {
    expect(
      resolveInvoiceSubscriptionId({
        subscription: { id: "sub_expanded_1", object: "subscription" }
      })
    ).toBe("sub_expanded_1");
  });

  it("reads nested parent.subscription_details.subscription", () => {
    expect(
      resolveInvoiceSubscriptionId({
        subscription: null,
        parent: {
          subscription_details: {
            subscription: "sub_1Ty47r8jGrZYUXDtQjOJGs14"
          }
        }
      })
    ).toBe("sub_1Ty47r8jGrZYUXDtQjOJGs14");
  });

  it("prefers top-level when both shapes are present", () => {
    expect(
      resolveInvoiceSubscriptionId({
        subscription: "sub_preferred",
        parent: {
          subscription_details: {
            subscription: "sub_nested"
          }
        }
      })
    ).toBe("sub_preferred");
  });

  it("returns null when subscription is missing", () => {
    expect(resolveInvoiceSubscriptionId({})).toBeNull();
    expect(resolveInvoiceSubscriptionId(null)).toBeNull();
    expect(resolveInvoiceSubscriptionId(undefined)).toBeNull();
  });

  it("returns null for malformed nested structures", () => {
    expect(
      resolveInvoiceSubscriptionId({
        parent: {
          subscription_details: {
            subscription: "not_a_sub"
          }
        }
      })
    ).toBeNull();
    expect(
      resolveInvoiceSubscriptionId({
        parent: {
          subscription_details: null
        }
      })
    ).toBeNull();
    expect(
      resolveInvoiceSubscriptionId({
        parent: "bad"
      })
    ).toBeNull();
    expect(
      resolveInvoiceSubscriptionId({
        subscription: 123
      })
    ).toBeNull();
  });
});
