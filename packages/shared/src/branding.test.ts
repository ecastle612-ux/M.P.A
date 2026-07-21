import { describe, expect, it } from "vitest";
import {
  MPA_BRAND_MIN_MARK_PX,
  resolveBrandPresentation
} from "./branding";

describe("BR-002 resolveBrandPresentation", () => {
  it("uses Hero lockup for login and splash", () => {
    const login = resolveBrandPresentation("login");
    const splash = resolveBrandPresentation("splash");
    expect(login.mode).toBe("hero");
    expect(login.showProductLine).toBe(true);
    expect(login.markPx).toBeGreaterThanOrEqual(MPA_BRAND_MIN_MARK_PX.authentication);
    expect(splash.markPx).toBeGreaterThanOrEqual(MPA_BRAND_MIN_MARK_PX.splash);
  });

  it("uses house-mark-only loading (no typography lockup)", () => {
    const loading = resolveBrandPresentation("loading");
    expect(loading.mode).toBe("loading");
    expect(loading.markRole).toBe("symbol");
    expect(loading.showBrandName).toBe(false);
    expect(loading.useLockup).toBe(false);
    expect(loading.markPx).toBeGreaterThanOrEqual(96);
  });

  it("uses symbol role for header so UI never relies on PNG wordmark", () => {
    const header = resolveBrandPresentation("header");
    expect(header.markRole).toBe("symbol");
    expect(header.showBrandName).toBe(true);
    expect(header.layout).toBe("inline");
  });

  it("uses typography-first drawer with tagline when expanded", () => {
    const drawer = resolveBrandPresentation("drawer");
    expect(drawer.markRole).toBe("symbol");
    expect(drawer.showBrandName).toBe(true);
    expect(drawer.showTagline).toBe(true);
    expect(drawer.layout).toBe("stack");
    expect(drawer.brandNameScale).toBe("large");
    expect(drawer.allowsIconOnly).toBe(false);
  });

  it("keeps sidebar typography when collapsed (never icon-only chrome)", () => {
    const collapsed = resolveBrandPresentation("sidebar", { collapsed: true });
    expect(collapsed.showBrandName).toBe(true);
    expect(collapsed.markRole).toBe("symbol");
    expect(collapsed.allowsIconOnly).toBe(false);
  });

  it("reserves icon mode for browser only", () => {
    expect(resolveBrandPresentation("browser").mode).toBe("icon");
    expect(resolveBrandPresentation("browser").allowsIconOnly).toBe(true);
  });
});
