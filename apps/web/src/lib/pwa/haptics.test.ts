import { afterEach, describe, expect, it, vi } from "vitest";

import { triggerHaptic } from "./haptics";

describe("PMX-004 Phase 5 haptics", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("no-ops when vibrate is missing", () => {
    vi.stubGlobal("navigator", {});
    expect(() => triggerHaptic("confirm")).not.toThrow();
  });

  it("no-ops under prefers-reduced-motion", () => {
    const vibrate = vi.fn(() => true);
    vi.stubGlobal("navigator", { vibrate });
    vi.stubGlobal("matchMedia", () => ({
      matches: true,
      media: "(prefers-reduced-motion: reduce)"
    }));
    triggerHaptic("destructive");
    expect(vibrate).not.toHaveBeenCalled();
  });

  it("vibrates confirm pattern when motion allowed", () => {
    const vibrate = vi.fn(() => true);
    vi.stubGlobal("navigator", { vibrate });
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      media: "(prefers-reduced-motion: reduce)"
    }));
    triggerHaptic("confirm");
    expect(vibrate).toHaveBeenCalledWith(10);
  });
});
