import type { Page } from "@playwright/test";
import { AuthPage } from "../../pages/auth.page";
import { getRoleCredentials, type QaRole } from "../../utils/env";

export async function loginAs(page: Page, role: QaRole) {
  const creds = getRoleCredentials(role);
  if (!creds) {
    throw new Error(`No credentials configured for ${role}`);
  }
  const auth = new AuthPage(page);
  await auth.signIn(creds.email, creds.password);
}

export async function assertRedirectedToLogin(page: Page, protectedPath: string) {
  await page.goto(protectedPath);
  await page.waitForURL(/\/login/, { timeout: 20_000 });
}
