import { describe, expect, it } from "vitest";
import { buildVendorCommandCenterViewModel } from "./ux016-view-model";
import type { VendorRecord } from "./contracts";

const sample: VendorRecord = {
  id: "ven-1",
  organizationId: "org-1",
  businessName: "Oak Plumbing",
  primaryContactName: "Sam",
  phone: "555-0100",
  email: "sam@oak.example",
  addressLine1: null,
  addressLine2: null,
  city: null,
  stateRegion: null,
  postalCode: null,
  countryCode: "US",
  website: null,
  licenseNumber: "LIC-1",
  insuranceExpiration: "2026-09-01",
  taxIdPlaceholder: null,
  emergencyAvailability: null,
  afterHoursAvailability: null,
  preferredVendor: false,
  rating: null,
  internalNotes: null,
  status: "active",
  workflowStage: "invoice_submitted",
  services: ["plumbing"],
  metadata: {},
  createdAt: "2026-08-06T00:00:00.000Z",
  updatedAt: "2026-08-06T00:00:00.000Z",
  archivedAt: null,
  deletedAt: null
};

describe("Vendor Command Center UDF", () => {
  it("surfaces invoice attention on STD-001 home", () => {
    const model = buildVendorCommandCenterViewModel({
      vendors: [sample],
      canCreate: true,
      canAssign: true,
      userName: "Alex"
    });
    expect(model.greeting.surfaceLabel).toBe("Vendor Operations");
    expect(model.attention.some((item) => item.id === "vendor-invoices")).toBe(true);
    expect(model.quickActions.some((item) => item.id === "qa-new")).toBe(true);
  });
});
