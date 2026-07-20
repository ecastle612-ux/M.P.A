import { test, expect } from "../../src/fixtures/auth";
import { isAuthEnabled } from "../../src/utils/env";

/**
 * WF-001 — End-to-end workflow shell coverage.
 * Full create/mutate journeys require seeded auth + org data (QA_E2E_AUTH_ENABLED).
 */
test.describe("WF-001 workflow journeys @p1 @nightly @auth", () => {
  test.beforeEach(() => {
    test.skip(!isAuthEnabled(), "Requires QA_E2E_AUTH_ENABLED");
  });

  test("company setup surface remains reachable @p1 @nightly", async ({ asPm }) => {
    await asPm.goto("/setup");
    await expect(asPm.locator("body")).toBeVisible();
    await expect(asPm).not.toHaveURL(/\/login/);
  });

  test("applicant list and create surfaces load @p1 @nightly", async ({ asPm }) => {
    await asPm.goto("/applicants");
    await expect(asPm).not.toHaveURL(/\/login/);
    await asPm.goto("/applicants/new");
    await expect(asPm.locator("body")).toBeVisible();
  });

  test("resident portal workflow destinations load @p1 @nightly", async ({ asResident }) => {
    for (const href of [
      "/portal/tenant",
      "/portal/tenant/maintenance",
      "/portal/tenant/payments",
      "/portal/tenant/messages",
      "/portal/tenant/announcements",
      "/portal/tenant/documents",
      "/portal/tenant/notifications",
      "/portal/tenant/preferences",
      "/profile"
    ]) {
      await asResident.goto(href);
      await expect(asResident).not.toHaveURL(/\/login/);
      await expect(asResident.locator("body")).toBeVisible();
    }
  });

  test("resident maintenance create form is available @p1 @nightly", async ({ asResident }) => {
    await asResident.goto("/portal/tenant/maintenance/new");
    await expect(asResident.locator("body")).toBeVisible();
    const title = asResident.getByLabel(/title/i).first();
    if (await title.isVisible().catch(() => false)) {
      await expect(title).toBeVisible();
    } else {
      await expect(asResident.getByText(/resident profile|property assignment|maintenance/i).first()).toBeVisible();
    }
  });

  test("maintenance manager list and create load @p1 @nightly", async ({ asPm }) => {
    await asPm.goto("/maintenance");
    await expect(asPm).not.toHaveURL(/\/login/);
    await asPm.goto("/maintenance/new");
    await expect(asPm.getByText(/work order|maintenance|create/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test("vendor portal work queue loads @p1 @nightly", async ({ asVendor }) => {
    await asVendor.goto("/portal/vendor");
    await expect(asVendor).not.toHaveURL(/\/login/);
    await expect(asVendor.getByText(/work queue|assigned|vendor/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test("payments financials and resident payments load @p1 @nightly", async ({ asPm, asResident }) => {
    await asPm.goto("/financials/charges");
    await expect(asPm).not.toHaveURL(/\/login/);
    await asResident.goto("/portal/tenant/payments");
    await expect(asResident).not.toHaveURL(/\/login/);
  });

  test("migration wizard surfaces load @p1 @nightly", async ({ asPm }) => {
    await asPm.goto("/migration");
    await expect(asPm).not.toHaveURL(/\/login/);
    await asPm.goto("/migration/new");
    await expect(asPm.locator("body")).toBeVisible();
  });
});
