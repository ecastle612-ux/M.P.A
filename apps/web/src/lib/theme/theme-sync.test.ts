import { describe, expect, it } from "vitest";
import {
  brandSurfaceToneForMode,
  isThemeMode,
  isThemePreference,
  resolveThemeMode
} from "./theme-sync";

describe("BR-002 theme sync", () => {
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

  it("validates cookie/storage values", () => {
    expect(isThemeMode("dark")).toBe(true);
    expect(isThemeMode("nope")).toBe(false);
    expect(isThemePreference("system")).toBe(true);
    expect(isThemePreference("auto")).toBe(false);
  });
});
