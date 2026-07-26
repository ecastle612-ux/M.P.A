import { describe, expect, it } from "vitest";
import { mapMaintenanceActivityToCatalog } from "./catalog";

describe("mapMaintenanceActivityToCatalog", () => {
  it("maps maintenance chain events", () => {
    expect(mapMaintenanceActivityToCatalog("created")).toBe("maintenance.request.created");
    expect(mapMaintenanceActivityToCatalog("vendor_accepted")).toBe("maintenance.vendor.accepted");
    expect(mapMaintenanceActivityToCatalog("vendor_job_accepted")).toBe(
      "maintenance.vendor.accepted"
    );
    expect(mapMaintenanceActivityToCatalog("vendor_job_declined")).toBe(
      "maintenance.vendor.declined"
    );
    expect(mapMaintenanceActivityToCatalog("vendor_job_started")).toBe(
      "maintenance.technician.arrived"
    );
    expect(mapMaintenanceActivityToCatalog("completed")).toBe("maintenance.work.completed");
    expect(mapMaintenanceActivityToCatalog("vendor_job_finished")).toBe(
      "maintenance.work.completed"
    );
  });

  it("maps vendor assign only when vendor id present", () => {
    expect(mapMaintenanceActivityToCatalog("assigned", {})).toBeNull();
    expect(mapMaintenanceActivityToCatalog("assigned", { vendorId: "v1" })).toBe(
      "maintenance.vendor.assigned"
    );
  });
});
