import { describe, expect, it } from "vitest";
import { entitlementsForSku, staffHasTenantCommsEntitlement } from "@mpa/shared";

describe("COM-002 conversation permission matrix", () => {
  it("allows Property Manager and Complete, denies Facility Operations", () => {
    expect(staffHasTenantCommsEntitlement(entitlementsForSku("mpa_property_manager"))).toBe(true);
    expect(staffHasTenantCommsEntitlement(entitlementsForSku("mpa_complete_platform"))).toBe(true);
    expect(staffHasTenantCommsEntitlement(entitlementsForSku("mpa_facility_operations"))).toBe(false);
  });
});
