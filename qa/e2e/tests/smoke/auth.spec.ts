import { test, expect } from "../../src/fixtures/auth";
import { AuthPage } from "../../src/pages/auth.page";
import { assertRedirectedToLogin } from "../../src/workflows/shared/login";
import { isAuthEnabled } from "../../src/utils/env";

test.describe("P0 Authentication @smoke", () => {
  test("login page renders sign-in form @smoke", async ({ asAnonymous }) => {
    const auth = new AuthPage(asAnonymous);
    await auth.goto();
    await auth.expectLoaded();
    await expect(asAnonymous.getByRole("link", { name: /forgot your password/i })).toBeVisible();
  });

  test("sign-up mode toggles create-account fields @smoke", async ({ asAnonymous }) => {
    const auth = new AuthPage(asAnonymous);
    await auth.goto();
    await auth.switchToSignUp();
    await expect(asAnonymous.locator("#confirm-password")).toBeVisible();
  });

  test("protected routes redirect anonymous users to login @smoke", async ({ asAnonymous }) => {
    await assertRedirectedToLogin(asAnonymous, "/dashboard");
    await assertRedirectedToLogin(asAnonymous, "/properties");
    await assertRedirectedToLogin(asAnonymous, "/profile");
  });

  test("PM can sign in with seeded credentials @smoke @auth", async ({ asPm }) => {
    test.skip(!isAuthEnabled(), "Requires QA_E2E_AUTH_ENABLED");
    await asPm.goto("/dashboard");
    await expect(asPm).not.toHaveURL(/\/login/);
  });
});
