import { test, expect } from "../../src/fixtures/auth";
import { AuthPage } from "../../src/pages/auth.page";
import { isFullVisual } from "../../src/utils/env";

/**
 * BR-001 Amendment D — Visual regression protection for branding surfaces.
 * Unexpected branding drift fails CI (`pnpm qa:e2e:visual`).
 */
test.describe("Brand visual regression @visual", () => {
  test("login branding @visual", async ({ asAnonymous }) => {
    await asAnonymous.setViewportSize({ width: 390, height: 844 });
    const auth = new AuthPage(asAnonymous);
    await auth.goto();
    await auth.expectLoaded();
    await expect(asAnonymous).toHaveScreenshot("brand-login-mobile.png", { fullPage: true });
  });

  test("password reset branding @visual", async ({ asAnonymous }) => {
    await asAnonymous.setViewportSize({ width: 390, height: 844 });
    await asAnonymous.goto("/forgot-password");
    await expect(asAnonymous.getByRole("heading", { name: /reset|password|email/i }).first()).toBeVisible({
      timeout: 15_000
    });
    await expect(asAnonymous).toHaveScreenshot("brand-password-reset-mobile.png", { fullPage: true });
  });

  test("brand certification light gallery @visual", async ({ asAnonymous }) => {
    test.skip(!isFullVisual(), "Brand gallery matrix runs when QA_E2E_FULL_VISUAL=true");
    await asAnonymous.setViewportSize({ width: 1280, height: 900 });
    await asAnonymous.goto("/dev/brand-certification");
    await expect(asAnonymous.getByRole("heading", { name: /Brand Certification/i })).toBeVisible();
    await expect(asAnonymous).toHaveScreenshot("brand-certification-desktop.png", { fullPage: true });
  });

  test("authenticated shell header + sidebar branding @visual", async ({ asPm }) => {
    await asPm.setViewportSize({ width: 1440, height: 900 });
    await asPm.goto("/dashboard");
    await expect(asPm.locator("aside, [data-sidebar], nav").first()).toBeVisible({ timeout: 30_000 });
    await expect(asPm).toHaveScreenshot("brand-shell-desktop.png", {
      fullPage: false,
      maxDiffPixelRatio: 0.02
    });
  });

  test("mobile drawer branding @visual", async ({ asPm }) => {
    await asPm.setViewportSize({ width: 390, height: 844 });
    await asPm.goto("/dashboard");
    const menu = asPm.getByRole("button", { name: /^Menu$/i });
    await expect(menu).toBeVisible({ timeout: 30_000 });
    await menu.click();
    await expect(asPm.getByRole("dialog", { name: /navigation/i })).toBeVisible();
    await expect(asPm).toHaveScreenshot("brand-drawer-mobile.png", {
      fullPage: false,
      maxDiffPixelRatio: 0.02
    });
  });
});

