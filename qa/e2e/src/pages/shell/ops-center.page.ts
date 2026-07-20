import { expect, type Page } from "@playwright/test";

export class OpsCenterPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/dashboard");
  }

  async expectLoaded() {
    await expect(
      this.page.getByRole("heading", { name: /operations center|welcome/i }).first()
    ).toBeVisible({ timeout: 20_000 });
  }
}

export class CommandCenterPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.getByRole("button", { name: /command center/i }).click();
  }

  async expectOpen() {
    await expect(this.page.getByRole("dialog").or(this.page.getByRole("searchbox"))).toBeVisible({
      timeout: 10_000
    });
  }
}
