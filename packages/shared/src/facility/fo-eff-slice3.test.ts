import { describe, expect, it } from "vitest";
import { MASTER_ADMIN_NAV } from "../commercial/master-admin";
import { navigationGroupsForSku } from "../commercial/modules";
import { presentMasterAdminNav, presentNavigationGroups } from "../commercial/nav-presentation";
import { entitlementsForSku, hasEntitlement } from "../commercial/entitlements";
import { buildFacilityAttentionSections } from "./mission-control-attention";
import {
  isRetiredFacilityAssetStatus,
  lockedContextFromFacilityAsset,
  publicAssetQrUrlContainsSecrets,
  publicPortalLockedContext
} from "./asset-registry";
import {
  validateFacilityRequestSubmission,
  warehouseDockFormSnapshot,
  wendyFurnitureFormSnapshot
} from "./request-forms";

const CHAIR = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  name: "Exam Chair 14",
  property_property_id: "11111111-1111-4111-8111-111111111111",
  property_properties: { name: "North Clinic" },
  floor_label: "3",
  department_label: "Cardiology",
  room_label: "312"
};

describe("FO-EFF Slice 3 — Asset QR + registry contracts", () => {
  it("Wendy: locked asset context + furniture form creates one public-bound payload", () => {
    const locked = lockedContextFromFacilityAsset(CHAIR);
    const result = validateFacilityRequestSubmission({
      published: wendyFurnitureFormSnapshot(),
      values: {
        requester_name: "Wendy",
        issue_title: "chair arm is broken",
        issue_description: "chair arm is broken",
        requester_email: "wendy@clinic.test"
      },
      attachments: [{ kind: "image", mimeType: "image/jpeg", fileSize: 1200 }],
      lockedContext: locked
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.facilityAssetId).toBe(CHAIR.id);
    expect(result.facilityAssetLabel).toBe("Exam Chair 14");
    expect(result.floorLabel).toBe("3");
    expect(result.departmentLabel).toBe("Cardiology");
    expect(result.roomLabel).toBe("312");
    expect(result.requesterName).toBe("Wendy");
    expect(result.propertyLabel).toBe("North Clinic");
  });

  it("Warehouse: same intake architecture, different published form", () => {
    const locked = lockedContextFromFacilityAsset({
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      name: "Forklift FL-12",
      property_property_id: "22222222-2222-4222-8222-222222222222",
      property_properties: { name: "Distribution" },
      department_label: "Warehouse"
    });
    const result = validateFacilityRequestSubmission({
      published: warehouseDockFormSnapshot(),
      values: {
        building: "Distribution",
        zone: "Aisle 4",
        category: "general",
        issue_description: "Hydraulic leak near mast",
        safety_concern: "yes"
      },
      attachments: [],
      lockedContext: locked
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.facilityAssetId).toBe("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    expect(result.facilityAssetLabel).toBe("Forklift FL-12");
    expect(result.departmentLabel).toBe("Warehouse");
  });

  it("classifies an Asset QR work order as a New public request, not a new attention system", () => {
    const sections = buildFacilityAttentionSections(
      [
        {
          id: "wo-chair",
          title: "chair arm is broken",
          status: "submitted",
          priority: "normal",
          intake_channel: "qr",
          assignee_type: "unassigned",
          facility_asset_label: "Exam Chair 14",
          request_number: "FR-2026-00099"
        }
      ],
      new Date("2026-08-18T12:00:00.000Z")
    );
    expect(sections.map((section) => section.id)).toContain("public_request");
    expect(sections.some((section) => /asset attention/i.test(section.title))).toBe(false);
  });

  it("retired/replaced statuses preserve history and block new QR", () => {
    expect(isRetiredFacilityAssetStatus("retired")).toBe(true);
    expect(isRetiredFacilityAssetStatus("replaced")).toBe(true);
    expect(isRetiredFacilityAssetStatus("active")).toBe(false);
    expect(isRetiredFacilityAssetStatus("maintenance")).toBe(false);
  });

  it("keeps public QR URLs free of org/asset/building UUIDs", () => {
    expect(publicAssetQrUrlContainsSecrets("https://app.example/request/tok_high_entropy?via=qr")).toBe(false);
    expect(
      publicAssetQrUrlContainsSecrets(`https://app.example/request/${CHAIR.id}?via=qr`)
    ).toBe(true);
  });

  it("reuses facility.assets entitlement and Complete effectiveSurfaces", () => {
    expect(hasEntitlement(entitlementsForSku("mpa_facility_operations"), "facility.assets")).toBe(true);
    expect(hasEntitlement(entitlementsForSku("mpa_property_manager"), "facility.assets")).toBe(false);
    const foScoped = navigationGroupsForSku("mpa_complete_platform", ["organization_admin"], "facility_operations");
    const pmScoped = navigationGroupsForSku("mpa_complete_platform", ["organization_admin"], "property_operations");
    expect(foScoped.some((group) => group.items.some((item) => item.href === "/facility/assets"))).toBe(true);
    expect(pmScoped.some((group) => group.items.some((item) => item.href === "/facility/assets"))).toBe(false);
  });

  it("places Assets in the shared Facilities rail and hides the registry from technician-only staff", () => {
    const fo = presentNavigationGroups(navigationGroupsForSku("mpa_facility_operations", ["organization_admin"]), {
      roles: ["organization_admin"]
    });
    const facilities = fo.flatMap((group) => group.sections).find((section) => section.id === "facilities");
    expect(facilities?.items.some((item) => item.href === "/facility/assets")).toBe(true);

    const tech = presentNavigationGroups(
      navigationGroupsForSku("mpa_facility_operations", ["maintenance_technician"]),
      { roles: ["maintenance_technician"] }
    );
    expect(tech.flatMap((group) => group.sections.flatMap((section) => section.items)).some((item) => item.href === "/facility/assets")).toBe(
      false
    );

    const admin = presentMasterAdminNav(MASTER_ADMIN_NAV, "/admin");
    expect(admin.flatMap((group) => group.sections.flatMap((section) => section.items)).some((item) => item.href === "/facility/assets")).toBe(
      false
    );
  });

  it("exposes labels only on the public portal payload", () => {
    const publicLocked = publicPortalLockedContext(lockedContextFromFacilityAsset(CHAIR));
    expect(publicLocked.facilityAssetLabel).toBe("Exam Chair 14");
    expect(publicLocked).not.toHaveProperty("facilityAssetId");
    expect(publicLocked).not.toHaveProperty("propertyId");
  });

  it("rejects a client-forged asset id that disagrees with locked intake context", () => {
    const locked = lockedContextFromFacilityAsset(CHAIR);
    const result = validateFacilityRequestSubmission({
      published: wendyFurnitureFormSnapshot(),
      values: {
        requester_name: "Wendy",
        issue_title: "chair arm is broken",
        issue_description: "chair arm is broken"
      },
      attachments: [{ kind: "image", mimeType: "image/jpeg", fileSize: 1200 }],
      lockedContext: locked,
      clientAssetId: "99999999-9999-4999-8999-999999999999"
    });
    expect(result.ok).toBe(false);
  });
});
