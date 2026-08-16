import { describe, expect, it } from "vitest";
import { appleInstallSteps, detectPwaInstallSurface } from "./install-experience";

describe("docs/165 PWA install surface", () => {
  it("never asks again when already standalone", () => {
    expect(
      detectPwaInstallSurface({
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        standalone: true,
        displayModeStandalone: true,
        canPrompt: true
      })
    ).toBe("standalone");
  });

  it("uses Apple Share guidance on iPhone and never beforeinstallprompt", () => {
    expect(
      detectPwaInstallSurface({
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        standalone: false,
        displayModeStandalone: false,
        canPrompt: true
      })
    ).toBe("apple");
    expect(appleInstallSteps()).toEqual(["Open Share", "Add to Home Screen", "Add"]);
  });

  it("uses Android install surface on Android", () => {
    expect(
      detectPwaInstallSurface({
        userAgent: "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0",
        standalone: false,
        displayModeStandalone: false,
        canPrompt: true
      })
    ).toBe("android");
  });
});
