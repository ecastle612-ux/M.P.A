import { describe, expect, it } from "vitest";
import { entitlementsForMember } from "../auth/operating-scope";
import { entitlementsForSku, hasEntitlement } from "../commercial/entitlements";
import { evaluateApiPathEntitlement, requiredEntitlementForApiPath, requiredEntitlementForPath } from "../commercial/route-entitlements";
import {
  coarseStatusForWorkOrder,
  formatFacilityRequestNumber,
  isFacilityRequestNumber,
  memberCanAdministerRequestForms,
  publicRequestPath,
  publicTrackingView,
  resolveIntakeChannel,
  validateFacilityRequestSubmission,
  validatePublishedFieldSnapshot,
  warehouseDockFormSnapshot,
  wendyFurnitureFormSnapshot
} from "./request-forms";

describe("facility request forms contracts", () => {
  it("formats collision-safe public request numbers", () => {
    expect(formatFacilityRequestNumber(2026, 124)).toBe("FR-2026-00124");
    expect(isFacilityRequestNumber("FR-2026-00124")).toBe(true);
    expect(isFacilityRequestNumber("wo-uuid")).toBe(false);
  });

  it("treats QR and share link as the same portal path", () => {
    expect(publicRequestPath("tok_abc")).toBe("/request/tok_abc");
    expect(publicRequestPath("tok_abc", "qr")).toBe("/request/tok_abc?via=qr");
    expect(publicRequestPath("tok_abc", "link")).toBe("/request/tok_abc?via=link");
  });

  it("resolves intake channel from via + access policy", () => {
    expect(resolveIntakeChannel({ via: "qr", accessPolicy: "contact_required" })).toBe("qr");
    expect(resolveIntakeChannel({ via: "link", accessPolicy: "contact_required" })).toBe("public_link");
    expect(resolveIntakeChannel({ via: "link", accessPolicy: "authenticated_only" })).toBe("authenticated");
  });

  it("maps work-order status to coarse requester status", () => {
    expect(coarseStatusForWorkOrder("submitted")).toBe("received");
    expect(coarseStatusForWorkOrder("in_progress")).toBe("in_progress");
    expect(coarseStatusForWorkOrder("closed")).toBe("closed");
  });
});

