import { describe, expect, it } from "vitest";
import { parseAnnouncementMutationInput, parseCreateAnnouncementInput } from "./contracts";

describe("communication contracts", () => {
  it("parses create announcement input", () => {
    const parsed = parseCreateAnnouncementInput({
      title: "Pool closure",
      message: "The pool will close at 6 PM for maintenance.",
      priority: "high",
      category: "community",
      targetingScope: "property",
      targetPropertyId: "00000000-0000-4000-8000-000000000001"
    });
    expect(parsed?.title).toBe("Pool closure");
    expect(parsed?.priority).toBe("high");
    expect(parsed?.targetingScope).toBe("property");
  });

  it("rejects invalid create payload", () => {
    expect(parseCreateAnnouncementInput({ title: "", message: "x" })).toBeNull();
  });

  it("parses publish mutation", () => {
    expect(parseAnnouncementMutationInput({ action: "publish_now" })).toEqual({ action: "publish_now" });
  });

  it("parses schedule mutation", () => {
    expect(parseAnnouncementMutationInput({ action: "schedule", scheduledAt: "2026-08-01T12:00:00.000Z" })).toEqual({
      action: "schedule",
      scheduledAt: "2026-08-01T12:00:00.000Z"
    });
  });
});
