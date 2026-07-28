import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../observability/analytics", () => ({
  trackEvent: vi.fn()
}));

import { trackEvent } from "../observability/analytics";
import {
  ACQ_FUNNEL_EVENTS,
  emitAcqFunnelEvent,
  portfolioBandFromInput,
  resetAcqFunnelSessionForTests,
  sanitizeAcqFunnelProps
} from "./funnel";
import {
  checkAcquireRateLimit,
  resetAcquireRateLimitForTests
} from "./rate-limit";
import {
  ACQ_INDEXABLE_PATHS,
  ACQ_NOINDEX_PATHS,
  landingSoftwareApplicationJsonLd
} from "./seo";
import { ACQ_PRODUCTION_SCENARIOS, ACQ_SCENARIO_EVIDENCE } from "./certification";

describe("ACQ-001 Slice C funnel analytics", () => {
  beforeEach(() => {
    resetAcqFunnelSessionForTests();
    vi.mocked(trackEvent).mockClear();
  });

  it("strips PII keys from funnel props", () => {
    expect(
      sanitizeAcqFunnelProps({
        plan_code: "professional",
        email: "secret@example.com",
        companyName: "Acme",
        interval: "month"
      })
    ).toEqual({ plan_code: "professional", interval: "month" });
  });

  it("emits approved checkout_started event without PII", () => {
    emitAcqFunnelEvent(ACQ_FUNNEL_EVENTS.checkoutStarted, {
      plan_code: "trial",
      interval: "month",
      session_id: "cs_test_1",
      workEmail: "should-not-appear@x.test"
    });
    expect(trackEvent).toHaveBeenCalledWith({
      eventName: "acq.checkout_started",
      properties: {
        plan_code: "trial",
        interval: "month",
        session_id: "cs_test_1"
      }
    });
  });

  it("dedupes once-per-session events", () => {
    emitAcqFunnelEvent(ACQ_FUNNEL_EVENTS.landingViewed, {}, { oncePerSession: true, dedupeKey: "landing" });
    emitAcqFunnelEvent(ACQ_FUNNEL_EVENTS.landingViewed, {}, { oncePerSession: true, dedupeKey: "landing" });
    expect(trackEvent).toHaveBeenCalledTimes(1);
  });

  it("maps portfolio size to coarse bands", () => {
    expect(portfolioBandFromInput("3 doors")).toBe("1_9");
    expect(portfolioBandFromInput("25")).toBe("10_49");
    expect(portfolioBandFromInput("120 units")).toBe("50_199");
    expect(portfolioBandFromInput("500")).toBe("200_plus");
    expect(portfolioBandFromInput("")).toBeNull();
  });
});

describe("ACQ-001 Slice C rate limit", () => {
  beforeEach(() => {
    resetAcquireRateLimitForTests();
  });

  it("allows until limit then blocks", () => {
    const key = "acq.checkout:test";
    for (let i = 0; i < 3; i += 1) {
      expect(checkAcquireRateLimit({ key, limit: 3, windowMs: 60_000, now: 1_000 }).allowed).toBe(true);
    }
    const blocked = checkAcquireRateLimit({ key, limit: 3, windowMs: 60_000, now: 1_000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets after window", () => {
    const key = "acq.contact:test";
    expect(checkAcquireRateLimit({ key, limit: 1, windowMs: 1_000, now: 0 }).allowed).toBe(true);
    expect(checkAcquireRateLimit({ key, limit: 1, windowMs: 1_000, now: 0 }).allowed).toBe(false);
    expect(checkAcquireRateLimit({ key, limit: 1, windowMs: 1_000, now: 1_001 }).allowed).toBe(true);
  });
});

describe("ACQ-001 Slice C SEO helpers", () => {
  it("separates indexable marketing from acquire noindex paths", () => {
    expect(ACQ_INDEXABLE_PATHS).toContain("/pricing");
    expect(ACQ_NOINDEX_PATHS).toContain("/acquire/success");
    expect(ACQ_INDEXABLE_PATHS.some((path) => path.startsWith("/acquire"))).toBe(false);
  });

  it("builds SoftwareApplication JSON-LD without secrets", () => {
    const json = landingSoftwareApplicationJsonLd();
    expect(json["@type"]).toBe("SoftwareApplication");
    expect(JSON.stringify(json)).not.toMatch(/sk_live|password|secret/i);
  });
});

describe("ACQ-001 Slice C certification matrix", () => {
  it("covers happy and failure scenarios with evidence pointers", () => {
    expect(ACQ_PRODUCTION_SCENARIOS.length).toBeGreaterThanOrEqual(10);
    for (const scenario of ACQ_PRODUCTION_SCENARIOS) {
      expect(ACQ_SCENARIO_EVIDENCE[scenario.id]?.length).toBeGreaterThan(0);
    }
  });
});
