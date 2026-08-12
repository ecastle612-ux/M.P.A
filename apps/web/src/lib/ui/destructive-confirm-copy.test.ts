import { describe, expect, it } from "vitest";
import {
  applicationDenyConfirmation,
  workOrderCancelConfirmation,
  workOrderCompleteConfirmation
} from "./destructive-confirm-copy";
import {
  CANCEL_CONFIRMATION_POINTS,
  PUBLIC_PRICING_MODEL_COPY
} from "@mpa/shared";

describe("destructive confirmation copy (PPS1-004)", () => {
  it("identifies the work order and states immediate lifecycle change", () => {
    const copy = workOrderCancelConfirmation({
      title: "Fix boiler",
      statusLabel: "Assigned"
    });
    expect(copy.what).toMatch(/Fix boiler/);
    expect(copy.when).toMatch(/immediately/i);
    expect(copy.irreversible).toMatch(/lifecycle/i);
  });

  it("confirms FO completion closes work", () => {
    const copy = workOrderCompleteConfirmation({ title: "Inspect AHU" });
    expect(copy.what).toMatch(/Inspect AHU/);
    expect(copy.what).toMatch(/closed/i);
  });

  it("confirms leasing denial impact", () => {
    const copy = applicationDenyConfirmation({ applicantName: "Alex Resident" });
    expect(copy.what).toMatch(/Alex Resident/);
    expect(copy.irreversible).toMatch(/Denial/i);
  });

  it("preserves approved subscription cancellation policy points", () => {
    expect(PUBLIC_PRICING_MODEL_COPY.cancellationSummary).toMatch(/No refunds/i);
    expect(CANCEL_CONFIRMATION_POINTS.join(" ")).toMatch(/period/i);
    expect(CANCEL_CONFIRMATION_POINTS.join(" ")).toMatch(/Access continues/i);
  });
});
