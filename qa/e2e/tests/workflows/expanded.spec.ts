import { test, expect } from "../../src/fixtures/auth";
import { isAuthEnabled } from "../../src/utils/env";

/**
 * P1/P2 expansion — warning-only in PR CI (see GitHub Actions continue-on-error).
 * Tagged @p1 / @p2 / @nightly.
 */
test.describe("Expanded workflows @p1 @nightly", () => {
  test.beforeEach(() => {
    test.skip(!isAuthEnabled(), "Requires QA_E2E_AUTH_ENABLED");
  });

  test("leases list loads @p1 @nightly", async ({ asPm }) => {
    await asPm.goto("/leases");
    await expect(asPm).not.toHaveURL(/\/login/);
    await expect(asPm.locator("body")).toBeVisible();
  });

  test("communications list loads @p1 @nightly", async ({ asPm }) => {
    await asPm.goto("/communications");
    await expect(asPm).not.toHaveURL(/\/login/);
  });

  test("financials overview loads @p1 @nightly", async ({ asPm }) => {
    await asPm.goto("/financials");
    await expect(asPm).not.toHaveURL(/\/login/);
  });

  test("maintenance list loads @p1 @nightly", async ({ asPm }) => {
    await asPm.goto("/maintenance");
    await expect(asPm).not.toHaveURL(/\/login/);
  });

  test("migration center loads @p1 @nightly", async ({ asPm }) => {
    await asPm.goto("/migration");
    await expect(asPm).not.toHaveURL(/\/login/);
  });

  test("notification settings load @p1 @nightly", async ({ asPm }) => {
    await asPm.goto("/settings/notifications");
    await expect(asPm).not.toHaveURL(/\/login/);
  });

  test("vendor portal loads @p1 @nightly", async ({ asVendor }) => {
    await asVendor.goto("/portal/vendor");
    await expect(asVendor).not.toHaveURL(/\/login/);
  });

  test("owner portal loads @p1 @nightly", async ({ asOwner }) => {
    await asOwner.goto("/portal/owner");
    await expect(asOwner).not.toHaveURL(/\/login/);
  });

  test("resident announcements inbox loads @p1 @nightly", async ({ asResident }) => {
    await asResident.goto("/portal/tenant/announcements");
    await expect(asResident).not.toHaveURL(/\/login/);
  });

  test("media upload control present on profile @p2 @nightly", async ({ asPm }) => {
    await asPm.goto("/profile");
    await expect(asPm.getByText(/profile photo|upload photo|drag & drop/i).first()).toBeVisible({
      timeout: 15_000
    });
  });
});
