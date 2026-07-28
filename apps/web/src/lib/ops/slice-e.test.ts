import { describe, expect, it } from "vitest";
import { globalSearch } from "./global-search";
import { executeQuickAction, listQuickActionsForContext } from "./quick-actions";

describe("OPS-001 Slice E global search fail-closed", () => {
  it("returns empty when query is blank (no leakage)", async () => {
    const result = await globalSearch({
      organizationId: "00000000-0000-0000-0000-000000000001",
      principalId: "user-1",
      query: "   ",
      permissions: []
    });
    expect(result.hits).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.deniedCorpora).toEqual([]);
  });

  it("denies corpora when permissions are missing", async () => {
    const result = await globalSearch({
      organizationId: "00000000-0000-0000-0000-000000000001",
      principalId: "user-1",
      query: "lease",
      permissions: [],
      corpora: ["tasks", "ai", "commands", "properties", "leases"]
    });
    expect(result.hits).toEqual([]);
    expect(result.deniedCorpora).toEqual(
      expect.arrayContaining(["tasks", "ai", "commands", "properties", "leases"])
    );
  });

  it("surfaces Commands corpus for entitled users without domain table access", async () => {
    const result = await globalSearch({
      organizationId: "00000000-0000-0000-0000-000000000001",
      principalId: "user-1",
      query: "inbox",
      permissions: ["maintenance:read"],
      corpora: ["commands", "properties"]
    });
    expect(result.deniedCorpora).toContain("properties");
    expect(result.hits.some((hit) => hit.corpus === "commands")).toBe(true);
  });
});

describe("OPS-001 Slice E quick actions", () => {
  it("filters catalog by permission and context", () => {
    const entitled = listQuickActionsForContext({
      rolePlane: "property_manager",
      permissions: ["maintenance:write", "maintenance:read"],
      context: "command_center"
    });
    expect(entitled.some((a) => a.actionId === "create_task")).toBe(true);
    expect(entitled.some((a) => a.actionId === "open_inbox")).toBe(true);

    const denied = listQuickActionsForContext({
      rolePlane: "leasing_agent",
      permissions: [],
      context: "command_center"
    });
    expect(denied).toEqual([]);
  });

  it("rejects forbidden executeQuickAction without mutation", async () => {
    const result = await executeQuickAction({
      organizationId: "00000000-0000-0000-0000-000000000001",
      principalId: "user-1",
      actionId: "create_task",
      permissions: []
    });
    expect(result).toEqual({ ok: false, error: "Forbidden" });
  });

  it("rejects unknown action ids", async () => {
    const result = await executeQuickAction({
      organizationId: "00000000-0000-0000-0000-000000000001",
      principalId: "user-1",
      actionId: "not-a-real-action",
      permissions: ["maintenance:write"]
    });
    expect(result).toEqual({ ok: false, error: "Unknown action" });
  });
});
