import { describe, expect, it } from "vitest";
import {
  cancelWorkOrderInputSchema,
  createFacilityWorkOrderInputSchema,
  entitlementsForSku,
  evaluatePathEntitlement,
  hasEntitlement,
  navigationGroupsForSku,
  WORK_ORDER_CATEGORIES,
  WORK_SURFACES
} from "@mpa/shared";
import { buildFacilityMissionControlSnapshot } from "./mission-control-service";

describe("STAB-004 facility work surface schemas", () => {
  it("accepts facility create payloads with building and optional due date", () => {
    const parsed = createFacilityWorkOrderInputSchema.parse({
      title: "Inspect rooftop AHU",
      description: "Quarterly filter and belt inspection",
      category: "preventive",
      priority: "normal",
      propertyId: "11111111-1111-4111-8111-111111111111",
      facilityAssetLabel: "AHU-2",
      dueAt: "2026-08-12T15:00:00.000Z"
    });
    expect(parsed.facilityAssetLabel).toBe("AHU-2");
    expect(WORK_SURFACES).toContain("facility");
    expect(WORK_ORDER_CATEGORIES).toContain("building_system");
  });

  it("accepts cancel payloads", () => {
    const parsed = cancelWorkOrderInputSchema.parse({
      workOrderId: "22222222-2222-4222-8222-222222222222",
      note: "Duplicate request"
    });
    expect(parsed.note).toBe("Duplicate request");
  });
});

describe("STAB-004 facility mission control snapshot", () => {
  it("buckets today, emergency, overdue, waiting, and completed", () => {
    const now = new Date("2026-08-11T18:00:00.000Z");
    const snapshot = buildFacilityMissionControlSnapshot(
      [
        {
          id: "1",
          title: "Emergency leak",
          status: "submitted",
          priority: "emergency",
          assignee_type: "unassigned",
          due_at: "2026-08-10T12:00:00.000Z",
          submitted_at: "2026-08-11T10:00:00.000Z"
        },
        {
          id: "2",
          title: "Vendor job",
          status: "assigned",
          priority: "high",
          assignee_type: "vendor",
          due_at: null,
          submitted_at: "2026-08-09T10:00:00.000Z"
        },
        {
          id: "3",
          title: "Tech job",
          status: "assigned",
          priority: "normal",
          assignee_type: "technician",
          due_at: null,
          submitted_at: "2026-08-08T10:00:00.000Z"
        },
        {
          id: "4",
          title: "Closed",
          status: "closed",
          priority: "normal",
          assignee_type: "technician",
          completed_at: "2026-08-10T12:00:00.000Z",
          closed_at: "2026-08-10T12:00:00.000Z"
        },
        {
          id: "5",
          title: "Cancelled",
          status: "cancelled",
          priority: "low",
          assignee_type: "unassigned"
        }
      ],
      now
    );

    expect(snapshot.todayOpen).toBe(1);
    expect(snapshot.emergency).toBe(1);
    expect(snapshot.open).toBe(3);
    expect(snapshot.overdue).toBe(1);
    expect(snapshot.waitingOnVendor).toBe(1);
    expect(snapshot.waitingOnTechnician).toBe(1);
    expect(snapshot.completedRecently).toBe(1);
    expect(snapshot.viewerMode).toBe("manager");
    expect(snapshot.attentionTotal).toBeGreaterThan(0);
    expect(snapshot.attention.some((s) => s.category === "overdue")).toBe(true);
    expect(snapshot.attention.some((s) => s.category === "urgent")).toBe(true);
    // Emergency+overdue wins classification over unassigned for the submitted row.

    const techSnapshot = buildFacilityMissionControlSnapshot(
      [
        {
          id: "1",
          title: "Emergency leak",
          status: "submitted",
          priority: "emergency",
          assignee_type: "unassigned",
          due_at: "2026-08-10T12:00:00.000Z",
          submitted_at: "2026-08-11T10:00:00.000Z"
        }
      ],
      now,
      { viewerMode: "technician" }
    );
    expect(techSnapshot.viewerMode).toBe("technician");
    expect(techSnapshot.attention).toEqual([]);
    expect(techSnapshot.attentionTotal).toBe(0);
  });
});

describe("STAB-004 Complete vs FO vs PM entitlements", () => {
  it("Complete receives both PM and FO capabilities", () => {
    const entitlements = entitlementsForSku("mpa_complete_platform");
    expect(hasEntitlement(entitlements, "pm.maintenance")).toBe(true);
    expect(hasEntitlement(entitlements, "facility.operations")).toBe(true);
    expect(hasEntitlement(entitlements, "facility.mission_control")).toBe(true);
  });

  it("PM-only cannot access FO routes", () => {
    const denied = evaluatePathEntitlement({
      pathname: "/facility/operations",
      sku: "mpa_property_manager"
    });
    expect(denied.allowed).toBe(false);

    const allowed = evaluatePathEntitlement({
      pathname: "/pm/maintenance",
      sku: "mpa_property_manager"
    });
    expect(allowed.allowed).toBe(true);
  });

  it("FO-only cannot access PM maintenance routes", () => {
    const denied = evaluatePathEntitlement({
      pathname: "/pm/maintenance",
      sku: "mpa_facility_operations"
    });
    expect(denied.allowed).toBe(false);

    const allowed = evaluatePathEntitlement({
      pathname: "/facility/operations",
      sku: "mpa_facility_operations"
    });
    expect(allowed.allowed).toBe(true);
  });

  it("Complete navigation includes both product groups without planned FO shells", () => {
    const groups = navigationGroupsForSku("mpa_complete_platform");
    expect(groups.some((group) => group.id === "property_manager")).toBe(true);
    const fo = groups.find((group) => group.id === "facility_operations");
    expect(fo).toBeTruthy();
    expect(fo?.items.every((item) => item.readiness === "aligned")).toBe(true);
    expect(fo?.items.some((item) => item.href === "/facility/capital-projects")).toBe(false);
  });
});
