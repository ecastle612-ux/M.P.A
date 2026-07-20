import { test, expect } from "../../src/fixtures/auth";
import { isAuthEnabled } from "../../src/utils/env";

/**
 * API-003 screening workflows — P1 nightly (warning-only on PR without auth secrets).
 */
test.describe("Screening workflows @p1 @nightly @auth", () => {
  test.beforeEach(() => {
    test.skip(!isAuthEnabled(), "Requires QA_E2E_AUTH_ENABLED");
  });

  test("applicants list is reachable for screening entry @p1 @nightly", async ({ asPm }) => {
    await asPm.goto("/applicants");
    await expect(asPm).not.toHaveURL(/\/login/);
    await expect(asPm.locator("body")).toBeVisible();
  });

  test("screening consent route rejects invalid token gracefully @p1 @nightly", async ({ asAnonymous }) => {
    await asAnonymous.goto("/screening/consent/invalid-token-example");
    await expect(asAnonymous.getByText(/consent unavailable|authorization|loading/i).first()).toBeVisible({
      timeout: 15_000
    });
  });

  test("applicant detail exposes screening panel when authorized @p1 @nightly", async ({ asPm }) => {
    await asPm.goto("/applicants");
    const firstLink = asPm.locator('a[href^="/applicants/"]').first();
    if (!(await firstLink.isVisible().catch(() => false))) {
      test.skip(true, "No applicants seeded for screening panel check");
      return;
    }
    await firstLink.click();
    await expect(asPm.getByText(/background screening/i).first()).toBeVisible({ timeout: 20_000 });
  });
});
