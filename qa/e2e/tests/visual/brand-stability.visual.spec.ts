import { test, expect } from "../../src/fixtures/auth";
import { AuthPage } from "../../src/pages/auth.page";

/**
 * BR-002 runtime stability — same theme preference must yield the same BrandLogo asset
 * across hard refreshes (no hydration swap).
 *
 * Login uses AuthBrandShell forced dark-surface (logo-light.png). The assertion is
 * identity across refreshes, not “light preference ⇒ logo-dark”.
 */
async function brandLogoSrcs(page: import("@playwright/test").Page): Promise<string[]> {
  return page.locator('img[src*="/branding/logo-"]').evaluateAll((nodes) =>
    nodes.map((node) => (node as HTMLImageElement).getAttribute("src") ?? "")
  );
}

test.describe("Brand runtime stability @visual", () => {
  for (const theme of ["light", "dark", "system"] as const) {
    test(`login BrandLogo stable across refreshes (preference=${theme}) @visual`, async ({ asAnonymous }) => {
      await asAnonymous.addInitScript((preference) => {
        localStorage.setItem("mpa:theme-preference", preference);
        const mode =
          preference === "dark" ||
          (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
            ? "dark"
            : "light";
        document.cookie = `mpa-theme-mode=${mode}; Path=/; SameSite=Lax`;
        document.cookie = `mpa-theme-preference=${preference}; Path=/; SameSite=Lax`;
      }, theme);

      const auth = new AuthPage(asAnonymous);
      await auth.goto();
      await auth.expectLoaded();

      const baseline = (await brandLogoSrcs(asAnonymous)).slice().sort();
      expect(baseline.length, "expected at least one brand logo img").toBeGreaterThan(0);
      for (const src of baseline) {
        expect(src).toMatch(/\/branding\/logo-(light|dark)\.png$/);
      }

      for (let i = 0; i < 10; i += 1) {
        await asAnonymous.reload({ waitUntil: "networkidle" });
        await auth.expectLoaded();
        const srcs = (await brandLogoSrcs(asAnonymous)).slice().sort();
        expect(srcs, `hard refresh ${i + 1}`).toEqual(baseline);
      }
    });
  }
});
