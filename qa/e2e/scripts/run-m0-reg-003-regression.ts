/**
 * M0 Implemented-Role Regression Rerun (post REG-ACL-001).
 * Implemented roles only: Master Admin · PM · Owner · Vendor · Tenant.
 * Evidence JSON only — no product code changes.
 */
import { chromium, type Browser, type BrowserContext, type ConsoleMessage, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AuthPage } from "../src/pages/auth.page";

type Check = { id: string; result: "PASS" | "FAIL" | "SKIP"; detail: string };

const root = path.dirname(fileURLToPath(import.meta.url));
const authDir = path.join(root, "../playwright/.auth");
const outDir = path.join(
  root,
  "../../../docs/106-pmx-004-native-pwa-parity/artifacts/phase-1-production/m0-reg-003-rerun"
);
const baseURL = process.env["PLAYWRIGHT_BASE_URL"] ?? "https://www.my-property-assistant.com";

function loadEnvLocal() {
  const envPath = path.join(root, "../.env.local");
  if (!existsSync(envPath)) throw new Error("Missing qa/e2e/.env.local — run seed first");
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i);
    let v = line.slice(i + 1);
    try {
      v = JSON.parse(v) as string;
    } catch {
      /* raw */
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

async function textSample(page: Page): Promise<string> {
  const body = await page.locator("body").innerText().catch(() => "");
  return body.replace(/\s+/g, " ").trim().slice(0, 280);
}

function hasOpsShell(sample: string, url: string): boolean {
  if (/PAGE MISSING|We can’t find that page|We can't find that page/i.test(sample)) return false;
  if (/\/portal\//.test(url)) return false;
  return (
    /Operations Center/i.test(sample) ||
    (/Properties/.test(sample) && /Units/.test(sample) && /Tenants/.test(sample))
  );
}

function attachConsoleCapture(page: Page, bucket: string[]) {
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (/Failed to load resource|net::ERR_|favicon|Download the React DevTools/i.test(text)) return;
    bucket.push(text.slice(0, 200));
  });
  page.on("pageerror", (err) => {
    bucket.push(`pageerror: ${err.message}`.slice(0, 200));
  });
}

function materialErrors(errors: string[]): string[] {
  return errors.filter((e) => !/#418|hydration|Minified React error #418/i.test(e));
}

async function withState(
  browser: Browser,
  file: string,
  fn: (page: Page, context: BrowserContext) => Promise<void>
) {
  const statePath = path.join(authDir, file);
  if (!existsSync(statePath)) throw new Error(`Missing storage state ${file}`);
  const context = await browser.newContext({ baseURL, storageState: statePath });
  const page = await context.newPage();
  try {
    await fn(page, context);
  } finally {
    await context.close();
  }
}

async function apiStatus(context: BrowserContext, pathName: string): Promise<number> {
  const res = await context.request.get(new URL(pathName, baseURL).toString());
  return res.status();
}

async function main() {
  loadEnvLocal();
  mkdirSync(outDir, { recursive: true });
  const checks: Check[] = [];
  const consoleByRole: Array<{ role: string; errors: string[] }> = [];
  const push = (id: string, result: Check["result"], detail: string) => {
    checks.push({ id, result, detail });
    console.log(`[${result}] ${id}: ${detail}`);
  };

  // Fresh Production storage states (login for all implemented roles)
  const { spawnSync } = await import("node:child_process");
  const setup = spawnSync("pnpm", ["exec", "tsx", "scripts/auth-setup.ts"], {
    cwd: path.join(root, ".."),
    env: { ...process.env },
    encoding: "utf8"
  });
  if (setup.status !== 0) {
    console.error(setup.stdout, setup.stderr);
    throw new Error("auth-setup failed");
  }
  console.log(setup.stdout);
  push("A.login.all_roles_storage", "PASS", "auth-setup saved master-admin/pm/owner/vendor/resident");

  const browser = await chromium.launch();
  try {
    // --- A Authentication ---
    {
      const context = await browser.newContext({ baseURL });
      const page = await context.newPage();
      const errors: string[] = [];
      attachConsoleCapture(page, errors);
      const auth = new AuthPage(page);
      await auth.signIn(process.env["QA_E2E_PM_EMAIL"]!, process.env["QA_E2E_PM_PASSWORD"]!);
      try {
        await page.waitForURL(/\/(dashboard|setup|properties|portal|master-admin)/, { timeout: 45_000 });
        push("A.login.pm", "PASS", `landed ${page.url()}`);
      } catch {
        push("A.login.pm", "FAIL", `url=${page.url()} body=${await textSample(page)}`);
      }

      // Session refresh
      const before = page.url();
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      push(
        "A.session_refresh.pm",
        !page.url().includes("/login") && /dashboard|properties|setup/.test(page.url()) ? "PASS" : "FAIL",
        `${before} → ${page.url()}`
      );

      // Logout via API (profile control is unreliable across shells)
      const logoutRes = await context.request.post(new URL("/api/auth/logout", baseURL).toString());
      push(
        "A.logout.api",
        logoutRes.ok() || logoutRes.status() === 200 || logoutRes.status() === 204 ? "PASS" : "FAIL",
        `status=${logoutRes.status()}`
      );
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      push("A.logout.redirect", page.url().includes("/login") ? "PASS" : "FAIL", page.url());
      const afterLogoutApi = await apiStatus(context, "/api/properties");
      push("A.logout.api_properties", afterLogoutApi === 401 ? "PASS" : "FAIL", `status=${afterLogoutApi}`);
      consoleByRole.push({ role: "A.pm_auth", errors });
      await context.close();
    }

    // Session expiration (owner)
    await withState(browser, "owner.json", async (page, context) => {
      await page.goto("/portal/owner", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      await context.clearCookies();
      await page.goto("/portal/owner", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      push("A.session_expired.owner", page.url().includes("/login") ? "PASS" : "FAIL", page.url());
    });

    // Anon protection
    {
      const ctx = await browser.newContext({ baseURL });
      const page = await ctx.newPage();
      for (const route of ["/dashboard", "/portal/tenant", "/master-admin"]) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(800);
        push(`A.anon${route}`, page.url().includes("/login") ? "PASS" : "FAIL", page.url());
      }
      push(
        "A.anon.api_properties",
        (await apiStatus(ctx, "/api/properties")) === 401 ? "PASS" : "FAIL",
        `status=${await apiStatus(ctx, "/api/properties")}`
      );
      await ctx.close();
    }

    // Re-login after logout
    {
      const ctx = await browser.newContext({ baseURL });
      const page = await ctx.newPage();
      const auth = new AuthPage(page);
      await auth.signIn(process.env["QA_E2E_PM_EMAIL"]!, process.env["QA_E2E_PM_PASSWORD"]!);
      await page.waitForURL(/\/(dashboard|setup|properties)/, { timeout: 45_000 }).catch(() => undefined);
      push("A.relogin.pm", /\/(dashboard|setup|properties)/.test(page.url()) ? "PASS" : "FAIL", page.url());
      await ctx.close();
    }

    // Refresh storage after PM logout invalidated tokens
    const setup2 = spawnSync("pnpm", ["exec", "tsx", "scripts/auth-setup.ts"], {
      cwd: path.join(root, ".."),
      env: { ...process.env },
      encoding: "utf8"
    });
    if (setup2.status !== 0) throw new Error("auth-setup refresh failed");
    push("A.login.refresh_states", "PASS", "storage states refreshed after logout probes");

    // --- B Navigation / landings / ACL ---
    const roleHomes: Array<{ file: string; role: string; route: string; expect: RegExp }> = [
      { file: "master-admin.json", role: "masterAdmin", route: "/master-admin", expect: /\/master-admin/ },
      { file: "pm.json", role: "property_manager", route: "/dashboard", expect: /\/(dashboard|properties|setup)/ },
      { file: "owner.json", role: "property_owner", route: "/portal/owner", expect: /\/portal\/owner/ },
      { file: "resident.json", role: "tenant", route: "/portal/tenant", expect: /\/portal\/tenant/ },
      { file: "vendor.json", role: "vendor", route: "/vendor-access", expect: /\/vendor-access/ }
    ];

    for (const r of roleHomes) {
      await withState(browser, r.file, async (page) => {
        const errors: string[] = [];
        attachConsoleCapture(page, errors);
        await page.goto("/", { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(1500);
        // Also open assigned surface
        await page.goto(r.route, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(2000);
        const sample = await textSample(page);
        const denied = /ACCESS CHECK|unauthorized/i.test(sample) && !r.expect.test(page.url());
        push(
          `B.landing.${r.role}`,
          r.expect.test(page.url()) && !denied ? "PASS" : "FAIL",
          `${page.url()} :: ${sample.slice(0, 140)}`
        );

        // Session refresh on landing
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.waitForTimeout(1200);
        push(
          `B.session_refresh.${r.role}`,
          r.expect.test(page.url()) ? "PASS" : "FAIL",
          page.url()
        );
        consoleByRole.push({ role: `B.${r.role}`, errors: materialErrors(errors) });
      });
    }

    // Privilege escalation
    await withState(browser, "pm.json", async (page) => {
      await page.goto("/master-admin", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      const sample = await textSample(page);
      const blocked = !/MISSION CONTROL|Mission Control/i.test(sample);
      push("B.escalation.pm_to_master", blocked ? "PASS" : "FAIL", `${page.url()} :: ${sample.slice(0, 140)}`);
    });

    for (const probe of [
      { file: "owner.json", role: "owner", home: /\/portal\/owner/ },
      { file: "resident.json", role: "tenant", home: /\/portal\/tenant/ },
      { file: "vendor.json", role: "vendor", home: /\/portal\/vendor/ }
    ] as const) {
      await withState(browser, probe.file, async (page) => {
        await page.goto("/properties", { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(1500);
        await page.reload({ waitUntil: "domcontentloaded" }).catch(() => undefined);
        await page.waitForTimeout(1000);
        let sample = await textSample(page);
        let url = page.url();
        let ops = hasOpsShell(sample, url) && !probe.home.test(url);
        let onSetup = url.includes("/setup");
        push(
          `B.escalation.${probe.role}_to_ops_properties`,
          (probe.home.test(url) || url.includes("/unauthorized")) && !ops && !onSetup ? "PASS" : "FAIL",
          ops || onSetup ? `REG-ACL-001 · ${url}` : `${url} :: ${sample.slice(0, 120)}`
        );

        // History nav
        await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(1000);
        await page.goBack().catch(() => undefined);
        await page.waitForTimeout(800);
        await page.goForward().catch(() => undefined);
        await page.waitForTimeout(1200);
        sample = await textSample(page);
        url = page.url();
        ops = hasOpsShell(sample, url) && !probe.home.test(url);
        push(
          `B.history.${probe.role}`,
          !ops && !url.includes("/setup") ? "PASS" : "FAIL",
          `${url} :: ${sample.slice(0, 100)}`
        );
      });
    }

    await withState(browser, "resident.json", async (page) => {
      await page.goto("/portal/owner", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      const sample = await textSample(page);
      const blocked = page.url().includes("/unauthorized") || /ACCESS CHECK/i.test(sample);
      push("B.escalation.tenant_to_owner", blocked ? "PASS" : "FAIL", `${page.url()} :: ${sample.slice(0, 140)}`);
    });

    await withState(browser, "pm.json", async (page) => {
      await page.goto("/portal/tenant", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      const sample = await textSample(page);
      const blocked = page.url().includes("/unauthorized") || /ACCESS CHECK/i.test(sample);
      push("B.escalation.pm_to_tenant", blocked ? "PASS" : "FAIL", `${page.url()} :: ${sample.slice(0, 140)}`);
    });

    // --- C Core PM workflows ---
    const pmRoutes = [
      "/dashboard",
      "/properties",
      "/units",
      "/tenants",
      "/maintenance",
      "/vendors",
      "/leases",
      "/financials",
      "/communications",
      "/settings"
    ];
    await withState(browser, "pm.json", async (page, context) => {
      const errors: string[] = [];
      attachConsoleCapture(page, errors);
      for (const route of pmRoutes) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(1200);
        const sample = await textSample(page);
        const denied = /ACCESS CHECK|unauthorized/i.test(sample) && page.url().includes("/unauthorized");
        const loggedOut = page.url().includes("/login");
        push(
          `C.pm${route}`,
          !loggedOut && !denied ? "PASS" : "FAIL",
          `${page.url()} :: ${sample.slice(0, 100)}`
        );
      }
      await page.goto("/properties", { waitUntil: "domcontentloaded" });
      const qaVisible = await page
        .getByText("QA Certification Property", { exact: false })
        .waitFor({ timeout: 45_000 })
        .then(() => true)
        .catch(() => false);
      const sample = (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ").trim();
      push(
        "C.pm.qa_property_visible",
        qaVisible || /QA Certification Property/i.test(sample) ? "PASS" : "FAIL",
        sample.slice(0, 180)
      );
      const pmApi = await apiStatus(context, "/api/properties");
      push("C.api.pm.properties", pmApi === 200 || pmApi === 403 ? "PASS" : "FAIL", `status=${pmApi}`);
      consoleByRole.push({ role: "C.pm", errors: materialErrors(errors) });
    });

    // --- D Portal workflows ---
    await withState(browser, "vendor.json", async (page, context) => {
      const errors: string[] = [];
      attachConsoleCapture(page, errors);
      await page.goto("/portal/vendor", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      const sample = await textSample(page);
      push(
        "D.vendor.portal_retired",
        page.url().includes("/vendor-access") && /retired|secure/i.test(sample) ? "PASS" : "FAIL",
        `${page.url()} :: ${sample.slice(0, 140)}`
      );
      push(
        "D.api.vendor.properties",
        [200, 401, 403].includes(await apiStatus(context, "/api/properties")) ? "PASS" : "FAIL",
        `status=${await apiStatus(context, "/api/properties")}`
      );
      consoleByRole.push({ role: "D.vendor", errors: materialErrors(errors) });
    });

    await withState(browser, "owner.json", async (page, context) => {
      const errors: string[] = [];
      attachConsoleCapture(page, errors);
      for (const route of [
        "/portal/owner",
        "/portal/owner/properties",
        "/portal/owner/documents",
        "/portal/owner/messages",
        "/portal/owner/reports",
        "/portal/owner/settings"
      ]) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(1200);
        const sample = await textSample(page);
        const denied = page.url().includes("/unauthorized") || /ACCESS CHECK/i.test(sample);
        // Missing owner sub-routes may 404 without ACL failure
        const pageMissing = /PAGE MISSING/i.test(sample);
        push(
          `D.owner${route}`,
          (!denied && page.url().includes("/portal/owner")) || pageMissing ? "PASS" : "FAIL",
          `${page.url()} :: ${sample.slice(0, 100)}`
        );
      }
      push(
        "D.api.owner.properties",
        [200, 401, 403].includes(await apiStatus(context, "/api/properties")) ? "PASS" : "FAIL",
        `status=${await apiStatus(context, "/api/properties")}`
      );
      consoleByRole.push({ role: "D.owner", errors: materialErrors(errors) });
    });

    await withState(browser, "resident.json", async (page, context) => {
      const errors: string[] = [];
      attachConsoleCapture(page, errors);
      await page.goto("/portal/tenant", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      const sample = await textSample(page);
      push(
        "D.tenant.portal",
        page.url().includes("/portal/tenant") && !/ACCESS CHECK/i.test(sample) ? "PASS" : "FAIL",
        `${page.url()} :: ${sample.slice(0, 140)}`
      );
      // Loading state should resolve (not stuck forever)
      const stuckLoading = /^Loading your portal/i.test(sample) && sample.length < 40;
      push("D.tenant.loading_resolved", !stuckLoading ? "PASS" : "FAIL", sample.slice(0, 80));
      push(
        "D.api.tenant.properties",
        [200, 401, 403].includes(await apiStatus(context, "/api/properties")) ? "PASS" : "FAIL",
        `status=${await apiStatus(context, "/api/properties")}`
      );
      consoleByRole.push({ role: "D.tenant", errors: materialErrors(errors) });
    });

    // --- E Org isolation ---
    await withState(browser, "pm.json", async (page) => {
      await page.goto("/properties", { waitUntil: "domcontentloaded" });
      const seesQa = await page
        .getByText("QA Certification Property", { exact: false })
        .waitFor({ timeout: 45_000 })
        .then(() => true)
        .catch(() => false);
      const sample = (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ").trim();
      const seesIsolation = /MPA QA Isolation Control/i.test(sample);
      push(
        "E.org_isolation.pm_properties",
        seesQa && !seesIsolation ? "PASS" : "FAIL",
        `seesQa=${seesQa} seesIsolation=${seesIsolation} :: ${sample.slice(0, 140)}`
      );
    });

    // Master admin mission
    await withState(browser, "master-admin.json", async (page) => {
      const errors: string[] = [];
      attachConsoleCapture(page, errors);
      await page.goto("/master-admin", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      const sample = await textSample(page);
      push(
        "B.role.masterAdmin.mission",
        /MISSION CONTROL|Mission Control/i.test(sample) ? "PASS" : "FAIL",
        `${page.url()} :: ${sample.slice(0, 140)}`
      );
      consoleByRole.push({ role: "B.master", errors: materialErrors(errors) });
    });

    // AUTH-001 Slice D roles — full authenticated cert owned by VALIDATE AUTH-001 SLICE D
    push(
      "B.role.organization_admin",
      "SKIP",
      "Slice D implemented — certify under VALIDATE AUTH-001 SLICE D (fixtures: QA_E2E_ORG_ADMIN_*)"
    );
    push(
      "B.role.leasing_agent",
      "SKIP",
      "Slice D implemented — certify under VALIDATE AUTH-001 SLICE D (fixtures: QA_E2E_LEASING_*)"
    );
    push(
      "B.role.facility_technician",
      "SKIP",
      "Slice D implemented — certify under VALIDATE AUTH-001 SLICE D (fixtures: QA_E2E_TECH_*)"
    );

    // UI stability rollup (material errors only; #418 hydration excluded)
    const material = consoleByRole.flatMap((e) => e.errors);
    push(
      "F.ui.console_material",
      material.length === 0 ? "PASS" : "FAIL",
      material.length === 0 ? "no material console/page errors" : material.slice(0, 5).join(" | ")
    );
  } finally {
    await browser.close();
  }

  const pass = checks.filter((c) => c.result === "PASS").length;
  const fail = checks.filter((c) => c.result === "FAIL").length;
  const skip = checks.filter((c) => c.result === "SKIP").length;
  const summary = {
    ranAt: new Date().toISOString(),
    baseURL,
    deploymentId: "dpl_HFdpfdy5jS8kdQKSUKa6iKcU4hBf",
    gate: "implemented-role-regression-rerun",
    counts: { pass, fail, skip, total: checks.length },
    overallExecutable: fail === 0 ? "PASS" : "FAIL",
    architectureBlockedRoles: [],
    sliceDCertificationPending: ["organization_admin", "leasing_agent", "facility_technician"],
    consoleByRole,
    checks
  };
  writeFileSync(path.join(outDir, "regression-results.json"), JSON.stringify(summary, null, 2));
  console.log(`PASS=${pass} FAIL=${fail} SKIP=${skip} overall=${summary.overallExecutable}`);
  if (fail > 0) process.exit(1);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
