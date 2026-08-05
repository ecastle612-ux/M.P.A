import { describe, expect, it } from "vitest";
import { buildPropertyCommandCenterViewModel } from "./ux016-view-model";
import type { PropertyRecord } from "./contracts";

const baseProperty: PropertyRecord = {
  id: "prop-1",
  organizationId: "org-1",
  name: "Oak Street",
  code: "OAK",
  propertyType: "multi_family",
  status: "draft",
  lifecycleStage: "configuration",
  description: null,
  addressLine1: "100 Oak St",
  addressLine2: null,
  city: "Austin",
  stateRegion: "TX",
  postalCode: "78701",
  countryCode: "US",
  timezone: null,
  latitude: null,
  longitude: null,
  ownershipEntityName: "Oak LLC",
  ownerContactName: "Pat Owner",
  ownerContactEmail: "pat@example.com",
  ownerContactPhone: null,
  coverImageUrl: null,
  metadata: {},
  createdAt: "2026-08-05T00:00:00.000Z",
  updatedAt: "2026-08-05T00:00:00.000Z",
  archivedAt: null,
  deletedAt: null
};

describe("Property Command Center UDF view model", () => {
  it("assembles STD-001 sections for a property workspace", () => {
    const model = buildPropertyCommandCenterViewModel({
      property: baseProperty,
      unitCount: 0,
      occupiedUnits: 0,
      vacancyUnits: 0,
      tenantCount: 0,
      canUpdate: true,
      canCreateUnit: true,
      canCreateMaintenance: true,
      recentLifecycle: [],
      userName: "Alex",
      organizationName: "Demo Org"
    });

    expect(model.greeting.surfaceLabel).toBe("Property Command Center");
    expect(model.greeting.placeLabel).toBe("Oak Street");
    expect(model.assistant).toBeTruthy();
    expect(model.attention.some((item) => item.id === "no-units")).toBe(true);
    expect(model.quickActions.some((item) => item.id === "qa-unit")).toBe(true);
    expect(model.insights.some((item) => item.label === "Lifecycle")).toBe(true);
  });
});
