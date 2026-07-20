import { test, expect } from "../../src/fixtures/auth";
import { isAuthEnabled } from "../../src/utils/env";

/**
 * P0 module shell coverage — each critical surface must load without auth redirect.
 * Authenticated; skipped when QA_E2E_AUTH_ENABLED is not true.
 */
const PM_SHELLS: Array<{ name: string; path: string }> = [
  { name: "organizations/setup", path: "/setup" },
  { name: "properties", path: "/properties" },
  { name: "units", path: "/units" },
  { name: "tenants", path: "/tenants" },
  { name: "leases", path: "/leases" },
  { name: "maintenance", path: "/maintenance" },
  { name: "communications", path: "/communications" },
  { name: "financials", path: "/financials" },
  { name: "migration", path: "/migration" },
  { name: "notifications", path: "/settings/notifications" },
  { name: "profile", path: "/profile" },
  { name: "ai-operations", path: "/ai-operations" }
];

test.describe("P0 module shells @smoke @auth", () => {
  test.beforeEach(() => {
    test.skip(!isAuthEnabled(), "Requires seeded QA auth (QA_E2E_AUTH_ENABLED=true)");
  });

  for (const shell of PM_SHELLS) {
    test(`${shell.name} shell loads @smoke @auth`, async ({ asPm }) => {
      await asPm.goto(shell.path);
      await expect(asPm).not.toHaveURL(/\/login/);
      await expect(asPm.locator("body")).toBeVisible();
    });
  }
});
