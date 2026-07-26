import { describe, expect, it } from "vitest";
import { detectPwaPlatform, isInstallCoachingEligible } from "./platform";

describe("PMX-004 Phase 2 platform detection", () => {
  it("detects iOS Safari / iPhone", () => {
    expect(
      detectPwaPlatform(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
      )
    ).toBe("ios-safari");
  });

  it("detects Android Chrome", () => {
    expect(
      detectPwaPlatform(
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
      )
    ).toBe("android-chrome");
  });

  it("detects desktop", () => {
    expect(
      detectPwaPlatform(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      )
    ).toBe("desktop");
  });

  it("coaching eligibility respects standalone", () => {
    expect(isInstallCoachingEligible("android-chrome", true)).toBe(false);
    expect(isInstallCoachingEligible("android-chrome", false)).toBe(true);
    expect(isInstallCoachingEligible("ios-safari", false)).toBe(true);
  });
});
