import { describe, expect, it } from "vitest";
import { hasPlatformMasterAdminGrant } from "./access";

describe("hasPlatformMasterAdminGrant (MAC-002)", () => {
  it("grants only via app_metadata.dev_master_admin", () => {
    expect(hasPlatformMasterAdminGrant({ app_metadata: { dev_master_admin: true } })).toBe(true);
    expect(hasPlatformMasterAdminGrant({ app_metadata: { dev_master_admin: false } })).toBe(false);
    expect(hasPlatformMasterAdminGrant({ app_metadata: {} })).toBe(false);
    expect(hasPlatformMasterAdminGrant(null)).toBe(false);
  });

  it("does not treat arbitrary metadata as a grant", () => {
    expect(
      hasPlatformMasterAdminGrant({
        app_metadata: { role: "master_admin", master_admin: true }
      })
    ).toBe(false);
  });
});
