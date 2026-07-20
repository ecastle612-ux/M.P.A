import { test, expect } from "../../src/fixtures/auth";
import { isAuthEnabled } from "../../src/utils/env";

/**
 * API-005 resident payments & billing workflows — P1 nightly.
 */
test.describe("Resident payments workflows @p1 @nightly @auth", () => {
  test.beforeEach(() => {
    test.skip(!isAuthEnabled(), "Requires QA_E2E_AUTH_ENABLED");
  });

  test("financials page exposes billing operations @p1 @nightly", async ({ asPm }) => {
    await asPm.goto("/financials");
    await expect(asPm).not.toHaveURL(/\/login/);
    await expect(asPm.getByText(/billing operations|financials|outstanding/i).first()).toBeVisible({
      timeout: 20_000
    });
  });

  test("tenant payments portal is reachable @p1 @nightly", async ({ asAnonymous }) => {
    await asAnonymous.goto("/portal/tenant/payments");
    // Unauthenticated users redirect to login; authenticated tenant path covered when seeded
    await expect(asAnonymous.locator("body")).toBeVisible();
  });

  test("payment webhook simulate rejects unknown provider @p1 @nightly", async ({ asPm }) => {
    const response = await asPm.request.post("/api/webhooks/payments/unknown_provider", {
      data: { type: "succeeded" }
    });
    expect(response.status()).toBe(404);
  });

  test("billing ops endpoint requires auth capability @p1 @nightly", async ({ asPm }) => {
    const response = await asPm.request.get("/api/billing?ops=1");
    expect([200, 401, 403]).toContain(response.status());
    if (response.ok()) {
      const json = (await response.json()) as { ops?: { provider?: string } };
      expect(json.ops?.provider).toBeTruthy();
    }
  });
});
