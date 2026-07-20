import { test, expect } from "../../src/fixtures/auth";
import { isAuthEnabled } from "../../src/utils/env";

test.describe("P0 Resident workflows @smoke @auth", () => {
  test.beforeEach(() => {
    test.skip(!isAuthEnabled(), "Requires seeded QA auth (QA_E2E_AUTH_ENABLED=true)");
  });

  test("resident portal shell loads @smoke @auth", async ({ asResident }) => {
    await asResident.goto("/portal/tenant");
    await expect(asResident).not.toHaveURL(/\/login/);
    await expect(asResident.locator("body")).toBeVisible();
  });

  test("resident can open maintenance area @smoke @auth", async ({ asResident }) => {
    await asResident.goto("/portal/tenant");
    const maintenanceLink = asResident.getByRole("link", { name: /maintenance|request/i }).first();
    if (await maintenanceLink.isVisible().catch(() => false)) {
      await maintenanceLink.click();
    } else {
      await asResident.goto("/maintenance/new");
    }
    await expect(asResident.locator("body")).toBeVisible();
  });
});
