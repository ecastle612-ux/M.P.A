import { describe, expect, it } from "vitest";
import { buildMaintenanceCommandCenterViewModel } from "./ux016-view-model";
import type { WorkOrderListItem } from "./server";

const sample: WorkOrderListItem = {
  id: "wo-1",
  organizationId: "org-1",
  propertyId: "prop-1",
  unitId: null,
  tenantId: "ten-1",
  workOrderNumber: "WO-2026-0001",
  title: "Leak under sink",
  description: null,
  category: "plumbing",
  priority: "emergency",
  status: "submitted",
  workflowStage: "request",
  dueDate: null,
  assignedToUserId: null,
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
  createdBy: "user-1",
  updatedBy: null,
  createdAt: "2026-08-05T00:00:00.000Z",
  updatedAt: "2026-08-05T00:00:00.000Z",
  archivedAt: null,
  deletedAt: null,
  propertyName: "Oak Street",
  unitNumber: null,
  tenantName: "Pat Resident"
};

describe("Maintenance Command Center UDF", () => {
  it("surfaces emergency and waiting queues on STD-001 home", () => {
    const model = buildMaintenanceCommandCenterViewModel({
      items: [sample],
      canCreate: true,
      canAssign: true,
      userName: "Alex"
    });
    expect(model.greeting.surfaceLabel).toBe("Maintenance Operations");
    expect(model.attention.some((item) => item.id === "maint-emergency")).toBe(true);
    expect(model.assistant).toBeTruthy();
    expect(model.quickActions.some((item) => item.id === "qa-new")).toBe(true);
  });
});
