import { test, expect } from "../../src/fixtures/auth";
import { AuthPage } from "../../src/pages/auth.page";
import { isAuthEnabled } from "../../src/utils/env";

test.describe("Performance probes @perf @nightly", () => {
  test("login page load under budget @perf @smoke", async ({ asAnonymous }) => {
    const auth = new AuthPage(asAnonymous);
    const started = Date.now();
    await auth.goto();
    await auth.expectLoaded();
    const elapsed = Date.now() - started;
    expect(elapsed, `Login load ${elapsed}ms`).toBeLessThan(8_000);

    const lcp = await asAnonymous.evaluate(() => {
      return new Promise<number>((resolve) => {
        let value = 0;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1];
          value = last?.startTime ?? 0;
        });
        observer.observe({ type: "largest-contentful-paint", buffered: true });
        setTimeout(() => {
          observer.disconnect();
          resolve(value);
        }, 1000);
      });
    });
    test.info().annotations.push({ type: "LCP(ms)", description: String(Math.round(lcp)) });
  });

  test("dashboard navigation timing @perf @auth @nightly", async ({ asPm }) => {
    test.skip(!isAuthEnabled(), "Requires QA_E2E_AUTH_ENABLED");
    const started = Date.now();
    await asPm.goto("/dashboard");
    await expect(asPm.locator("body")).toBeVisible();
    const elapsed = Date.now() - started;
    expect(elapsed).toBeLessThan(12_000);
    test.info().annotations.push({ type: "dashboard-load(ms)", description: String(elapsed) });
  });
});
