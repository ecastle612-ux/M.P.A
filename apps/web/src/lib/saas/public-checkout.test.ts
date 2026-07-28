import { describe, expect, it } from "vitest";
import { createPublicSaasCheckoutSession, PublicCheckoutError } from "./public-checkout";

describe("ACQ-001 Slice B public Checkout validation", () => {
  it("rejects Enterprise from public Checkout", async () => {
    await expect(
      createPublicSaasCheckoutSession({
        planCode: "enterprise",
        billingInterval: "month",
        companyName: "Acme",
        workEmail: "buyer@acme.test",
        successUrl: "http://localhost/acquire/success?session_id={CHECKOUT_SESSION_ID}",
        cancelUrl: "http://localhost/acquire/canceled"
      })
    ).rejects.toMatchObject({
      code: "INVALID_PLAN",
      httpStatus: 403
    } satisfies Partial<PublicCheckoutError>);
  });

  it("rejects Founder from public Checkout", async () => {
    await expect(
      createPublicSaasCheckoutSession({
        planCode: "founder",
        billingInterval: "month",
        companyName: "Acme",
        workEmail: "buyer@acme.test",
        successUrl: "http://localhost/ok",
        cancelUrl: "http://localhost/cancel"
      })
    ).rejects.toMatchObject({
      code: "INVALID_PLAN",
      httpStatus: 403
    });
  });

  it("rejects unknown plans", async () => {
    await expect(
      createPublicSaasCheckoutSession({
        planCode: "hobby",
        billingInterval: "month",
        companyName: "Acme",
        workEmail: "buyer@acme.test",
        successUrl: "http://localhost/ok",
        cancelUrl: "http://localhost/cancel"
      })
    ).rejects.toMatchObject({ code: "INVALID_PLAN", httpStatus: 403 });
  });

  it("rejects invalid billing interval", async () => {
    await expect(
      createPublicSaasCheckoutSession({
        planCode: "professional",
        billingInterval: "week" as "month",
        companyName: "Acme",
        workEmail: "buyer@acme.test",
        successUrl: "http://localhost/ok",
        cancelUrl: "http://localhost/cancel"
      })
    ).rejects.toMatchObject({ code: "INVALID_INTERVAL" });
  });

  it("rejects missing company or email", async () => {
    await expect(
      createPublicSaasCheckoutSession({
        planCode: "business",
        billingInterval: "year",
        companyName: "  ",
        workEmail: "not-an-email",
        successUrl: "http://localhost/ok",
        cancelUrl: "http://localhost/cancel"
      })
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });
});
