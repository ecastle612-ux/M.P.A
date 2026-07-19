import { describe, expect, it } from "vitest";
import { createRecentActionDedupe, createSubmissionGuard } from "./submission-guard";

describe("submission guard", () => {
  it("blocks concurrent begins until end", () => {
    const guard = createSubmissionGuard();
    expect(guard.begin()).toBe(true);
    expect(guard.begin()).toBe(false);
    guard.end();
    expect(guard.begin()).toBe(true);
  });

  it("dedupes identical keys inside the window", () => {
    const dedupe = createRecentActionDedupe(5_000);
    expect(dedupe.claim("pay:1")).toBe(true);
    expect(dedupe.claim("pay:1")).toBe(false);
    expect(dedupe.claim("pay:2")).toBe(true);
  });
});
