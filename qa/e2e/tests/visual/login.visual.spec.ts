import { test, expect } from "../../src/fixtures/auth";
import { AuthPage } from "../../src/pages/auth.page";
import { isFullVisual } from "../../src/utils/env";

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1024, height: 768 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "wide", width: 1920, height: 1080 }
] as const;

test.describe("Visual regression @visual", () => {
  for (const viewport of VIEWPORTS) {
    test(`login page @ ${viewport.name} (${viewport.width}) @visual`, async ({ asAnonymous }) => {
      // PR/default: mobile + desktop; full matrix when QA_E2E_FULL_VISUAL=true (nightly/RC)
      test.skip(
        !isFullVisual() && viewport.name !== "mobile" && viewport.name !== "desktop",
        "Full viewport matrix runs on nightly/RC"
      );

      await asAnonymous.setViewportSize({ width: viewport.width, height: viewport.height });
      const auth = new AuthPage(asAnonymous);
      await auth.goto();
      await auth.expectLoaded();
      await expect(asAnonymous).toHaveScreenshot(`login-${viewport.name}.png`, {
        fullPage: true
      });
    });
  }
});
