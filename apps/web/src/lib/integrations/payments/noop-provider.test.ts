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

  it("refuses destination routing without STRIPE_SECRET_KEY (C1)", async () => {
    const previous = process.env["STRIPE_SECRET_KEY"];
    delete process.env["STRIPE_SECRET_KEY"];
    process.env["STRIPE_MODE"] = "sandbox";

    await expect(
      stripePaymentProvider.createPaymentAttempt({
        organizationId: "org",
        attemptId: "att-dest",
        attemptNumber: "PA-DEST",
        externalCustomerId: "cus_sandbox_x",
        amountCents: 20000,
        currency: "usd",
        useCheckout: true,
        destinationRouting: {
          settlementAccountId: "acct_settlement_test",
          applicationFeeAmountCents: 250,
          fundingMode: "destination",
          propertyId: "prop-1",
          paymentAttemptId: "att-dest"
        }
      })
    ).rejects.toThrow(/STRIPE_SECRET_KEY|transfer_data/);

    if (previous) process.env["STRIPE_SECRET_KEY"] = previous;
  });
});

describe("noop payment provider destination refusal", () => {
  it("rejects destinationRouting", async () => {
    await expect(
      noopPaymentProvider.createPaymentAttempt({
        organizationId: "org",
        attemptId: "att",
        attemptNumber: "PA-1",
        externalCustomerId: "noop-cus",
        amountCents: 1000,
        currency: "usd",
        destinationRouting: {
          settlementAccountId: "acct_x",
          applicationFeeAmountCents: 0,
          fundingMode: "destination",
          paymentAttemptId: "att"
        }
      })
    ).rejects.toThrow(/noop|transfer_data/i);
  });
});

describe("stripe webhook event mapping", () => {
  it("ignores charge.succeeded to prevent duplicate settlement", async () => {
    const previousSecret = process.env["STRIPE_WEBHOOK_SECRET"];
    delete process.env["STRIPE_WEBHOOK_SECRET"];
    process.env["STRIPE_MODE"] = "sandbox";
    const events = await stripePaymentProvider.parseWebhook(
      {
        id: "evt_test_charge_succeeded",
        type: "charge.succeeded",
        data: { object: { id: "ch_test", payment_intent: "pi_test", amount: 100, currency: "usd" } }
      },
      { "x-mpa-raw-body": "{}" }
    );
    expect(events).toHaveLength(1);
    expect(events[0]?.type).toBe("ignored");
    if (previousSecret) process.env["STRIPE_WEBHOOK_SECRET"] = previousSecret;
    else delete process.env["STRIPE_WEBHOOK_SECRET"];
  });
});

describe("friendly payment errors", () => {
  it("maps known codes", () => {
    expect(friendlyPaymentError("insufficient_funds")).toMatch(/Insufficient/i);
    expect(mapProviderFailureToCode("NSF returned")).toBe("insufficient_funds");
  });
});