describe("Wendy furniture form", () => {
  const snapshot = wendyFurnitureFormSnapshot();

  it("publishes with required floor, department, name, description, and image", () => {
    expect(validatePublishedFieldSnapshot(snapshot).ok).toBe(true);
  });

  it("accepts the Floor 3 QR submission", () => {
    const result = validateFacilityRequestSubmission({
      snapshot,
      accessPolicy: "contact_required",
      lockedContext: { floorLabel: "3", propertyLabel: "Main Clinic", propertyId: "11111111-1111-4111-8111-111111111111" },
      values: {
        floor: "3",
        department: "Cardiology",
        requester_name: "Wendy",
        issue_title: "Chair arm is broken",
        issue_description: "Chair arm is broken",
        requester_email: "wendy@clinic.test"
      },
      attachments: [{ kind: "image", mimeType: "image/jpeg", fileSize: 120_000 }]
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.floorLabel).toBe("3");
    expect(result.departmentLabel).toBe("Cardiology");
    expect(result.requesterName).toBe("Wendy");
    expect(result.title).toBe("Chair arm is broken");
  });

  it("rejects a changed locked floor", () => {
    const result = validateFacilityRequestSubmission({
      snapshot,
      accessPolicy: "contact_required",
      lockedContext: { floorLabel: "3" },
      values: {
        floor: "4",
        department: "Cardiology",
        requester_name: "Wendy",
        issue_title: "Chair arm is broken",
        issue_description: "Chair arm is broken"
      },
      attachments: [{ kind: "image", mimeType: "image/jpeg", fileSize: 120_000 }]
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("forged_context");
  });

  it("rejects a missing required photo", () => {
    const result = validateFacilityRequestSubmission({
      snapshot,
      accessPolicy: "contact_required",
      lockedContext: { floorLabel: "3" },
      values: {
        floor: "3",
        department: "Cardiology",
        requester_name: "Wendy",
        issue_title: "Chair arm is broken",
        issue_description: "Chair arm is broken"
      }
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("missing_required");
  });
});

describe("warehouse form configurability", () => {
  const snapshot = warehouseDockFormSnapshot();

  it("hides Department and Person and still publishes", () => {
    expect(validatePublishedFieldSnapshot(snapshot).ok).toBe(true);
    const result = validateFacilityRequestSubmission({
      snapshot,
      accessPolicy: "contact_required",
      values: {
        building: "Warehouse A",
        zone: "Dock 2",
        category: "safety",
        issue_title: "Pallet jack stuck",
        issue_description: "Pallet jack will not release",
        safety_concern: "yes",
        requester_name: "Alex",
        requester_phone: "555-0100"
      }
    });
    expect(result.ok).toBe(true);
  });

  it("rejects hidden department injection", () => {
    const result = validateFacilityRequestSubmission({
      snapshot,
      accessPolicy: "contact_required",
      values: {
        building: "Warehouse A",
        zone: "Dock 2",
        category: "safety",
        issue_title: "Pallet jack stuck",
        issue_description: "Pallet jack will not release",
        safety_concern: "yes",
        department: "Cardiology",
        requester_name: "Alex",
        requester_phone: "555-0100"
      }
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("hidden_injection");
  });

  it("rejects an invalid select/category option", () => {
    const result = validateFacilityRequestSubmission({
      snapshot,
      accessPolicy: "contact_required",
      values: {
        building: "Warehouse A",
        zone: "Dock 2",
        category: "not-a-category",
        issue_title: "Pallet jack stuck",
        issue_description: "Pallet jack will not release",
        safety_concern: "yes",
        requester_name: "Alex",
        requester_phone: "555-0100"
      }
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("invalid_select");
  });
});

describe("public write defenses", () => {
  const snapshot = wendyFurnitureFormSnapshot();

  it("rejects browser-supplied organization_id", () => {
    const result = validateFacilityRequestSubmission({
      snapshot,
      accessPolicy: "contact_required",
      clientOrganizationId: "22222222-2222-4222-8222-222222222222",
      lockedContext: { floorLabel: "3" },
      values: {
        floor: "3",
        department: "Cardiology",
        requester_name: "Wendy",
        issue_title: "Chair arm is broken",
        issue_description: "Chair arm is broken"
      },
      attachments: [{ kind: "image", mimeType: "image/jpeg", fileSize: 120_000 }]
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("forged_context");
  });

  it("rejects forged building and asset ids", () => {
    const building = validateFacilityRequestSubmission({
      snapshot,
      accessPolicy: "contact_required",
      lockedContext: { propertyId: "11111111-1111-4111-8111-111111111111", floorLabel: "3" },
      clientPropertyId: "33333333-3333-4333-8333-333333333333",
      values: {
        floor: "3",
        department: "Cardiology",
        requester_name: "Wendy",
        issue_title: "Chair arm is broken",
        issue_description: "Chair arm is broken"
      },
      attachments: [{ kind: "image", mimeType: "image/jpeg", fileSize: 120_000 }]
    });
    expect(building.ok).toBe(false);

    const asset = validateFacilityRequestSubmission({
      snapshot,
      accessPolicy: "contact_required",
      lockedContext: {
        floorLabel: "3",
        facilityAssetId: "44444444-4444-4444-8444-444444444444"
      },
      clientAssetId: "55555555-5555-4555-8555-555555555555",
      values: {
        floor: "3",
        department: "Cardiology",
        requester_name: "Wendy",
        issue_title: "Chair arm is broken",
        issue_description: "Chair arm is broken"
      },
      attachments: [{ kind: "image", mimeType: "image/jpeg", fileSize: 120_000 }]
    });
    expect(asset.ok).toBe(false);
  });

  it("rejects unknown fields, oversized attachments, and missing contact", () => {
    expect(
      validateFacilityRequestSubmission({
        snapshot,
        accessPolicy: "contact_required",
        lockedContext: { floorLabel: "3" },
        values: {
          floor: "3",
          department: "Cardiology",
          requester_name: "Wendy",
          issue_title: "Chair arm is broken",
          issue_description: "Chair arm is broken",
          extra: "nope"
        },
        attachments: [{ kind: "image", mimeType: "image/jpeg", fileSize: 120_000 }]
      }).ok
    ).toBe(false);

    expect(
      validateFacilityRequestSubmission({
        snapshot,
        accessPolicy: "contact_required",
        lockedContext: { floorLabel: "3" },
        values: {
          floor: "3",
          department: "Cardiology",
          requester_name: "Wendy",
          issue_title: "Chair arm is broken",
          issue_description: "Chair arm is broken"
        },
        attachments: [{ kind: "image", mimeType: "image/jpeg", fileSize: 21 * 1024 * 1024 }]
      }).ok
    ).toBe(false);

    expect(
      validateFacilityRequestSubmission({
        snapshot,
        accessPolicy: "contact_required",
        lockedContext: { floorLabel: "3" },
        values: {
          floor: "3",
          department: "Cardiology",
          issue_title: "Chair arm is broken",
          issue_description: "Chair arm is broken"
        },
        attachments: [{ kind: "image", mimeType: "image/jpeg", fileSize: 120_000 }]
      }).ok
    ).toBe(false);
  });

  it("rejects malformed custom values", () => {
    const snapshot = warehouseDockFormSnapshot();
    snapshot.fields.push({
      key: "count",
      kind: "custom",
      customType: "number",
      requirement: "optional",
      label: "Count",
      order: 95
    });
    expect(
      validateFacilityRequestSubmission({
        snapshot,
        accessPolicy: "contact_required",
        values: {
          building: "Warehouse A",
          zone: "Dock 2",
          category: "safety",
          issue_title: "Pallet jack stuck",
          issue_description: "Pallet jack will not release",
          safety_concern: "yes",
          requester_name: "Alex",
          requester_phone: "555-0100",
          count: "not-a-number"
        }
      }).ok
    ).toBe(false);
  });

  it("does not leak work-order internals on the tracking surface", () => {
    const view = publicTrackingView({
      requestNumber: "FR-2026-00124",
      submittedAt: "2026-08-18T00:00:00.000Z",
      title: "Chair arm is broken",
      category: "general",
      locationLabel: "Main Clinic · Floor 3",
      status: "assigned"
    });
    expect(view.status).toBe("in_progress");
    expect(JSON.stringify(view)).not.toMatch(/assignee|vendor|cost|uuid|organization/i);
    expect(view.requestNumber).toBe("FR-2026-00124");
  });
});

describe("facility.request_forms RBAC", () => {
  it("is an FO entitlement for managers only", () => {
    expect(hasEntitlement(entitlementsForSku("mpa_facility_operations"), "facility.request_forms")).toBe(true);
    expect(hasEntitlement(entitlementsForSku("mpa_property_manager"), "facility.request_forms")).toBe(false);
    expect(memberCanAdministerRequestForms(["property_manager"])).toBe(true);
    expect(memberCanAdministerRequestForms(["maintenance_technician"])).toBe(false);

    expect(
      entitlementsForMember({
        sku: "mpa_facility_operations",
        roles: ["property_manager"]
      })
    ).toContain("facility.request_forms");
    expect(
      entitlementsForMember({
        sku: "mpa_facility_operations",
        roles: ["maintenance_technician"]
      })
    ).not.toContain("facility.request_forms");
    expect(
      entitlementsForMember({
        sku: "mpa_complete_platform",
        roles: ["property_manager"],
        storedScope: "property_operations"
      })
    ).not.toContain("facility.request_forms");
    expect(
      entitlementsForMember({
        sku: "mpa_complete_platform",
        roles: ["property_manager"],
        storedScope: "facility_operations"
      })
    ).toContain("facility.request_forms");
  });

  it("maps admin routes and leaves public request APIs unentitled", () => {
    expect(requiredEntitlementForPath("/facility/settings/request-forms")).toBe("facility.request_forms");
    expect(requiredEntitlementForApiPath("/api/facility/request-forms")).toBe("facility.request_forms");
    expect(requiredEntitlementForApiPath("/api/public/request/abc")).toBeNull();
    expect(
      evaluateApiPathEntitlement({
        pathname: "/api/facility/request-forms",
        sku: "mpa_property_manager",
        roles: ["property_manager"]
      }).allowed
    ).toBe(false);
    expect(
      evaluateApiPathEntitlement({
        pathname: "/api/facility/request-forms",
        sku: "mpa_complete_platform",
        roles: ["property_manager"],
        storedScope: "property_operations"
      }).allowed
    ).toBe(false);
    expect(
      evaluateApiPathEntitlement({
        pathname: "/api/facility/request-forms",
        sku: "mpa_complete_platform",
        roles: ["property_manager"],
        storedScope: "facility_operations"
      }).allowed
    ).toBe(true);
  });
});
