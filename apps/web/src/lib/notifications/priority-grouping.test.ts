import { describe, expect, it } from "vitest";
import {
  groupNotificationsByPriority,
  notificationPriorityGroup
} from "./priority-grouping";
import type { InAppNotificationRecord } from "./contracts";

function note(
  overrides: Partial<InAppNotificationRecord> &
    Pick<InAppNotificationRecord, "priority" | "category" | "createdAt">
): Pick<InAppNotificationRecord, "priority" | "category" | "createdAt" | "id" | "title"> {
  return {
    id: overrides.id ?? "n1",
    title: overrides.title ?? "Notice",
    priority: overrides.priority,
    category: overrides.category,
    createdAt: overrides.createdAt
  };
}

describe("notificationPriorityGroup (UX-016 Slice D)", () => {
  const now = new Date("2026-08-05T15:00:00.000Z");

  it("maps emergency to Critical", () => {
    expect(
      notificationPriorityGroup(
        note({
          priority: "emergency",
          category: "maintenance",
          createdAt: "2026-08-01T12:00:00.000Z"
        }),
        now
      )
    ).toBe("critical");
  });

  it("maps high maintenance to Critical", () => {
    expect(
      notificationPriorityGroup(
        note({
          priority: "high",
          category: "maintenance",
          createdAt: "2026-08-05T10:00:00.000Z"
        }),
        now
      )
    ).toBe("critical");
  });

  it("maps same-day normal to Today", () => {
    expect(
      notificationPriorityGroup(
        note({
          priority: "normal",
          category: "messages",
          createdAt: "2026-08-05T12:00:00.000Z"
        }),
        now
      )
    ).toBe("today");
  });

  it("maps announcements and low priority to Later", () => {
    expect(
      notificationPriorityGroup(
        note({
          priority: "low",
          category: "announcements",
          createdAt: "2026-08-05T12:00:00.000Z"
        }),
        now
      )
    ).toBe("later");
  });

  it("groups lists and omits empty consumers via empty arrays", () => {
    const groups = groupNotificationsByPriority(
      [
        note({
          id: "c1",
          priority: "emergency",
          category: "emergency",
          createdAt: "2026-08-05T12:00:00.000Z"
        }),
        note({
          id: "t1",
          priority: "normal",
          category: "messages",
          createdAt: "2026-08-05T12:00:00.000Z"
        }),
        note({
          id: "l1",
          priority: "low",
          category: "system",
          createdAt: "2026-08-01T12:00:00.000Z"
        })
      ],
      now
    );

    expect(groups.critical.map((n) => n.id)).toEqual(["c1"]);
    expect(groups.today.map((n) => n.id)).toEqual(["t1"]);
    expect(groups.later.map((n) => n.id)).toEqual(["l1"]);
  });
});
