import { test, expect } from "../../src/fixtures/auth";
import { isAuthEnabled } from "../../src/utils/env";

/**
 * API-004 electronic signature workflows — P1 nightly.
 */
test.describe("Electronic signature workflows @p1 @nightly @auth", () => {
  test.beforeEach(() => {
    test.skip(!isAuthEnabled(), "Requires QA_E2E_AUTH_ENABLED");
  });

  test("leases list is reachable for signature entry @p1 @nightly", async ({ asPm }) => {
    await asPm.goto("/leases");
    await expect(asPm).not.toHaveURL(/\/login/);
    await expect(asPm.locator("body")).toBeVisible();
  });

  test("signing progress rejects invalid token gracefully @p1 @nightly", async ({ asAnonymous }) => {
    await asAnonymous.goto("/signing/progress/invalid-token-example");
    await expect(asAnonymous.getByText(/signing unavailable|unavailable|loading/i).first()).toBeVisible({
      timeout: 15_000
    });
  });

  test("lease detail exposes signature panel when authorized @p1 @nightly", async ({ asPm }) => {
    await asPm.goto("/leases");
    const firstLink = asPm.locator('a[href^="/leases/"]').first();
    if (!(await firstLink.isVisible().catch(() => false))) {
      test.skip(true, "No leases seeded for signature panel check");
    }
    await firstLink.click();
    await expect(asPm.getByText(/electronic signatures/i).first()).toBeVisible({ timeout: 20_000 });
  });
});
