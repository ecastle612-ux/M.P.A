import { describe, expect, it } from "vitest";
import type { LeaseListItem } from "./server";
import { buildLeasingUniversalDashboardViewModel } from "./ux016-view-model";

function lease(partial: Partial<LeaseListItem> & Pick<LeaseListItem, "id" | "status">): LeaseListItem {
  return {
    organizationId: "org-1",
    leaseNumber: `L-${partial.id}`,
    propertyId: "p1",
    unitId: "u1",
    primaryTenantId: "t1",
    coTenantPlaceholder: null,
    leaseType: "residential",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    moveInDate: null,
    moveOutDate: null,
    rentAmount: 1200,
    securityDeposit: 1200,
    lateFeePlaceholder: null,
    renewalOption: true,
    noticePeriodDays: 30,
    renewalStatus: "none",
    internalNotes: null,
    signedAt: null,
    activatedAt: null,
    expiredAt: null,
    terminatedAt: null,
    metadata: {},
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-05T00:00:00.000Z",
    archivedAt: null,
    deletedAt: null,
    propertyName: "Oak Court",
    unitNumber: "1A",
    tenantName: "Pat Tenant",
    ...partial
  };
}

describe("buildLeasingUniversalDashboardViewModel (STD-001)", () => {
  it("mounts Leasing Home with pipeline signals", () => {
    const model = buildLeasingUniversalDashboardViewModel({
      items: [lease({ id: "1", status: "draft" }), lease({ id: "2", status: "active" })],
      canCreate: true,
      userName: "Sam",
      organizationName: "Canopy PM",
      timeGreeting: "Good morning",
      dateLabel: "Wednesday, August 5, 2026"
    });

    expect(model.greeting.surfaceLabel).toBe("Leasing Home");
    expect(model.attention.some((item) => item.id === "lease-drafts")).toBe(true);
    expect(model.quickActions[0]?.id).toBe("qa-new-lease");
    expect(model.mission.some((row) => /draft/i.test(row.label))).toBe(true);
  });

  it("prioritizes renewals and signed leases in Immediate Attention", () => {
    const model = buildLeasingUniversalDashboardViewModel({
      items: [
        lease({ id: "s1", status: "signed" }),
        lease({ id: "r1", status: "active", renewalStatus: "pending" })
      ],
      canCreate: false,
      timeGreeting: "Good evening",
      dateLabel: "Wednesday, August 5, 2026"
    });

    expect(model.attention.some((item) => item.id === "lease-signed")).toBe(true);
    expect(model.attention.some((item) => item.id === "lease-renewals")).toBe(true);
  });
});
