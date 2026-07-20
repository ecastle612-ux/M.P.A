import { describe, expect, it } from "vitest";
import { buildTasks } from "./server";

describe("buildTasks", () => {
  it("prioritizes first property setup when portfolio is empty", () => {
    const tasks = buildTasks(baseArgs({ propertiesTotal: 0 }));
    expect(tasks[0]?.id).toBe("create-first-property");
    expect(tasks[0]?.actionLabel).toBe("Resolve · Create property");
  });

  it("flags properties without units", () => {
    const tasks = buildTasks(
      baseArgs({
        propertiesTotal: 3,
        propertiesWithoutUnits: 2,
        unitsTotal: 1
      })
    );
    expect(tasks.some((task) => task.id === "properties-without-units")).toBe(true);
  });

  it("routes vacant-ready units to guided move-in", () => {
    const tasks = buildTasks(
      baseArgs({
        propertiesTotal: 1,
        unitsTotal: 4,
        tenantsTotal: 1,
        vacantReadyUnits: 2,
        vacantUnitSample: [{ id: "unit-1", unitNumber: "2B", propertyId: "prop-1" }]
      })
    );
    const task = tasks.find((entry) => entry.id === "vacant-ready-units");
    expect(task?.href).toBe("/residents/move-in?propertyId=prop-1&unitId=unit-1");
    expect(task?.actionLabel).toContain("2B");
  });

  it("routes late rent to one-shot record payment", () => {
    const tasks = buildTasks(
      baseArgs({
        lateRentCount: 3
      })
    );
    const task = tasks.find((entry) => entry.id === "record-late-rent");
    expect(task?.href).toBe("/financials/payments/new");
    expect(task?.actionLabel).toContain("Record payment");
  });

  it("includes recently created tenant review task", () => {
    const tasks = buildTasks(
      baseArgs({
        propertiesTotal: 1,
        unitsTotal: 2,
        tenantsTotal: 2,
        recentTenantsCreated: 1
      })
    );
    expect(tasks.some((task) => task.id === "review-recent-tenants")).toBe(true);
  });

  it("prioritizes overdue maintenance work orders", () => {
    const tasks = buildTasks(
      baseArgs({
        maintenanceMetrics: {
          openWorkOrders: 3,
          highPriorityWorkOrders: 1,
          overdueWorkOrders: 2,
          recentlyCompleted: 0,
          recentActivity: [],
          openWorkOrderSample: [],
          highPrioritySample: [],
          overdueSample: [{ id: "wo-1", workOrderNumber: "WO-2026-0001", title: "HVAC", dueDate: "2026-07-01", propertyName: null, unitNumber: null, tenantName: null, priority: "high", status: "in_progress", organizationId: "org", propertyId: "p", unitId: null, tenantId: null, description: null, category: "hvac", assignedToUserId: null, vendorId: null, currentVendorAssignmentId: null, internalNotes: null, tenantNotes: null, photoPlaceholder: null, documentPlaceholder: null, recurringMaintenancePlaceholder: null, preventiveMaintenancePlaceholder: null, completedAt: null, metadata: {}, createdBy: "u", updatedBy: null, createdAt: "", updatedAt: "", archivedAt: null, deletedAt: null }],
          completedSample: []
        } as never
      })
    );
    expect(tasks.some((task) => task.id === "overdue-maintenance")).toBe(true);
  });
});

function baseArgs(
  overrides: Partial<Parameters<typeof buildTasks>[0]> = {}
): Parameters<typeof buildTasks>[0] {
  return {
    propertiesTotal: 1,
    unitsTotal: 2,
    tenantsTotal: 1,
    vacanciesTotal: 0,
    vacantReadyUnits: 0,
    propertiesWithoutUnits: 0,
    recentTenantsCreated: 0,
    occupancyRate: 0.9,
    vacantUnitSample: [],
    ...overrides
  };
}
