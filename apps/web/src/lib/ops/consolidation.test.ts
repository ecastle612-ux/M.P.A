import { describe, expect, it } from "vitest";
import { consolidateDueReminders } from "./consolidation";

describe("consolidateDueReminders", () => {
  it("keeps emergency/high discrete", () => {
    const plan = consolidateDueReminders([
      {
        reminderId: "a",
        organizationId: "org",
        recipientPrincipalId: "u1",
        priority: "emergency",
        consolidationKey: "week",
        title: "Safety",
        fireAt: "2026-07-25T00:00:00Z"
      },
      {
        reminderId: "b",
        organizationId: "org",
        recipientPrincipalId: "u1",
        priority: "high",
        consolidationKey: "week",
        title: "Inspect",
        fireAt: "2026-07-25T00:00:00Z"
      }
    ]);
    expect(plan.discreteReminderIds).toEqual(["a", "b"]);
    expect(plan.digests).toHaveLength(0);
  });

  it("digests non-critical same recipient + key when ≥2", () => {
    const plan = consolidateDueReminders([
      {
        reminderId: "a",
        organizationId: "org",
        recipientPrincipalId: "u1",
        priority: "normal",
        consolidationKey: "week",
        title: "One",
        fireAt: "2026-07-25T00:00:00Z"
      },
      {
        reminderId: "b",
        organizationId: "org",
        recipientPrincipalId: "u1",
        priority: "low",
        consolidationKey: "week",
        title: "Two",
        fireAt: "2026-07-25T00:00:00Z"
      }
    ]);
    expect(plan.discreteReminderIds).toHaveLength(0);
    expect(plan.digests).toHaveLength(1);
    expect(plan.digests[0]?.reminderIds).toEqual(["a", "b"]);
    expect(plan.digests[0]?.title).toContain("2 reminders");
  });

  it("does not cross recipients", () => {
    const plan = consolidateDueReminders([
      {
        reminderId: "a",
        organizationId: "org",
        recipientPrincipalId: "u1",
        priority: "normal",
        consolidationKey: "week",
        title: "One",
        fireAt: "2026-07-25T00:00:00Z"
      },
      {
        reminderId: "b",
        organizationId: "org",
        recipientPrincipalId: "u2",
        priority: "normal",
        consolidationKey: "week",
        title: "Two",
        fireAt: "2026-07-25T00:00:00Z"
      }
    ]);
    expect(plan.digests).toHaveLength(0);
    expect(plan.discreteReminderIds).toEqual(["a", "b"]);
  });
});
