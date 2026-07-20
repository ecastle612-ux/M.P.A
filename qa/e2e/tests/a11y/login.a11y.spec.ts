import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "../../src/fixtures/auth";
import { AuthPage } from "../../src/pages/auth.page";
import { isAuthEnabled } from "../../src/utils/env";

test.describe("Accessibility @a11y @smoke", () => {
  test("login page has no critical/serious axe violations @a11y @smoke", async ({ asAnonymous }) => {
    const auth = new AuthPage(asAnonymous);
    await auth.goto();
    await auth.expectLoaded();

    const results = await new AxeBuilder({ page: asAnonymous })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blocking = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });

  test("login form is keyboard reachable @a11y @smoke", async ({ asAnonymous }) => {
    const auth = new AuthPage(asAnonymous);
    await auth.goto();
    await auth.email().focus();
    await expect(auth.email()).toBeFocused();
    await asAnonymous.keyboard.press("Tab");
    await expect(auth.password()).toBeFocused();
  });

  test("authenticated dashboard has no critical axe violations @a11y @auth", async ({ asPm }) => {
    test.skip(!isAuthEnabled(), "Requires QA_E2E_AUTH_ENABLED");
    await asPm.goto("/dashboard");
    const results = await new AxeBuilder({ page: asPm })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const blocking = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
});
