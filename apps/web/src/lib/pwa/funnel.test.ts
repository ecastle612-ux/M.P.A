import { beforeEach, describe, expect, it, vi } from "vitest";
import { emitPwaFunnelEvent, PWA_FUNNEL_EVENTS, resetPwaFunnelSessionForTests } from "./funnel";

vi.mock("../observability/analytics", () => ({
  trackEvent: vi.fn()
}));

import { trackEvent } from "../observability/analytics";

describe("PMX-004 Phase 2 funnel events", () => {
  beforeEach(() => {
    resetPwaFunnelSessionForTests();
    vi.mocked(trackEvent).mockClear();
  });

  it("emits secret-free landing once per session", () => {
    const props = {
      platform: "android-chrome" as const,
      standalone: false,
      role: "property_manager",
      organizationId: "org-1"
    };
    emitPwaFunnelEvent(PWA_FUNNEL_EVENTS.landing, props);
    emitPwaFunnelEvent(PWA_FUNNEL_EVENTS.landing, props);
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith({
      eventName: "pwa_funnel_landing",
      properties: {
        platform: "android-chrome",
        standalone: false,
        role: "property_manager",
        organizationId: "org-1"
      }
    });
  });
});
