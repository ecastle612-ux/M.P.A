import { expect, type Page } from "@playwright/test";

export class SetupWizardPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/setup");
  }

  async expectWelcomeOrProfile() {
    await expect(
      this.page.getByRole("heading", { name: /welcome to m\.p\.a\.|complete your profile/i })
    ).toBeVisible({ timeout: 20_000 });
  }

  async continueWelcomeIfPresent() {
    const continueButton = this.page.getByRole("button", { name: /continue|get started|let's go/i });
    if (await continueButton.isVisible().catch(() => false)) {
      await continueButton.click();
    }
  }

  async fillProfile(input: {
    firstName: string;
    lastName: string;
    jobTitle: string;
    phone?: string;
  }) {
    await this.page.getByLabel(/first name/i).fill(input.firstName);
    await this.page.getByLabel(/last name/i).fill(input.lastName);
    await this.page.getByLabel(/job title/i).fill(input.jobTitle);
    if (input.phone) {
      await this.page.getByLabel(/^phone/i).fill(input.phone);
    }
  }

  async saveProfile() {
    await this.page.getByRole("button", { name: /save.*continue/i }).click();
  }
}
