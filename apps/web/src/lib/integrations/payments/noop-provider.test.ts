import { describe, expect, it } from "vitest";
import { noopPaymentProvider } from "./noop-provider";
import { stripePaymentProvider } from "./stripe-provider";
import { getPaymentProvider, resolveDefaultPaymentProviderId } from "./registry";
import { friendlyPaymentError, mapProviderFailureToCode } from "../../billing/contracts";

describe("PaymentProvider registry", () => {
  it("defaults to noop without env", () => {
    const previous = process.env["PAYMENT_PROVIDER"];
    delete process.env["PAYMENT_PROVIDER"];
    expect(resolveDefaultPaymentProviderId()).toBe("noop");
    expect(getPaymentProvider().id).toBe("noop");
    if (previous) process.env["PAYMENT_PROVIDER"] = previous;
  });

  it("resolves stripe provider", () => {
    expect(getPaymentProvider("stripe").id).toBe("stripe");
  });
});

describe("noop payment provider", () => {
  it("creates customer and payment attempt without network", async () => {
    const customer = await noopPaymentProvider.createCustomer({
      organizationId: "org",
      tenantId: "11111111-1111-1111-1111-111111111111"
    });
    expect(customer.externalCustomerId).toContain("noop-cus");

    const method = await noopPaymentProvider.attachPaymentMethod({
      externalCustomerId: customer.externalCustomerId,
      externalPaymentMethodId: "pm_card_test"
    });
    expect(method.last4).toBe("4242");

    const attempt = await noopPaymentProvider.createPaymentAttempt({
      organizationId: "org",
      attemptId: "att",
      attemptNumber: "PA-1",
      externalCustomerId: customer.externalCustomerId,
      externalPaymentMethodId: method.externalMethodId,
      amountCents: 150000,
      currency: "usd"
    });
    expect(attempt.externalAttemptId).toContain("noop-pi");

    const events = await noopPaymentProvider.parseWebhook(
      { id: "evt-1", type: "succeeded", externalAttemptId: attempt.externalAttemptId },
      {}
    );
    expect(events[0]?.type).toBe("succeeded");
  });
});

describe("stripe payment provider sandbox", () => {
  it("creates sandbox refs without secret key", async () => {
    const previous = process.env["STRIPE_SECRET_KEY"];
    delete process.env["STRIPE_SECRET_KEY"];
    process.env["STRIPE_MODE"] = "sandbox";

    const customer = await stripePaymentProvider.createCustomer({
      organizationId: "org",
      tenantId: "22222222-2222-2222-2222-222222222222"
    });
    expect(customer.externalCustomerId).toContain("cus_sandbox");

    const attempt = await stripePaymentProvider.createPaymentAttempt({
      organizationId: "org",
      attemptId: "att",
      attemptNumber: "PA-2",
      externalCustomerId: customer.externalCustomerId,
      amountCents: 10000,
      currency: "usd"
    });
    expect(attempt.externalAttemptId).toContain("pi_sandbox");

    if (previous) process.env["STRIPE_SECRET_KEY"] = previous;
  });

  it("rejects invalid webhook signatures when secret set", async () => {
    process.env["STRIPE_WEBHOOK_SECRET"] = "whsec_test";
    process.env["STRIPE_MODE"] = "sandbox";
    await expect(
      stripePaymentProvider.parseWebhook({ type: "payment_intent.succeeded" }, { "x-mpa-raw-body": "{}" })
    ).rejects.toThrow(/signature/i);
    delete process.env["STRIPE_WEBHOOK_SECRET"];
  });
});

describe("friendly payment errors", () => {
  it("maps known codes", () => {
    expect(friendlyPaymentError("insufficient_funds")).toMatch(/Insufficient/i);
    expect(mapProviderFailureToCode("NSF returned")).toBe("insufficient_funds");
  });
});
