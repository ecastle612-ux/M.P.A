import { expect, type Page } from "@playwright/test";

export class ProfilePage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/profile");
  }

  async expectLoaded() {
    await expect(this.page.getByRole("heading", { name: /user profile|profile/i })).toBeVisible({
      timeout: 20_000
    });
  }

  async updateDisplayName(name: string) {
    await this.page.getByLabel(/display name/i).fill(name);
  }

  async save() {
    await this.page.getByRole("button", { name: /save|update/i }).first().click();
  }
}
