import { describe, expect, it } from "vitest";
import { scoreFromMilestones } from "./progress";
import { reminderKeysDue } from "./trial";
import {
  IMPLEMENTATION_MILESTONES,
  MILESTONE_SCORE,
  type MilestoneState
} from "./progress-types";

function milestone(
  complete: boolean,
  waived = false
): MilestoneState {
  return {
    complete,
    waived,
    completedAt: complete || waived ? "2026-07-24T00:00:00.000Z" : null,
    deferralReason: waived ? "deferred" : null
  };
}

describe("COM-001 Slice B implementation score", () => {
  it("returns 0 until organization_created is satisfied", () => {
    const milestones = Object.fromEntries(
      IMPLEMENTATION_MILESTONES.map((key) => [key, milestone(false)])
    ) as Record<(typeof IMPLEMENTATION_MILESTONES)[number], MilestoneState>;
    milestones.purchased = milestone(true);
    expect(scoreFromMilestones(milestones)).toBe(0);
  });

  it("uses highest completed milestone score (monotonic ladder)", () => {
    const milestones = Object.fromEntries(
      IMPLEMENTATION_MILESTONES.map((key) => [key, milestone(false)])
    ) as Record<(typeof IMPLEMENTATION_MILESTONES)[number], MilestoneState>;
    milestones.purchased = milestone(true);
    milestones.organization_created = milestone(true);
    milestones.stripe_connected = milestone(true);
    expect(scoreFromMilestones(milestones)).toBe(MILESTONE_SCORE.stripe_connected);
  });

  it("never reaches 100 without production_ready", () => {
    const milestones = Object.fromEntries(
      IMPLEMENTATION_MILESTONES.map((key) => [key, milestone(true)])
    ) as Record<(typeof IMPLEMENTATION_MILESTONES)[number], MilestoneState>;
    milestones.production_ready = milestone(false);
    expect(scoreFromMilestones(milestones)).toBe(MILESTONE_SCORE.team_invited);
  });

  it("counts waived milestones toward the ladder", () => {
    const milestones = Object.fromEntries(
      IMPLEMENTATION_MILESTONES.map((key) => [key, milestone(false)])
    ) as Record<(typeof IMPLEMENTATION_MILESTONES)[number], MilestoneState>;
    milestones.purchased = milestone(true);
    milestones.organization_created = milestone(true);
    milestones.stripe_connected = milestone(false, true);
    expect(scoreFromMilestones(milestones)).toBe(MILESTONE_SCORE.stripe_connected);
  });
});

describe("COM-001 Slice B trial reminders", () => {
  it("emits day0/day3 when elapsed and not yet recorded", () => {
    const clock = "2026-07-01T00:00:00.000Z";
    const ends = "2026-07-15T00:00:00.000Z";
    const now = Date.parse("2026-07-05T12:00:00.000Z");
    const due = reminderKeysDue({
      status: "trial_active",
      clockStartedAt: clock,
      trialEndsAt: ends,
      reminders: { day0: "2026-07-01T00:00:00.000Z" },
      nowMs: now
    });
    expect(due).toContain("day3");
    expect(due).not.toContain("day0");
  });

  it("marks grace reminder when in trial_grace", () => {
    const due = reminderKeysDue({
      status: "trial_grace",
      clockStartedAt: "2026-07-01T00:00:00.000Z",
      trialEndsAt: "2026-07-15T00:00:00.000Z",
      reminders: {},
      nowMs: Date.parse("2026-07-16T00:00:00.000Z")
    });
    expect(due).toContain("grace");
    expect(due).toContain("expiry");
  });
});
