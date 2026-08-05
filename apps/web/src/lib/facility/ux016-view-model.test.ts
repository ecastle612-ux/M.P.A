import { describe, expect, it } from "vitest";
import type { WorkOrderListItem } from "../maintenance/server";
import { buildFacilityUniversalDashboardViewModel } from "./ux016-view-model";

function wo(partial: Partial<WorkOrderListItem> & Pick<WorkOrderListItem, "id">): WorkOrderListItem {
  return {
    organizationId: "org-1",
    propertyId: "p1",
    unitId: null,
    tenantId: null,
    workOrderNumber: `WO-${partial.id}`,
    title: `Job ${partial.id}`,
    description: null,
    category: "electrical",
    priority: "high",
    status: "assigned",
    dueDate: null,
    assignedToUserId: "tech-1",
    vendorId: null,
    currentVendorAssignmentId: null,
    internalNotes: null,
    tenantNotes: null,
    photoPlaceholder: null,
    documentPlaceholder: null,
    recurringMaintenancePlaceholder: null,
    preventiveMaintenancePlaceholder: null,
    completedAt: null,
    metadata: {},
    createdBy: "u1",
    updatedBy: "u1",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-05T00:00:00.000Z",
    archivedAt: null,
    deletedAt: null,
    propertyName: "Oak Court",
    unitNumber: "2C",
    tenantName: null,
    ...partial
  };
}

describe("buildFacilityUniversalDashboardViewModel (STD-001)", () => {
  it("mounts Facility Operations with bucket-derived attention", () => {
    const model = buildFacilityUniversalDashboardViewModel({
      buckets: {
        today: [wo({ id: "t1" })],
        overdue: [wo({ id: "o1", priority: "emergency" })],
        waiting: [wo({ id: "w1", status: "on_hold", priority: "medium" })],
        unassignedPool: [wo({ id: "u1", assignedToUserId: null })]
      },
      canCreateWorkOrder: true,
      canWriteInventory: true,
      userName: "Casey",
      organizationName: "Canopy PM",
      timeGreeting: "Good morning",
      dateLabel: "Wednesday, August 5, 2026"
    });

    expect(model.greeting.surfaceLabel).toBe("Facility Operations");
    expect(model.attention[0]?.id).toContain("fac-");
    expect(model.mission.some((row) => /overdue/i.test(row.label))).toBe(true);
    expect(model.quickActions.some((action) => action.id === "qa-inventory")).toBe(true);
    expect(model.greeting.placeLabel.toLowerCase()).toContain("overdue");
  });
});
