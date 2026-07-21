import { describe, expect, it } from "vitest";
import {
  MPA_BRAND_EMBEDDED_TEXT_MIN_PX,
  MPA_BRAND_MIN_MARK_PX,
  resolveBrandPresentation
} from "./branding";

describe("BR-001 resolveBrandPresentation", () => {
  it("uses Hero mode for login and splash with floors", () => {
    const login = resolveBrandPresentation("login");
    const splash = resolveBrandPresentation("splash");
    expect(login.mode).toBe("hero");
    expect(login.markPx).toBeGreaterThanOrEqual(MPA_BRAND_MIN_MARK_PX.authentication);
    expect(login.showProductLine).toBe(true);
    expect(splash.markPx).toBeGreaterThanOrEqual(MPA_BRAND_MIN_MARK_PX.splash);
  });

  it("uses Compact lockup for drawer and never icon-only", () => {
    const drawer = resolveBrandPresentation("drawer");
    expect(drawer.mode).toBe("compact");
    expect(drawer.showBrandName).toBe(true);
    expect(drawer.allowsIconOnly).toBe(false);
    expect(drawer.useLockup || drawer.markPx >= MPA_BRAND_EMBEDDED_TEXT_MIN_PX).toBe(true);
  });

  it("uses Standard for expanded sidebar and Compact when collapsed", () => {
    expect(resolveBrandPresentation("sidebar").mode).toBe("standard");
    expect(resolveBrandPresentation("sidebar", { collapsed: true }).mode).toBe("compact");
  });

  it("reserves icon mode for browser only", () => {
    expect(resolveBrandPresentation("browser").mode).toBe("icon");
    expect(resolveBrandPresentation("browser").allowsIconOnly).toBe(true);
  });
});
