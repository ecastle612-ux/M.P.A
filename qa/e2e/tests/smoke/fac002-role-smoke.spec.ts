/**
 * FAC-002 package COMPLETE — certified role smoke against configured base URL.
 * Run: pnpm exec playwright test --project=chromium-smoke --grep fac002
 *
 * Evidence: docs/114-fac-002-facility-operations-v1/evidence/fac002-role-smoke-latest.json
 */
import { test, expect, type Page } from "@playwright/test";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getRoleCredentials, requireAuthEnabled } from "../../src/utils/env";

type Row = {
  id: string;
  role: string;
  path: string;
  result: "PASS" | "FAIL" | "SKIP";
  evidence: string;
};

const rows: Row[] = [];

function record(row: Row) {
  rows.push(row);
}

function writeEvidence() {
  const here = dirname(fileURLToPath(import.meta.url));
  const out = join(
    here,
    "../../../../docs/114-fac-002-facility-operations-v1/evidence/fac002-role-smoke-latest.json"
  );
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(
    out,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseURL: process.env["PLAYWRIGHT_BASE_URL"] ?? null,
        rows,
        summary: {
          pass: rows.filter((r) => r.result === "PASS").length,
          fail: rows.filter((r) => r.result === "FAIL").length,
          skip: rows.filter((r) => r.result === "SKIP").length
        }
      },
      null,
      2
    )
  );
}

async function pageText(page: Page): Promise<string> {
  const main = page.getByRole("main");
  if ((await main.count()) > 0) {
    return main.first().innerText();
  }
  return page.locator("body").innerText();
}

async function gotoSettled(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  // Root loading.tsx / shell boot
  for (let i = 0; i < 45; i++) {
    const text = await page.locator("body").innerText().catch(() => "");
    if (!/loading your workspace|loading maintenance workspace/i.test(text)) break;
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(300);
}

/** Production may still show email login while AUTH-001 username landing is WIP. */
async function loginPmForFacSmoke(page: Page) {
  const creds = getRoleCredentials("pm");
  if (!creds) throw new Error("QA_E2E_PM_* credentials required");
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  const username = page.locator("#username");
  const email = page.locator('#email, input[type="email"], input[name="email"]');
  if (await username.isVisible({ timeout: 8_000 }).catch(() => false)) {
    await username.fill(creds.email);
  } else if (await email.first().isVisible({ timeout: 8_000 }).catch(() => false)) {
    await email.first().fill(creds.email);
  } else {
    throw new Error("No username/email field on /login");
  }
  await page.locator("#password, input[type='password'], input[name='password']").first().fill(creds.password);
  const submit = page.locator('form button[type="submit"], form button:has-text("Sign in")').last();
  await submit.click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 45_000 });
}

test.afterAll(() => {
  writeEvidence();
});

/**
 * Run against Production (or seeded host):
 *   cd qa/e2e && set -a && source .env.local && set +a && \
 *   pnpm exec playwright test tests/smoke/fac002-role-smoke.spec.ts --project=chromium-smoke
 * Note: chromium-smoke project greps @smoke — add @smoke to this describe title for that project, or use a config without grep.
 */
