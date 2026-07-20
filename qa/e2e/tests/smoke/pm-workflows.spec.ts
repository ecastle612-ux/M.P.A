import { test, expect } from "../../src/fixtures/auth";
import { SetupWizardPage } from "../../src/pages/setup-wizard.page";
import { ProfilePage } from "../../src/pages/profile.page";
import { PropertiesPage } from "../../src/pages/properties.page";
import { OpsCenterPage, CommandCenterPage } from "../../src/pages/shell/ops-center.page";
import { isAuthEnabled, qaRunId } from "../../src/utils/env";

test.describe("P0 PM workflows @smoke @auth", () => {
  test.beforeEach(() => {
    test.skip(!isAuthEnabled(), "Requires seeded QA auth (QA_E2E_AUTH_ENABLED=true)");
  });

  test("setup wizard is reachable for incomplete profiles @smoke @auth", async ({ asPm }) => {
    const setup = new SetupWizardPage(asPm);
    await setup.goto();
    // Either setup wizard or dashboard if already complete
    const onSetup = asPm.url().includes("/setup");
    if (onSetup) {
      await setup.expectWelcomeOrProfile();
    } else {
      await expect(asPm).toHaveURL(/\/(dashboard|properties)/);
    }
  });

  test("operations center loads @smoke @auth", async ({ asPm }) => {
    const ops = new OpsCenterPage(asPm);
    await ops.goto();
    await ops.expectLoaded();
  });

  test("command center can open @smoke @auth", async ({ asPm }) => {
    await asPm.goto("/dashboard");
    const command = new CommandCenterPage(asPm);
    await command.open();
    await command.expectOpen();
  });

  test("properties list loads @smoke @auth", async ({ asPm }) => {
    const properties = new PropertiesPage(asPm);
    await properties.goto();
    await properties.expectListOrEmpty();
  });

  test("profile page loads and can save display name @smoke @auth", async ({ asPm }) => {
    const profile = new ProfilePage(asPm);
    await profile.goto();
    await profile.expectLoaded();
    const name = `QA PM ${qaRunId()}`.slice(0, 40);
    await profile.updateDisplayName(name);
    await profile.save();
    await expect(asPm.getByText(/profile updated|saved|updated/i)).toBeVisible({ timeout: 15_000 });
  });

  test("primary navigation links resolve @smoke @auth", async ({ asPm }) => {
    await asPm.goto("/dashboard");
    for (const href of ["/properties", "/units", "/tenants", "/leases", "/maintenance", "/communications"]) {
      await asPm.goto(href);
      await expect(asPm).not.toHaveURL(/\/login/);
      await expect(asPm.locator("body")).toBeVisible();
    }
  });
});
