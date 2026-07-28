import { expect, type Page } from "@playwright/test";

export class AuthPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  /** Product login identity is username (AUTH-001 Slice A). Dual-run email still accepted server-side. */
  username() {
    return this.page.locator("#username");
  }

  /** @deprecated Use username() — email is not product login identity. */
  email() {
    return this.username();
  }

  password() {
    return this.page.locator("#password");
  }

  submit() {
    return this.page.getByRole("button", { name: /sign in/i });
  }

  async expectLoaded() {
    await expect(this.page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(this.username()).toBeVisible();
    await expect(this.password()).toBeVisible();
  }

  async signIn(usernameOrEmail: string, password: string) {
    await this.goto();
    await this.username().fill(usernameOrEmail);
    await this.password().fill(password);
    await this.page.getByRole("button", { name: "Sign in", exact: true }).click();
  }

  /** Public signup removed (AUTH-001 invitation-only). */
  async switchToSignUp() {
    await this.page.goto("/login?mode=sign_up");
    await expect(this.page.getByText(/invitation-only|public registration is disabled/i)).toBeVisible();
  }
}
