import { test, expect } from "../../src/fixtures/auth";
import { isAuthEnabled } from "../../src/utils/env";

/**
 * PT-001 confidence surfaces — unauthorized + not-found must never show raw errors.
 */
test.describe("PT-001 trust surfaces @smoke", () => {
  test("not-found page uses human recovery copy @smoke", async ({ page }) => {
    await page.goto("/this-route-does-not-exist-pt001");
    await expect(page.getByRole("heading", { name: /can’t find that page|cannot find that page/i })).toBeVisible();
    await expect(page.getByText(/What happened/i)).toBeVisible();
    await expect(page.getByText(/How to fix it/i)).toBeVisible();
  });

  test("unauthorized page uses human recovery copy @smoke @auth", async ({ asPm }) => {
    test.skip(!isAuthEnabled(), "Requires seeded QA auth");
    await asPm.goto("/unauthorized");
    await expect(asPm.getByRole("heading", { name: /don’t have access|do not have access/i })).toBeVisible();
    await expect(asPm.getByText(/What happened/i)).toBeVisible();
    await expect(asPm.getByRole("link", { name: /contact support/i })).toBeVisible();
  });
});
