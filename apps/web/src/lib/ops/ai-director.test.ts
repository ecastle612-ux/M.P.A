import { describe, expect, it } from "vitest";
import {
  confidenceBand,
  isForbiddenAiAloneAction,
  requiresHumanGate
} from "./ai-director";
import { automationFireIdempotencyKey } from "./automation-engine";

describe("OPS-001 Slice D AI Operations Director gates", () => {
  it("bands confidence high/medium/low", () => {
    expect(confidenceBand(0.9)).toBe("high");
    expect(confidenceBand(0.7)).toBe("medium");
    expect(confidenceBand(0.4)).toBe("low");
  });

  it("requires human gate for mutating/outbound classes", () => {
    expect(requiresHumanGate("escalate")).toBe(true);
    expect(requiresHumanGate("reassign")).toBe(true);
    expect(requiresHumanGate("create_task")).toBe(true);
    expect(requiresHumanGate("outbound_message")).toBe(true);
    expect(requiresHumanGate("draft")).toBe(true);
    expect(requiresHumanGate("label")).toBe(false);
    expect(requiresHumanGate("recommend")).toBe(false);
    expect(requiresHumanGate("alert")).toBe(false);
  });

  it("forbids AI-alone financial/permission actions", () => {
    expect(isForbiddenAiAloneAction("write_off")).toBe(true);
    expect(isForbiddenAiAloneAction("refund_payment")).toBe(true);
    expect(isForbiddenAiAloneAction("reset_admin")).toBe(true);
    expect(isForbiddenAiAloneAction("escalate_priority")).toBe(false);
  });
});

describe("OPS-001 Slice D Automation Engine idempotency", () => {
  it("builds stable fire keys from rule + event", () => {
    expect(automationFireIdempotencyKey("rule-1", "event-1")).toBe("rule-1:event-1");
    expect(automationFireIdempotencyKey("rule-1", "event-1")).toBe(
      automationFireIdempotencyKey("rule-1", "event-1")
    );
  });
});
