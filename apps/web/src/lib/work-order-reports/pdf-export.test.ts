import { describe, expect, it } from "vitest";
import { buildWorkOrderReportPdf } from "./pdf-export";
import type { WorkOrderReportSnapshot } from "@mpa/shared";

const snapshot: WorkOrderReportSnapshot = {
  organizationId: "org-1",
  organizationName: "UAT Clinic",
  organizationSlug: "uat-clinic",
  surface: "facility",
  surfaceLabel: "Facility Operations",
  generatedAt: "2026-08-14T12:00:00.000Z",
  generatedByUserId: "user-1",
  generatedByDisplayName: "Ada Admin",
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
    total: 2,
    open: 1,
    inProgress: 0,
    completed: 1,
    averageCompletionHours: 6,
    completionRate: 50,
    byCategory: [{ key: "hvac", label: "HVAC", count: 2 }],
    byPriority: [{ key: "high", label: "High", count: 2 }],
    byVendor: [{ key: "unassigned", label: "Unassigned", count: 2 }]
  },
  rows: [
    {
      workOrderId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      createdDate: "2026-08-02T10:00:00.000Z",
      requestedBy: "Manager",
      location: "Clinic",
      category: "hvac",
      priority: "high",
      description: "Leak",
      assignedVendor: "",
      assignedUser: "Tech",
      status: "closed",
      completedDate: "2026-08-02T16:00:00.000Z",
      completionNotes: "Done",
      mediaAttached: "No"
    }
  ],
  truncated: false,
  totalMatched: 1
};

describe("FAC-002 PDF export", () => {
  it("builds a non-empty management PDF", async () => {
    const pdf = await buildWorkOrderReportPdf(snapshot);
    expect(pdf.fileName).toContain("facility");
    expect(pdf.fileName).toContain("uat-clinic");
    expect(pdf.bytes.byteLength).toBeGreaterThan(500);
    expect(Buffer.from(pdf.bytes).subarray(0, 4).toString("utf8")).toBe("%PDF");
  });
});
