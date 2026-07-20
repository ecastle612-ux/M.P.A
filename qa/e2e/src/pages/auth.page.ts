import { expect, type Page } from "@playwright/test";

export class AuthPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  email() {
    return this.page.locator("#email");
  }

  password() {
    return this.page.locator("#password");
  }

  submit() {
    return this.page.getByRole("button", { name: /sign in|create account/i });
  }

  async expectLoaded() {
    await expect(this.page.getByRole("heading", { name: /sign in|create account/i })).toBeVisible();
    await expect(this.email()).toBeVisible();
    await expect(this.password()).toBeVisible();
  }

  async signIn(email: string, password: string) {
    await this.goto();
    await this.page.getByRole("button", { name: "Sign in" }).click();
    await this.email().fill(email);
    await this.password().fill(password);
    await this.page.getByRole("button", { name: "Sign in", exact: true }).click();
  }

  async switchToSignUp() {
    await this.page.getByRole("button", { name: "Sign up" }).click();
    await expect(this.page.getByRole("heading", { name: /create account/i })).toBeVisible();
  }
}