test.describe("FAC-002 role smoke @fac002-smoke @smoke", () => {
  test("PM facility happy paths on Production SoT", async ({ page }) => {
    requireAuthEnabled("FAC-002 role smoke");
    test.setTimeout(240_000);

    await loginPmForFacSmoke(page);

    await gotoSettled(page, "/facility");
    const hubText = await pageText(page);
    const hubOk =
      !page.url().includes("/login") &&
      /facility|work order|inventory|calendar/i.test(hubText) &&
      !/coming soon/i.test(hubText);
    record({
      id: "R1",
      role: "pm/technician-hub",
      path: "/facility",
      result: hubOk ? "PASS" : "FAIL",
      evidence: `url=${page.url()} snippet=${hubText.slice(0, 180)}`
    });
    expect(hubOk).toBeTruthy();

    await gotoSettled(page, "/maintenance");
    const hrefs = await page.locator('a[href*="/maintenance/"]').evaluateAll((anchors) =>
      anchors
        .map((a) => (a as HTMLAnchorElement).getAttribute("href") || "")
        .filter(
          (href) =>
            /\/maintenance\/[0-9a-f-]{20,}/i.test(href) &&
            !href.includes("/edit") &&
            !href.endsWith("/new")
        )
    );
    const known = process.env["QA_E2E_WORK_ORDER_ID"];
    const target = hrefs[0] ?? (known ? `/maintenance/${known}` : null);
    expect(target, "work order detail target").toBeTruthy();
    await gotoSettled(page, target!);
    const detail = await pageText(page);
    const woOk =
      /status|materials|photo|vendor|work order|priority|assigned|description|submitted|triage/i.test(
        detail
      ) && !/coming soon/i.test(detail);
    record({
      id: "R2",
      role: "pm/technician-wo",
      path: page.url(),
      result: woOk ? "PASS" : "FAIL",
      evidence: detail.slice(0, 220)
    });
    expect(woOk).toBeTruthy();

    await gotoSettled(page, "/facility/pm");
    const pmText = await pageText(page);
    const pmOk =
      /preventive|schedule|pm|draft|hvac|filter|occurrence/i.test(pmText) &&
      !/coming soon|loading your workspace/i.test(pmText);
    record({
      id: "R3",
      role: "manager-pm",
      path: "/facility/pm",
      result: pmOk ? "PASS" : "FAIL",
      evidence: pmText.slice(0, 220)
    });
    expect(pmOk).toBeTruthy();

    await gotoSettled(page, "/facility/calendar");
    const calText = await pageText(page);
    const calOk =
      /calendar|schedule|pm|inspection|work|month|week|day/i.test(calText) &&
      !/coming soon|loading your workspace/i.test(calText);
    record({
      id: "R4",
      role: "manager-calendar",
      path: "/facility/calendar",
      result: calOk ? "PASS" : "FAIL",
      evidence: calText.slice(0, 220)
    });
    expect(calOk).toBeTruthy();

    await gotoSettled(page, "/facility/inventory/new");
    const invText = await pageText(page);
    const hasPhoto = await page
      .locator('input[type="file"]')
      .first()
      .isVisible()
      .catch(() => false);
    const hasName =
      (await page.getByLabel(/name/i).first().isVisible().catch(() => false)) || /name/i.test(invText);
    const hasSave = await page
      .getByRole("button", { name: /save|create|add/i })
      .first()
      .isVisible()
      .catch(() => false);
    const invOk = (hasPhoto || /photo/i.test(invText)) && hasName && hasSave && !/coming soon/i.test(invText);
    record({
      id: "R5",
      role: "inventory-add",
      path: "/facility/inventory/new",
      result: invOk ? "PASS" : "FAIL",
      evidence: `photo=${hasPhoto} name=${hasName} save=${hasSave} snippet=${invText.slice(0, 180)}`
    });
    expect(invOk).toBeTruthy();

    await gotoSettled(page, "/facility/inspections");
    const inspText = await pageText(page);
    const inspOk = /inspection/i.test(inspText) && !/coming soon|loading your workspace/i.test(inspText);
    record({
      id: "R6",
      role: "inspection-list",
      path: "/facility/inspections",
      result: inspOk ? "PASS" : "FAIL",
      evidence: inspText.slice(0, 220)
    });
    expect(inspOk).toBeTruthy();

    await gotoSettled(page, "/facility/inspections/new");
    const inspNew = await pageText(page);
    const inspNewOk =
      /inspection|template|property|building|site/i.test(inspNew) &&
      !/coming soon|loading your workspace/i.test(inspNew);
    record({
      id: "R7",
      role: "inspection-new",
      path: "/facility/inspections/new",
      result: inspNewOk ? "PASS" : "FAIL",
      evidence: inspNew.slice(0, 220)
    });
    expect(inspNewOk).toBeTruthy();

    await gotoSettled(page, "/facility/reports");
    const repText = await pageText(page);
    const repOk =
      /technician activity|inventory status|asset register|monthly building|report/i.test(repText) &&
      !/coming soon|loading your workspace/i.test(repText);
    record({
      id: "R8",
      role: "reports",
      path: "/facility/reports",
      result: repOk ? "PASS" : "FAIL",
      evidence: repText.slice(0, 220)
    });
    expect(repOk).toBeTruthy();

    const facilityPages = [
      "/facility",
      "/facility/inventory",
      "/facility/pm",
      "/facility/calendar",
      "/facility/inspections",
      "/facility/reports"
    ];
    const leaks: string[] = [];
    for (const path of facilityPages) {
      await gotoSettled(page, path);
      const text = await pageText(page);
      if (/collect rent|lease renewal|tenant portal invite/i.test(text)) {
        leaks.push(path);
      }
    }
    record({
      id: "R9",
      role: "facility-surface-isolation",
      path: facilityPages.join(","),
      result: leaks.length === 0 ? "PASS" : "FAIL",
      evidence: leaks.length ? `leaks=${leaks.join("|")}` : "No tenant/lease/rent CTAs in facility main content"
    });
    expect(leaks.length).toBe(0);

    record({
      id: "R10",
      role: "facility-only-org",
      path: "n/a",
      result: "SKIP",
      evidence:
        "No dedicated Property-unlicensed facility-only org in QA_E2E credentials; independence covered by FAC-002 §18 + R9. Operator follow-up optional."
    });
  });
});
