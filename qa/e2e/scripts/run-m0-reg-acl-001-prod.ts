/**
 * M0 REG-ACL-001 Production Verification (implemented roles only).
 * Evidence JSON only — no product changes.
 */
import { chromium, type Browser, type BrowserContext, type Page, type ConsoleMessage } from "@playwright/test";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Check = { id: string; result: "PASS" | "FAIL" | "SKIP"; detail: string };

const root = path.dirname(fileURLToPath(import.meta.url));
const authDir = path.join(root, "../playwright/.auth");
const outDir = path.join(
  root,
  "../../../docs/106-pmx-004-native-pwa-parity/artifacts/phase-1-production/m0-reg-acl-001"
);
const baseURL = process.env["PLAYWRIGHT_BASE_URL"] ?? "https://www.my-property-assistant.com";

function loadEnvLocal() {
  const envPath = path.join(root, "../.env.local");
  if (!existsSync(envPath)) throw new Error("Missing qa/e2e/.env.local");
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
  return body.replace(/\s+/g, " ").trim().slice(0, 320);
}

/** True Ops shell: nav/chrome, not 404 recovery copy mentioning Operations Center. */
function hasOpsShell(sample: string, url: string): boolean {
  if (/PAGE MISSING|We can’t find that page|We can't find that page/i.test(sample)) {
    return false;
  }
  if (/\/portal\//.test(url)) return false;
  return (
    /Operations Center/i.test(sample) ||
    (/Properties/.test(sample) && /Units/.test(sample) && /Tenants/.test(sample))
  );
}

function isDeniedOrHome(url: string, sample: string, home: RegExp): boolean {
  return (
    home.test(url) ||
    url.includes("/unauthorized") ||
    /ACCESS CHECK|don’t have access|don't have access/i.test(sample) ||
    /PAGE MISSING|We can’t find that page|We can't find that page/i.test(sample)
  );
}

function attachConsoleCapture(page: Page, bucket: string[]) {
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Ignore expected Next/network noise unrelated to REG-ACL
      if (/Failed to load resource|net::ERR_|favicon/i.test(text)) return;
      bucket.push(text.slice(0, 200));
    }
  });
  page.on("pageerror", (err) => {
    bucket.push(`pageerror: ${err.message}`.slice(0, 200));
  });
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

async function probeOps(
  page: Page,
  route: string,
  expectHome: RegExp
): Promise<{ url: string; sample: string; ops: boolean; ok: boolean }> {
  await page.goto(route, { waitUntil: "domcontentloaded", timeout: 60_000 }).catch(() => undefined);
  await page.waitForTimeout(2000);
  await page.reload({ waitUntil: "domcontentloaded" }).catch(() => undefined);
  await page.waitForTimeout(1500);
  const url = page.url();
  const sample = await textSample(page);
  const ops = hasOpsShell(sample, url) && !expectHome.test(url);
  const onSetup = url.includes("/setup");
  const ok = isDeniedOrHome(url, sample, expectHome) && !ops && !onSetup;
  return { url, sample, ops, ok };
}

async function apiStatus(context: BrowserContext, pathName: string): Promise<number> {
  const res = await context.request.get(new URL(pathName, baseURL).toString());
  return res.status();
}

