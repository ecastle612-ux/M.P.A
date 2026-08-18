import { describe, expect, it } from "vitest";
import { entitlementsForMember } from "../auth/operating-scope";
import {
  authorizedQuickCreateActions,
  contextualWorkOrderHref,
  suggestedCreatesForFailedSearch
} from "./quick-create";
import {
  parseRecentItemsJson,
  rememberRecentItem,
  recentItemsStorageKey,
  RECENT_ITEMS_MAX
} from "./recent-items";
import {
  authorizedSearchDomains,
  isStaffSearchActor,
  isTechnicianOnlySearchActor,
  matchReasonFor,
  publicSearchPayloadContainsSecrets,
  sanitizeStaffSearchQuery,
  staffAssetHref,
  staffPropertyHref,
  staffSearchQueryIsUseful,
  staffWorkOrderHref
} from "./search";

function actor(input: {
  sku: "mpa_property_manager" | "mpa_facility_operations" | "mpa_complete_platform";
  roles: string[];
  storedScope?: "property_operations" | "facility_operations" | "both" | null;
}) {
  const entitlements = entitlementsForMember({
    sku: input.sku,
    roles: input.roles,
    storedScope: input.storedScope ?? null
  });
  return {
    sku: input.sku,
    roles: input.roles,
    storedScope: input.storedScope ?? null,
    entitlements,
    userId: "user-1"
  };
}

describe("SIMPLICITY SLICE 4 — search authorization", () => {
  it("blocks tenant and portal-only actors", () => {
    expect(isStaffSearchActor(["tenant"])).toBe(false);
    expect(isStaffSearchActor(["vendor"])).toBe(false);
    expect(isStaffSearchActor(["property_owner"])).toBe(false);
    expect(authorizedSearchDomains(actor({ sku: "mpa_property_manager", roles: ["tenant"] }))).toEqual([]);
    expect(authorizedQuickCreateActions({ sku: "mpa_property_manager", roles: ["tenant"] })).toEqual([]);
  });

  it("FO-only cannot search residents or leases", () => {
    const domains = authorizedSearchDomains(
      actor({ sku: "mpa_facility_operations", roles: ["property_manager"] })
    );
    expect(domains).toContain("asset");
    expect(domains).toContain("facility_work_order");
    expect(domains).toContain("property");
    expect(domains).not.toContain("resident");
    expect(domains).not.toContain("lease");
    expect(domains).not.toContain("pm_work_order");
  });

  it("PM-only cannot search facility assets or FR work", () => {
    const domains = authorizedSearchDomains(
      actor({ sku: "mpa_property_manager", roles: ["property_manager"] })
    );
    expect(domains).toContain("resident");
    expect(domains).toContain("property");
    expect(domains).not.toContain("asset");
    expect(domains).not.toContain("facility_work_order");
    expect(domains).not.toContain("request_form");
  });

  it("Complete SKU alone is not authorization — FO-scoped member has no PM results", () => {
    const foScoped = authorizedSearchDomains(
      actor({
        sku: "mpa_complete_platform",
        roles: ["property_manager"],
        storedScope: "facility_operations"
      })
    );
    expect(foScoped).toContain("asset");
    expect(foScoped).not.toContain("resident");
    expect(foScoped).not.toContain("lease");

    const both = authorizedSearchDomains(
      actor({
        sku: "mpa_complete_platform",
        roles: ["property_manager"],
        storedScope: "both"
      })
    );
    expect(both).toContain("asset");
    expect(both).toContain("resident");
  });

  it("technician-only is narrowed and gets no manager Quick Create", () => {
    expect(isTechnicianOnlySearchActor(["maintenance_technician"])).toBe(true);
    expect(isTechnicianOnlySearchActor(["property_manager", "maintenance_technician"])).toBe(false);
    const domains = authorizedSearchDomains(
      actor({ sku: "mpa_facility_operations", roles: ["maintenance_technician"] })
    );
    expect(domains).toContain("facility_work_order");
    expect(domains).toContain("asset");
    expect(domains).not.toContain("request_form");
    expect(domains).not.toContain("lease");
    expect(
      authorizedQuickCreateActions({
        sku: "mpa_facility_operations",
        roles: ["maintenance_technician"]
      })
    ).toEqual([]);
  });

  it("FO manager Quick Create is surface-aware and excludes PM actions", () => {
    const actions = authorizedQuickCreateActions({
      sku: "mpa_facility_operations",
      roles: ["property_manager"]
    }).map((action) => action.id);
    expect(actions).toEqual(["fo_work_order", "fo_asset", "fo_request_form", "fo_work_template"]);
  });

  it("PM manager Quick Create excludes FO actions and includes charge only as finance navigation", () => {
    const actions = authorizedQuickCreateActions({
      sku: "mpa_property_manager",
      roles: ["organization_admin"]
    });
    expect(actions.map((action) => action.id)).toEqual([
      "pm_property",
      "pm_resident",
      "pm_lease",
      "pm_maintenance",
      "pm_charge"
    ]);
    expect(actions.find((action) => action.id === "pm_charge")?.href).toBe(
      "/pm/financial-operations#charges"
    );
  });
});

