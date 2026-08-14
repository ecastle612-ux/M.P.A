import { describe, expect, it } from "vitest";
import {
  aggregateWorkOrderReportMetrics,
  buildWorkOrderReportCsv,
  WORK_ORDER_REPORT_CSV_HEADERS,
  type WorkOrderReportSnapshot
} from "./index";

describe("FAC-002 work order report aggregation", () => {
  it("computes dashboard metrics and breakdowns", () => {
    const metrics = aggregateWorkOrderReportMetrics([
      {
        id: "1",
        status: "submitted",
        category: "hvac",
        priority: "emergency",
        createdAt: "2026-08-01T10:00:00.000Z",
        completedAt: null,
        vendorName: null,
        assigneeType: "unassigned"
      },
      {
        id: "2",
        status: "in_progress",
        category: "plumbing",
        priority: "high",
        createdAt: "2026-08-02T10:00:00.000Z",
        completedAt: null,
        vendorName: null,
        assigneeType: "technician"
      },
      {
        id: "3",
        status: "closed",
        category: "hvac",
        priority: "normal",
        createdAt: "2026-08-01T08:00:00.000Z",
        completedAt: "2026-08-01T20:00:00.000Z",
        vendorName: "Cool Air Co",
        assigneeType: "vendor"
      }
    ]);

    expect(metrics.total).toBe(3);
    expect(metrics.open).toBe(1);
    expect(metrics.inProgress).toBe(1);
    expect(metrics.completed).toBe(1);
    expect(metrics.averageCompletionHours).toBe(12);
    expect(metrics.byCategory[0]?.key).toBe("hvac");
    expect(metrics.byCategory[0]?.count).toBe(2);
    expect(metrics.byPriority.find((item) => item.key === "emergency")?.count).toBe(1);
    expect(metrics.byVendor.find((item) => item.label === "Cool Air Co")?.count).toBe(1);
  });

  it("returns honest-empty average when nothing completed", () => {
    const metrics = aggregateWorkOrderReportMetrics([
      {
        id: "1",
        status: "assigned",
        category: "general",
        priority: "low",
        createdAt: "2026-08-01T10:00:00.000Z",
        completedAt: null,
        vendorName: null,
        assigneeType: "unassigned"
      }
    ]);
    expect(metrics.averageCompletionHours).toBeNull();
    expect(metrics.completed).toBe(0);
  });
});

describe("FAC-002 CSV export", () => {
  const snapshot: WorkOrderReportSnapshot = {
    organizationId: "org-1",
    organizationName: "Demo Org",
    organizationSlug: "demo-org",
    surface: "facility",
    surfaceLabel: "Facility Operations",
    generatedAt: "2026-08-14T12:00:00.000Z",
    generatedByUserId: "user-1",
    generatedByDisplayName: "Ada",
    filters: {
      dateFrom: "2026-08-01",
      dateTo: "2026-08-14",
      dateMode: "created",
      propertyIds: [],
      statuses: [],
      priorities: [],
      categories: [],
      vendorIds: [],
      userIds: [],
      includeUnassignedVendor: false
    },
    metrics: {
      total: 1,
      open: 0,
      inProgress: 0,
      completed: 1,
      averageCompletionHours: 4,
      completionRate: 100,
      byCategory: [],
      byPriority: [],
      byVendor: []
    },
    rows: [
      {
        workOrderId: "wo-1",
        createdDate: "2026-08-02T10:00:00.000Z",
        requestedBy: "Manager",
        location: "Clinic · Roof",
        category: "hvac",
        priority: "high",
        description: 'Leak, "urgent"',
        assignedVendor: "Cool Air Co",
        assignedUser: "",
        status: "closed",
        completedDate: "2026-08-02T14:00:00.000Z",
        completionNotes: "Sealed",
        mediaAttached: "Yes"
      }
    ],
    truncated: false,
    totalMatched: 1
  };

  it("emits required headers and escaped values", () => {
    const csv = buildWorkOrderReportCsv(snapshot);
    for (const header of WORK_ORDER_REPORT_CSV_HEADERS) {
      expect(csv).toContain(header);
    }
    expect(csv).toContain("facility");
    expect(csv).toContain('"Leak, ""urgent"""');
    expect(csv).toContain("Yes");
    expect(csv).not.toContain("residential");
  });
});
