import { describe, expect, it } from "vitest";
import {
  backgroundColorForMode,
  MPA_PWA_BACKGROUND_COLOR_LIGHT,
  MPA_PWA_THEME_COLOR_DARK,
  MPA_PWA_THEME_COLOR_LIGHT,
  themeColorForMode
} from "./native-shell-theme";
import { computeKeyboardInset } from "./visual-viewport";

describe("PMX-004 Phase 3 native shell theme", () => {
  it("uses Canopy brand navy for light status chrome", () => {
    expect(themeColorForMode("light")).toBe(MPA_PWA_THEME_COLOR_LIGHT);
    expect(MPA_PWA_THEME_COLOR_LIGHT).toBe("#0D2645");
  });

  it("uses dark app background for dark status chrome", () => {
    expect(themeColorForMode("dark")).toBe(MPA_PWA_THEME_COLOR_DARK);
    expect(backgroundColorForMode("light")).toBe(MPA_PWA_BACKGROUND_COLOR_LIGHT);
  });
});

describe("PMX-004 Phase 3 visualViewport keyboard inset", () => {
  it("returns 0 when visualViewport is missing", () => {
    expect(computeKeyboardInset(null, 800)).toBe(0);
  });

  it("returns 0 when keyboard is not open", () => {
    expect(computeKeyboardInset({ height: 800, offsetTop: 0 }, 800)).toBe(0);
  });

  it("computes residual below the visual viewport", () => {
    expect(computeKeyboardInset({ height: 500, offsetTop: 0 }, 800)).toBe(300);
  });

  it("accounts for visualViewport offsetTop (iOS URL/chrome)", () => {
    expect(computeKeyboardInset({ height: 520, offsetTop: 40 }, 800)).toBe(240);
  });

  it("never returns negative insets", () => {
    expect(computeKeyboardInset({ height: 900, offsetTop: 0 }, 800)).toBe(0);
  });
});
