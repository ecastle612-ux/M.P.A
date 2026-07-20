/**
 * Persists Playwright storage states for each QA role.
 * Run after seed: pnpm --filter @mpa/qa-e2e auth:setup
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getRoleCredentials, isAuthEnabled, type QaRole } from "../src/utils/env";
import { AuthPage } from "../src/pages/auth.page";

const authDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../playwright/.auth");
const baseURL = process.env["PLAYWRIGHT_BASE_URL"] ?? "http://127.0.0.1:3000";

const ROLES: Array<{ role: QaRole; file: string }> = [
  { role: "masterAdmin", file: "master-admin.json" },
  { role: "pm", file: "pm.json" },
  { role: "resident", file: "resident.json" },
  { role: "vendor", file: "vendor.json" },
  { role: "owner", file: "owner.json" }
];

async function main() {
  if (!isAuthEnabled()) {
    throw new Error("Set QA_E2E_AUTH_ENABLED=true before auth:setup");
  }

  fs.mkdirSync(authDir, { recursive: true });
  fs.writeFileSync(path.join(authDir, "anonymous.json"), JSON.stringify({ cookies: [], origins: [] }));

  const browser = await chromium.launch();
  try {
    for (const { role, file } of ROLES) {
      const creds = getRoleCredentials(role);
      if (!creds) {
        console.warn(`Skipping ${role}: missing credentials`);
        continue;
      }
      const context = await browser.newContext({ baseURL });
      const page = await context.newPage();
      const auth = new AuthPage(page);
      await auth.goto();
      await auth.signIn(creds.email, creds.password);
      await page.waitForURL(/\/(dashboard|setup|portal)/, { timeout: 45_000 });
      await context.storageState({ path: path.join(authDir, file) });
      await context.close();
      console.log(`Saved storage state for ${role} → ${file}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
