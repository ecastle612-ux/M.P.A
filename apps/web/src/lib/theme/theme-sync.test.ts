import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME_PREFERENCE,
  brandSurfaceToneForMode,
  buildThemeInitScript,
  isThemeMode,
  isThemePreference,
  resolveThemeMode
} from "./theme-sync";

describe("BR-002 theme sync", () => {
  it("defaults first-visit preference to light", () => {
    expect(DEFAULT_THEME_PREFERENCE).toBe("light");
  });

  it("resolves system preference from OS flag", () => {
    expect(resolveThemeMode("system", true)).toBe("dark");
    expect(resolveThemeMode("system", false)).toBe("light");
    expect(resolveThemeMode("dark", false)).toBe("dark");
    expect(resolveThemeMode("light", true)).toBe("light");
  });

  it("maps mode to brand surface tone", () => {
    expect(brandSurfaceToneForMode("dark")).toBe("dark-surface");
    expect(brandSurfaceToneForMode("light")).toBe("light-surface");
  });

  it("theme init script sets data-brand-surface with data-theme", () => {
    const script = buildThemeInitScript();
    expect(script).toContain('data-brand-surface');
    expect(script).toContain("dark-surface");
    expect(script).toContain("light-surface");
    expect(script).toContain("dataset.theme");
  });

  it("validates cookie/storage values", () => {
    expect(isThemeMode("dark")).toBe(true);
    expect(isThemeMode("nope")).toBe(false);
    expect(isThemePreference("system")).toBe(true);
    expect(isThemePreference("auto")).toBe(false);
  });
});
