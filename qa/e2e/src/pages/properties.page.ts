import { expect, type Page } from "@playwright/test";

export class PropertiesPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/properties");
  }

  async expectListOrEmpty() {
    await expect(this.page.getByRole("heading", { name: /propert/i }).first()).toBeVisible({
      timeout: 20_000
    });
  }

  async openCreate() {
    await this.page.goto("/properties/new");
  }

  async fillMinimalProperty(name: string) {
    await this.page.getByLabel(/property name|name/i).first().fill(name);
    const address = this.page.getByLabel(/address/i).first();
    if (await address.isVisible().catch(() => false)) {
      await address.fill("100 QA Test Street");
    }
    const city = this.page.getByLabel(/city/i).first();
    if (await city.isVisible().catch(() => false)) {
      await city.fill("Austin");
    }
  }

  async submit() {
    await this.page.getByRole("button", { name: /save|create|submit/i }).first().click();
  }
}
