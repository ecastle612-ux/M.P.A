import { describe, expect, it } from "vitest";
import { noopSaasBillingProvider } from "./noop-provider";
import { stripeSaasBillingProvider } from "./stripe-provider";
import { getSaasBillingProvider, resolveDefaultSaasBillingProviderId } from "./registry";
import { resolvePlanFromPriceId, resolvePriceId } from "./plan-catalog";

describe("SaasBillingProvider registry", () => {
  it("defaults to noop without env", () => {
    const previous = process.env["SAAS_BILLING_PROVIDER"];
    delete process.env["SAAS_BILLING_PROVIDER"];
    expect(resolveDefaultSaasBillingProviderId()).toBe("noop");
    expect(getSaasBillingProvider().id).toBe("noop");
    if (previous) process.env["SAAS_BILLING_PROVIDER"] = previous;
  });

  it("resolves stripe provider", () => {
    expect(getSaasBillingProvider("stripe").id).toBe("stripe");
  });
});

describe("noop SaaS billing provider", () => {
  it("creates customer, checkout, and portal without network", async () => {
    const customer = await noopSaasBillingProvider.ensureCustomer({
      organizationId: "11111111-1111-1111-1111-111111111111"
    });
    expect(customer.externalCustomerId).toContain("noop_cus_saas");

    const checkout = await noopSaasBillingProvider.createCheckoutSession({
      organizationId: "11111111-1111-1111-1111-111111111111",
      externalCustomerId: customer.externalCustomerId,
      priceId: "noop_price",
      planCode: "professional",
      billingInterval: "month",
      successUrl: "http://localhost/success",
      cancelUrl: "http://localhost/cancel"
    });
    expect(checkout.sessionId).toContain("noop_cs");
    expect(checkout.url).toContain("session_id=");

    const portal = await noopSaasBillingProvider.createPortalSession({
      externalCustomerId: customer.externalCustomerId,
      returnUrl: "http://localhost/billing"
    });
    expect(portal.url).toContain("portal=noop");
  });

  it("parses subscription upsert webhook", async () => {
    const events = await noopSaasBillingProvider.parseWebhook(
      {
        id: "evt-1",
        type: "subscription_upsert",
        organizationId: "org-1",
        externalSubscriptionId: "sub_1",
        planCode: "business"
      },
      {}
    );
    expect(events[0]?.type).toBe("subscription_upsert");
    expect(events[0]?.subscription?.planCode).toBe("business");
  });
});

describe("stripe SaaS billing provider sandbox", () => {
  it("creates sandbox refs without secret key", async () => {
    const previous = process.env["STRIPE_SECRET_KEY"];
    delete process.env["STRIPE_SECRET_KEY"];
    process.env["STRIPE_MODE"] = "sandbox";

    const customer = await stripeSaasBillingProvider.ensureCustomer({
      organizationId: "22222222-2222-2222-2222-222222222222"
    });
    expect(customer.externalCustomerId).toContain("cus_saas_sandbox");

    const checkout = await stripeSaasBillingProvider.createCheckoutSession({
      organizationId: "22222222-2222-2222-2222-222222222222",
      externalCustomerId: customer.externalCustomerId,
      priceId: "price_saas_sandbox_professional_month",
      planCode: "professional",
      billingInterval: "month",
      successUrl: "http://localhost/ok",
      cancelUrl: "http://localhost/cancel",
      trialPeriodDays: 14
    });
    expect(checkout.sessionId).toContain("cs_saas_sandbox");

    if (previous) process.env["STRIPE_SECRET_KEY"] = previous;
  });

  it("rejects invalid webhook signatures when SaaS secret set", async () => {
    process.env["STRIPE_SAAS_WEBHOOK_SECRET"] = "whsec_saas_test";
    process.env["STRIPE_MODE"] = "sandbox";
    await expect(
      stripeSaasBillingProvider.parseWebhook(
        { type: "customer.subscription.updated" },
        { "x-mpa-raw-body": "{}" }
      )
    ).rejects.toThrow(/signature/i);
    delete process.env["STRIPE_SAAS_WEBHOOK_SECRET"];
  });

  it("maps subscription.updated events", async () => {
    delete process.env["STRIPE_SAAS_WEBHOOK_SECRET"];
    delete process.env["STRIPE_WEBHOOK_SECRET"];
    process.env["STRIPE_MODE"] = "sandbox";

    const events = await stripeSaasBillingProvider.parseWebhook(
      {
        id: "evt_sub_1",
        type: "customer.subscription.updated",
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: "sub_123",
            customer: "cus_123",
            status: "active",
            cancel_at_period_end: false,
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
            metadata: { organization_id: "org-1", plan_code: "professional", billing_interval: "month" },
            items: { data: [{ price: { id: "price_saas_sandbox_professional_month" } }] }
          }
        }
      },
      { "x-mpa-simulate": "1", "x-mpa-raw-body": "{}" }
    );
    expect(events[0]?.type).toBe("subscription_upsert");
    expect(events[0]?.subscription?.status).toBe("active");
    expect(events[0]?.subscription?.planCode).toBe("professional");
  });
});

describe("plan catalog", () => {
  it("resolves sandbox price ids", () => {
    const previous = process.env["STRIPE_SAAS_PRICE_PROFESSIONAL_MONTHLY"];
    delete process.env["STRIPE_SAAS_PRICE_PROFESSIONAL_MONTHLY"];
    process.env["STRIPE_MODE"] = "sandbox";
    const ref = resolvePriceId("professional", "month");
    expect(ref?.priceId).toContain("price_saas_sandbox_professional_month");
    expect(resolvePlanFromPriceId(ref?.priceId)?.planCode).toBe("professional");
    if (previous) process.env["STRIPE_SAAS_PRICE_PROFESSIONAL_MONTHLY"] = previous;
  });
});