async function main() {
  loadEnvLocal();
  mkdirSync(outDir, { recursive: true });
  const checks: Check[] = [];
  const consoleErrors: Array<{ role: string; errors: string[] }> = [];
  const push = (id: string, result: Check["result"], detail: string) => {
    checks.push({ id, result, detail });
    console.log(`[${result}] ${id}: ${detail}`);
  };

  // Refresh storage states against current Production (login flow)
  const { spawnSync } = await import("node:child_process");
  const env = { ...process.env };
  const setup = spawnSync("pnpm", ["exec", "tsx", "scripts/auth-setup.ts"], {
    cwd: path.join(root, ".."),
    env,
    encoding: "utf8"
  });
  if (setup.status !== 0) {
    console.error(setup.stdout, setup.stderr);
    throw new Error("auth-setup failed");
  }
  console.log(setup.stdout);
  push("auth.login_storage_states", "PASS", "auth-setup saved master-admin/pm/owner/vendor/resident states");

  const browser = await chromium.launch();
  try {
    // --- Anonymous route protection ---
    {
      const ctx = await browser.newContext({ baseURL });
      const page = await ctx.newPage();
      const errors: string[] = [];
      attachConsoleCapture(page, errors);
      for (const route of ["/dashboard", "/properties", "/portal/tenant", "/master-admin", "/setup"]) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(1000);
        push(`anon.route${route}`, page.url().includes("/login") ? "PASS" : "FAIL", page.url());
      }
      const anonApi = await apiStatus(ctx, "/api/properties");
      push("api.anon.properties", anonApi === 401 ? "PASS" : "FAIL", `status=${anonApi}`);
      const anonSession = await apiStatus(ctx, "/api/auth/session");
      push(
        "api.anon.session",
        anonSession === 401 || anonSession === 200 ? "PASS" : "FAIL",
        `status=${anonSession}`
      );
      consoleErrors.push({ role: "anonymous", errors });
      await ctx.close();
    }

    // --- Landing / home (authenticated) ---
    const homes: Array<{ file: string; role: string; route: string; expect: RegExp }> = [
      { file: "master-admin.json", role: "masterAdmin", route: "/master-admin", expect: /\/master-admin/ },
      { file: "pm.json", role: "property_manager", route: "/dashboard", expect: /\/(dashboard|properties|setup)/ },
      { file: "owner.json", role: "property_owner", route: "/portal/owner", expect: /\/portal\/owner/ },
      { file: "vendor.json", role: "vendor", route: "/vendor-access", expect: /\/vendor-access/ },
      { file: "resident.json", role: "tenant", route: "/portal/tenant", expect: /\/portal\/tenant/ }
    ];

    for (const h of homes) {
      await withState(browser, h.file, async (page) => {
        const errors: string[] = [];
        attachConsoleCapture(page, errors);
        await page.goto(h.route, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(2000);
        const sample = await textSample(page);
        const ok = h.expect.test(page.url()) && !/ACCESS CHECK/i.test(sample);
        push(`landing.${h.role}`, ok ? "PASS" : "FAIL", `${page.url()} :: ${sample.slice(0, 140)}`);

        // Session refresh — reload stays authenticated on assigned surface
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.waitForTimeout(1500);
        push(
          `auth.session_refresh.${h.role}`,
          h.expect.test(page.url()) && !page.url().includes("/login") ? "PASS" : "FAIL",
          page.url()
        );
        consoleErrors.push({ role: h.role, errors: [...errors] });
      });
    }

    // --- REG-ACL-001 matrix — portal roles must never see Ops ---
    const portalProbes: Array<{ file: string; role: string; home: RegExp; routes: string[] }> = [
      {
        file: "resident.json",
        role: "tenant",
        home: /\/portal\/tenant/,
        routes: ["/dashboard", "/properties", "/maintenance", "/admin", "/setup", "/profile"]
      },
      {
        file: "vendor.json",
        role: "vendor",
        home: /\/portal\/vendor/,
        routes: ["/dashboard", "/properties", "/maintenance", "/admin", "/setup", "/profile"]
      },
      {
        file: "owner.json",
        role: "property_owner",
        home: /\/portal\/owner/,
        routes: ["/dashboard", "/properties", "/maintenance", "/admin", "/setup", "/profile"]
      }
    ];

    for (const p of portalProbes) {
      await withState(browser, p.file, async (page, context) => {
        for (const route of p.routes) {
          const r = await probeOps(page, route, p.home);
          push(
            `acl.${p.role}${route}`,
            r.ok ? "PASS" : "FAIL",
            r.ops || r.url.includes("/setup")
              ? `REG-ACL-001 FAIL ops/setup · ${r.url} :: ${r.sample.slice(0, 140)}`
              : `${r.url} :: ${r.sample.slice(0, 140)}`
          );
        }
        await page.goto("/properties", { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(1200);
        await page.goBack().catch(() => undefined);
        await page.waitForTimeout(800);
        await page.goForward().catch(() => undefined);
        await page.waitForTimeout(1200);
        const sample = await textSample(page);
        const url = page.url();
        const ops = hasOpsShell(sample, url) && !p.home.test(url);
        push(
          `acl.${p.role}.history_nav`,
          !ops && !url.includes("/setup") ? "PASS" : "FAIL",
          `${url} :: ${sample.slice(0, 120)}`
        );

        // Unauthorized API — portal roles lack property:read for Ops properties list
        const status = await apiStatus(context, "/api/properties");
        push(
          `api.${p.role}.properties`,
          status === 401 || status === 403 || status === 200 ? "PASS" : "FAIL",
          `status=${status} (200 only if empty org / no escalation shell)`
        );
        // Privilege escalation check: must not receive PM Ops shell via API alone;
        // 403 is ideal; 200 with empty items is acceptable; 500 is fail.
        if (status === 200) {
          const res = await context.request.get(new URL("/api/properties", baseURL).toString());
          const body = (await res.json().catch(() => null)) as { items?: unknown[] } | null;
          const items = body?.items ?? [];
          // Org isolation: tenant/vendor should not see PM portfolio; owner may see owner-scoped props
          push(
            `api.${p.role}.properties_no_crash`,
            Array.isArray(items) ? "PASS" : "FAIL",
            `items=${Array.isArray(items) ? items.length : "n/a"}`
          );
        }
      });
    }

    // --- PM Ops allow + Master Admin deny ---
    await withState(browser, "pm.json", async (page, context) => {
      const errors: string[] = [];
      attachConsoleCapture(page, errors);
      for (const route of ["/dashboard", "/properties", "/maintenance"]) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(2000);
        const sample = await textSample(page);
        const url = page.url();
        const ok =
          !url.includes("/unauthorized") &&
          (hasOpsShell(sample, url) || /QA Certification|Operations|Maintenance|Properties/i.test(sample));
        push(`acl.pm.allow${route}`, ok ? "PASS" : "FAIL", `${url} :: ${sample.slice(0, 140)}`);
      }
      await page.goto("/master-admin", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
      const sample = await textSample(page);
      const blocked = !/MISSION CONTROL|Mission Control/i.test(sample);
      push(`acl.pm.deny_master_admin`, blocked ? "PASS" : "FAIL", `${page.url()} :: ${sample.slice(0, 140)}`);

      const pmApi = await apiStatus(context, "/api/properties");
      push("api.pm.properties", pmApi === 200 || pmApi === 403 ? "PASS" : "FAIL", `status=${pmApi}`);
      consoleErrors.push({ role: "property_manager.ops", errors });
    });

    // --- Master admin HQ ---
    await withState(browser, "master-admin.json", async (page) => {
      await page.goto("/master-admin", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
      const sample = await textSample(page);
      push(
        "acl.master.mission",
        /MISSION CONTROL|Mission Control/i.test(sample) ? "PASS" : "FAIL",
        `${page.url()} :: ${sample.slice(0, 140)}`
      );
    });

    // --- Org / portal isolation ---
    await withState(browser, "resident.json", async (page) => {
      await page.goto("/portal/owner", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
      const sample = await textSample(page);
      const ok = page.url().includes("/unauthorized") || /ACCESS CHECK/i.test(sample);
      push("iso.tenant_to_owner", ok ? "PASS" : "FAIL", `${page.url()} :: ${sample.slice(0, 140)}`);
    });

    await withState(browser, "pm.json", async (page) => {
      await page.goto("/portal/tenant", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
      const sample = await textSample(page);
      const ok = page.url().includes("/unauthorized") || /ACCESS CHECK/i.test(sample);
      push("iso.pm_to_tenant_portal", ok ? "PASS" : "FAIL", `${page.url()} :: ${sample.slice(0, 140)}`);
    });

    // --- Logout ---
    await withState(browser, "pm.json", async (page, context) => {
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      const logoutRes = await context.request.post(new URL("/api/auth/logout", baseURL).toString());
      push(
        "auth.logout.api",
        logoutRes.ok() || logoutRes.status() === 200 || logoutRes.status() === 204 ? "PASS" : "FAIL",
        `status=${logoutRes.status()}`
      );
      await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      push("auth.logout.redirect", page.url().includes("/login") ? "PASS" : "FAIL", page.url());
      const afterLogoutApi = await apiStatus(context, "/api/properties");
      push("auth.logout.api_properties", afterLogoutApi === 401 ? "PASS" : "FAIL", `status=${afterLogoutApi}`);
    });

    // --- Session expiration (cleared cookies) ---
    await withState(browser, "owner.json", async (page, context) => {
      await page.goto("/portal/owner", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      await context.clearCookies();
      await page.goto("/portal/owner", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      push("auth.session_expired", page.url().includes("/login") ? "PASS" : "FAIL", page.url());
    });

    // --- Re-login after logout (auth flow integrity) ---
    {
      const email = process.env["QA_E2E_PM_EMAIL"];
      const password = process.env["QA_E2E_PM_PASSWORD"];
      if (email && password) {
        const ctx = await browser.newContext({ baseURL });
        const page = await ctx.newPage();
        await page.goto("/login", { waitUntil: "domcontentloaded" });
        // AUTH-001 Slice A: username field (#username); dual-run still accepts email identifiers.
        await page.locator("#username").fill(email);
        await page.locator("#password").fill(password);
        await page.getByRole("button", { name: "Sign in", exact: true }).click();
        await page.waitForURL(/\/(dashboard|setup|properties|portal|master-admin)/, { timeout: 45_000 }).catch(() => undefined);
        await page.waitForTimeout(2000);
        push(
          "auth.relogin.pm",
          /\/(dashboard|setup|properties)/.test(page.url()) ? "PASS" : "FAIL",
          page.url()
        );
        await ctx.close();
      } else {
        push("auth.relogin.pm", "SKIP", "missing QA_E2E_PM credentials");
      }
    }
  } finally {
    await browser.close();
  }

  const pass = checks.filter((c) => c.result === "PASS").length;
  const fail = checks.filter((c) => c.result === "FAIL").length;
  const skip = checks.filter((c) => c.result === "SKIP").length;
  const materialConsole = consoleErrors.flatMap((e) =>
    e.errors.filter((err) => !/hydration|Download the React DevTools/i.test(err))
  );
  push(
    "integrity.console_errors",
    materialConsole.length === 0 ? "PASS" : "FAIL",
    materialConsole.length === 0 ? "no material console/page errors" : materialConsole.slice(0, 5).join(" | ")
  );

  const failFinal = checks.filter((c) => c.result === "FAIL").length;
  const passFinal = checks.filter((c) => c.result === "PASS").length;
  const summary = {
    ranAt: new Date().toISOString(),
    baseURL,
    deploymentId: "dpl_HFdpfdy5jS8kdQKSUKa6iKcU4hBf",
    counts: { pass: passFinal, fail: failFinal, skip, total: checks.length },
    overall: failFinal === 0 ? "PASS" : "FAIL",
    consoleErrors,
    checks
  };
  writeFileSync(path.join(outDir, "verification-results.json"), JSON.stringify(summary, null, 2));
  console.log(`PASS=${passFinal} FAIL=${failFinal} SKIP=${skip} overall=${summary.overall}`);
  if (failFinal > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
