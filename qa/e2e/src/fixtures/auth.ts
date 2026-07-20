import { test as base, expect, type Page, type TestInfo, type Browser } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getRoleCredentials, isAuthEnabled, type QaRole } from "../utils/env";
import { AuthPage } from "../pages/auth.page";
import { attachDiagnostics } from "../utils/diagnostics";

const authDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../playwright/.auth");

type AuthFixtures = {
  asPm: Page;
  asResident: Page;
  asVendor: Page;
  asOwner: Page;
  asMasterAdmin: Page;
  asAnonymous: Page;
};

async function ensureLoggedIn(page: Page, role: QaRole) {
  const creds = getRoleCredentials(role);
  if (!creds) {
    throw new Error(`Missing credentials for role ${role}`);
  }
  const auth = new AuthPage(page);
  await auth.goto();
  await auth.signIn(creds.email, creds.password);
  await page.waitForURL(/\/(dashboard|setup|portal)/, { timeout: 30_000 });
}

function storagePath(role: QaRole | "anonymous"): string {
  const file =
    role === "masterAdmin"
      ? "master-admin.json"
      : role === "pm"
        ? "pm.json"
        : role === "resident"
          ? "resident.json"
          : role === "vendor"
            ? "vendor.json"
            : role === "owner"
              ? "owner.json"
              : "anonymous.json";
  return path.join(authDir, file);
}

async function pageWithStorage(browser: Browser, role: QaRole | "anonymous") {
  const statePath = storagePath(role);
  const context = await browser.newContext(
    fs.existsSync(statePath) ? { storageState: statePath } : {}
  );
  const page = await context.newPage();
  return { page, context };
}

async function useInstrumentedPage(
  browser: Browser,
  role: QaRole | "anonymous",
  use: (page: Page) => Promise<void>,
  testInfo: TestInfo,
  loginIfNeeded?: QaRole
) {
  const { page, context } = await pageWithStorage(browser, role);
  const diagnostics = attachDiagnostics(page, testInfo);
  try {
    if (loginIfNeeded && !fs.existsSync(storagePath(loginIfNeeded))) {
      await ensureLoggedIn(page, loginIfNeeded);
    }
    await use(page);
  } finally {
    await diagnostics.flush();
    await context.close();
  }
}

export const test = base.extend<AuthFixtures>({
  asAnonymous: async ({ browser }, use, testInfo) => {
    await useInstrumentedPage(browser, "anonymous", use, testInfo);
  },
  asPm: async ({ browser }, use, testInfo) => {
    test.skip(!isAuthEnabled(), "QA_E2E_AUTH_ENABLED is not true — authenticated PM fixtures disabled");
    await useInstrumentedPage(browser, "pm", use, testInfo, "pm");
  },
  asResident: async ({ browser }, use, testInfo) => {
    test.skip(!isAuthEnabled(), "QA_E2E_AUTH_ENABLED is not true — resident fixtures disabled");
    await useInstrumentedPage(browser, "resident", use, testInfo, "resident");
  },
  asVendor: async ({ browser }, use, testInfo) => {
    test.skip(!isAuthEnabled(), "QA_E2E_AUTH_ENABLED is not true — vendor fixtures disabled");
    await useInstrumentedPage(browser, "vendor", use, testInfo, "vendor");
  },
  asOwner: async ({ browser }, use, testInfo) => {
    test.skip(!isAuthEnabled(), "QA_E2E_AUTH_ENABLED is not true — owner fixtures disabled");
    await useInstrumentedPage(browser, "owner", use, testInfo, "owner");
  },
  asMasterAdmin: async ({ browser }, use, testInfo) => {
    test.skip(!isAuthEnabled(), "QA_E2E_AUTH_ENABLED is not true — master admin fixtures disabled");
    await useInstrumentedPage(browser, "masterAdmin", use, testInfo, "masterAdmin");
  }
});

export { expect };