describe("SIMPLICITY SLICE 4 — identifiers, deep links, recent", () => {
  it("sanitizes ILIKE metacharacters and requires a useful query", () => {
    expect(sanitizeStaffSearchQuery("FR-2026-00002")).toBe("FR-2026-00002");
    expect(sanitizeStaffSearchQuery("100%_chair")).toBe("100 chair");
    expect(staffSearchQueryIsUseful("a")).toBe(false);
    expect(staffSearchQueryIsUseful("ch")).toBe(true);
  });

  it("does not present UUIDs or intake tokens as a match reason", () => {
    expect(publicSearchPayloadContainsSecrets("a11ce215-0001-4000-8000-00000000a014")).toBe(true);
    expect(publicSearchPayloadContainsSecrets("public_token=abc")).toBe(true);
    expect(publicSearchPayloadContainsSecrets("UAT-CHAIR-14")).toBe(false);
    expect(
      matchReasonFor({
        query: "chair",
        haystacks: [
          { label: "name", value: "UAT Exam Chair 14" },
          { label: "id", value: "a11ce215-0001-4000-8000-00000000a014" }
        ]
      })
    ).toBe("Matched name");
  });

  it("reuses Slice 1–3 deep-link contracts", () => {
    expect(
      staffWorkOrderHref({
        surface: "facility",
        workOrderId: "wo-1",
        technicianOnly: true,
        assignedToViewer: true
      })
    ).toBe("/facility/my-work?workOrderId=wo-1");
    expect(
      staffWorkOrderHref({
        surface: "facility",
        workOrderId: "wo-1",
        technicianOnly: false,
        assignedToViewer: false
      })
    ).toBe("/facility/operations?workOrderId=wo-1");
    expect(
      staffWorkOrderHref({
        surface: "residential",
        workOrderId: "wo-2",
        technicianOnly: false,
        assignedToViewer: false
      })
    ).toBe("/pm/maintenance?workOrderId=wo-2");
    expect(staffAssetHref("asset-1")).toBe("/facility/assets/asset-1");
    expect(staffPropertyHref({ propertyId: "p1" })).toBe("/pm/properties/p1");
    expect(staffPropertyHref({ propertyId: "p1", facilityBuilding: true })).toBe(
      "/facility/assets?site=p1"
    );
    expect(contextualWorkOrderHref({ facilityAssetId: "a1", propertyId: "p1" })).toBe(
      "/facility/operations?new=1&facilityAssetId=a1&propertyId=p1"
    );
  });

  it("recent storage is org+user scoped, capped, and permission-agnostic", () => {
    expect(recentItemsStorageKey("org-a", "user-a")).not.toBe(recentItemsStorageKey("org-b", "user-a"));
    const next = rememberRecentItem(
      [{ type: "asset", id: "1", viewedAt: "2026-01-01T00:00:00.000Z" }],
      { type: "asset", id: "1" },
      "2026-01-02T00:00:00.000Z"
    );
    expect(next[0]?.id).toBe("1");
    expect(next).toHaveLength(1);
    const many = Array.from({ length: 12 }, (_, index) => ({
      type: "asset" as const,
      id: String(index),
      viewedAt: "2026-01-01T00:00:00.000Z"
    }));
    expect(rememberRecentItem(many, { type: "property", id: "p" })).toHaveLength(RECENT_ITEMS_MAX);
    expect(parseRecentItemsJson(`[{"type":"asset","id":"x","viewedAt":"t"}]`)).toEqual([
      { type: "asset", id: "x", viewedAt: "t" }
    ]);
    expect(parseRecentItemsJson(`[{"type":"charge","id":"x"}]`)).toEqual([]);
  });

  it("suggests at most one relevant create after a failed search", () => {
    const fo = authorizedQuickCreateActions({
      sku: "mpa_facility_operations",
      roles: ["property_manager"]
    });
    expect(suggestedCreatesForFailedSearch("AST-000099", fo).map((row) => row.id)).toEqual(["fo_asset"]);
    expect(suggestedCreatesForFailedSearch("xyzzy", fo)).toEqual([]);
  });
});
