import { describe, expect, it } from "vitest";
import { isExplicitlyBlockedOffline, matchAllowlistedRequest } from "./allowlist";

describe("PMX-004 Phase 7 outbox allowlist", () => {
  it("allows messaging send", () => {
    const match = matchAllowlistedRequest("POST", "/api/messaging/threads/t1/messages", {
      body: "hi",
      visibility: "resident"
    });
    expect(match?.workflow).toBe("message_send");
  });

  it("allows maintenance note updates only", () => {
    expect(
      matchAllowlistedRequest("PATCH", "/api/maintenance/wo-1", { action: "update", internalNotes: "n" })
        ?.workflow
    ).toBe("maintenance_notes");
    expect(matchAllowlistedRequest("POST", "/api/maintenance", { title: "x" })).toBeNull();
    expect(
      matchAllowlistedRequest("PATCH", "/api/maintenance/wo-1", { action: "complete" })
    ).toBeNull();
  });

  it("allows media intent and vendor photo", () => {
    expect(matchAllowlistedRequest("POST", "/api/media/intent", { kind: "work_order_photo" })?.workflow).toBe(
      "maintenance_photo"
    );
    expect(matchAllowlistedRequest("POST", "/api/vendor-jobs/tok/photo", {})?.workflow).toBe("vendor_photo");
  });

  it("blocks payments auth org-switch master-admin deletes", () => {
    expect(isExplicitlyBlockedOffline("POST", "/api/payments")).toBe(true);
    expect(isExplicitlyBlockedOffline("POST", "/api/organizations/switch")).toBe(true);
    expect(isExplicitlyBlockedOffline("POST", "/api/master-admin/seed")).toBe(true);
    expect(isExplicitlyBlockedOffline("DELETE", "/api/properties/p1")).toBe(true);
    expect(isExplicitlyBlockedOffline("POST", "/api/messaging/threads/t1/messages")).toBe(false);
  });
});
