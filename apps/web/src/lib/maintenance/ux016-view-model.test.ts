import { describe, expect, it } from "vitest";
import type { WorkOrderListItem } from "./server";
import { buildMaintenanceUniversalDashboardViewModel } from "./ux016-view-model";

function wo(
  partial: Partial<WorkOrderListItem> & Pick<WorkOrderListItem, "id" | "priority" | "status">
): WorkOrderListItem {
  return {
    organizationId: "org-1",
    propertyId: "p1",
    unitId: null,
    tenantId: null,
    workOrderNumber: `WO-${partial.id}`,
    title: `Work ${partial.id}`,
    description: null,
    category: "plumbing",
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
    unitNumber: "1A",
    tenantName: null,
    ...partial
  };
}

describe("buildMaintenanceUniversalDashboardViewModel (STD-001)", () => {
  it("mounts Maintenance Home with queue signals", () => {
    const model = buildMaintenanceUniversalDashboardViewModel({
      items: [wo({ id: "1", priority: "high", status: "submitted" })],
      canCreate: true,
      userName: "Riley",
      organizationName: "Canopy PM",
      timeGreeting: "Good morning",
      dateLabel: "Wednesday, August 5, 2026"
    });

    expect(model.greeting.surfaceLabel).toBe("Maintenance Home");
    expect(model.attention.some((item) => item.id === "maint-high")).toBe(true);
    expect(model.quickActions[0]?.id).toBe("qa-new-wo");
  });

  it("prioritizes emergency and overdue in Immediate Attention", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const model = buildMaintenanceUniversalDashboardViewModel({
      items: [
        wo({ id: "e1", priority: "emergency", status: "assigned" }),
        wo({
          id: "o1",
          priority: "medium",
          status: "in_progress",
          dueDate: yesterday.toISOString()
        })
      ],
      canCreate: false,
      timeGreeting: "Good afternoon",
      dateLabel: "Wednesday, August 5, 2026"
    });

    expect(model.attention[0]?.id).toBe("maint-emergency");
    expect(model.attention.some((item) => item.id === "maint-overdue")).toBe(true);
  });
});
