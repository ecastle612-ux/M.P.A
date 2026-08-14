import { describe, expect, it } from "vitest";
import { entitlementsForSku } from "@mpa/shared";
import { assertConnectionAccess, assertNoWritebackPath } from "./connection-service";

describe("OPS-001 connection authorization", () => {
  it("denies FAC-003 reads when only platform.documents is granted", () => {
    expect(() => assertConnectionAccess(["platform.documents"], "facility_assets", null)).toThrow(
      /not permission/
    );
    expect(() =>
      assertConnectionAccess(entitlementsForSku("mpa_property_manager"), "facility_stock", null)
    ).toThrow(/Forbidden|not permission/);
  });

  it("allows FO assets and facility work orders, denies residential WOs", () => {
    const fo = entitlementsForSku("mpa_facility_operations");
    expect(() => assertConnectionAccess(fo, "facility_assets", null)).not.toThrow();
    expect(() => assertConnectionAccess(fo, "work_orders", "facility")).not.toThrow();
    expect(() => assertConnectionAccess(fo, "work_orders", "residential")).toThrow();
  });

  it("allows Complete the union and never writeback", () => {
    const complete = entitlementsForSku("mpa_complete_platform");
    expect(() => assertConnectionAccess(complete, "facility_assets", null)).not.toThrow();
    expect(() => assertConnectionAccess(complete, "work_orders", "residential")).not.toThrow();
    expect(() => assertNoWritebackPath()).toThrow(/read-only/);
  });
});
