import { describe, expect, it } from "vitest";
import {
  MPA_BRAND_MIN_MARK_PX,
  MPA_LOGO_DARK_PATH,
  MPA_LOGO_LIGHT_PATH,
  logoPathForTone,
  resolveBrandPresentation
} from "./branding";

describe("theme logo switch", () => {
  it("uses logo-dark on light surfaces and logo-light on dark surfaces", () => {
    expect(logoPathForTone("light-surface")).toBe(MPA_LOGO_DARK_PATH);
    expect(logoPathForTone("dark-surface")).toBe(MPA_LOGO_LIGHT_PATH);
  });
});

describe("resolveBrandPresentation", () => {
  it("uses full theme logo for login/loading/header", () => {
    const login = resolveBrandPresentation("login");
    const loading = resolveBrandPresentation("loading");
    const header = resolveBrandPresentation("header");

    expect(login.mode).toBe("hero");
    expect(login.markRole).toBe("display");
    expect(login.showBrandName).toBe(false);
    expect(login.markPx).toBeGreaterThanOrEqual(MPA_BRAND_MIN_MARK_PX.authentication);

    expect(loading.markRole).toBe("display");
    expect(loading.showBrandName).toBe(false);
    expect(loading.markPx).toBeGreaterThanOrEqual(96);

    expect(header.markRole).toBe("display");
    expect(header.showBrandName).toBe(false);
    expect(header.markPx).toBeGreaterThanOrEqual(MPA_BRAND_MIN_MARK_PX.navigation);
  });

  it("reserves icon mode for browser only", () => {
    expect(resolveBrandPresentation("browser").mode).toBe("icon");
    expect(resolveBrandPresentation("browser").allowsIconOnly).toBe(true);
  });
});
