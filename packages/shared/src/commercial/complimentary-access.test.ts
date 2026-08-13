import { describe, expect, it } from "vitest";
import {
  isEntitlementActiveComplimentaryGrant,
  isComplimentaryGrantPastExpiration,
  resolveCommercialEntitlement
} from "./complimentary-access";

describe("complimentary grant lifecycle window", () => {
  const now = new Date("2026-08-13T12:00:00.000Z");

  it("ACTIVE unexpired grant unlocks entitlements", () => {
    expect(
      isEntitlementActiveComplimentaryGrant(
        {
          status: "ACTIVE",
          start_date: "2026-08-01T00:00:00.000Z",
          expiration_date: "2026-09-01T00:00:00.000Z"
        },
        now
      )
    ).toBe(true);
  });

  it("INVITED grant does not unlock paid entitlements", () => {
    expect(
      isEntitlementActiveComplimentaryGrant(
        {
          status: "INVITED",
          start_date: "2026-08-01T00:00:00.000Z",
          expiration_date: null
        },
        now
      )
    ).toBe(false);
  });

  it("EXPIRED and REVOKED do not unlock", () => {
    expect(
      isEntitlementActiveComplimentaryGrant(
        {
          status: "EXPIRED",
          start_date: "2026-07-01T00:00:00.000Z",
          expiration_date: "2026-08-01T00:00:00.000Z"
        },
        now
      )
    ).toBe(false);
    expect(
      isEntitlementActiveComplimentaryGrant(
        {
          status: "REVOKED",
          start_date: "2026-08-01T00:00:00.000Z",
          expiration_date: null
        },
        now
      )
    ).toBe(false);
  });

  it("detects past expiration on open grants", () => {
    expect(
      isComplimentaryGrantPastExpiration(
        {
          status: "ACTIVE",
          start_date: "2026-07-01T00:00:00.000Z",
          expiration_date: "2026-08-01T00:00:00.000Z"
        },
        now
      )
    ).toBe(true);
  });
});

describe("resolveCommercialEntitlement precedence", () => {
  const now = new Date("2026-08-13T12:00:00.000Z");

  it("prefers active Stripe subscription over ACTIVE grant", () => {
    expect(
      resolveCommercialEntitlement({
        subscription: {
          sku_code: "mpa_property_manager",
          status: "active",
          stripe_subscription_id: "sub_live"
        },
        grant: {
          plan_granted: "mpa_complete_platform",
          status: "ACTIVE",
          start_date: "2026-08-01T00:00:00.000Z",
          expiration_date: null
        },
        now
      })
    ).toEqual({ sku: "mpa_property_manager", source: "STRIPE_SUBSCRIPTION" });
  });

  it("uses ACTIVE grant when no Stripe subscription", () => {
    expect(
      resolveCommercialEntitlement({
        subscription: null,
        grant: {
          plan_granted: "mpa_facility_operations",
          status: "ACTIVE",
          start_date: "2026-08-01T00:00:00.000Z",
          expiration_date: "2026-09-01T00:00:00.000Z"
        },
        now
      })
    ).toEqual({ sku: "mpa_facility_operations", source: "MASTER_ADMIN_GRANT" });
  });

  it("fail-closes for INVITED grant (Guided Setup required)", () => {
    expect(
      resolveCommercialEntitlement({
        grant: {
          plan_granted: "mpa_facility_operations",
          status: "INVITED",
          start_date: "2026-08-01T00:00:00.000Z",
          expiration_date: "2026-09-01T00:00:00.000Z"
        },
        now
      })
    ).toEqual({ sku: null, source: null });
  });

  it("fail-closes on expired ACTIVE grant", () => {
    expect(
      resolveCommercialEntitlement({
        grant: {
          plan_granted: "mpa_facility_operations",
          status: "ACTIVE",
          start_date: "2026-07-01T00:00:00.000Z",
          expiration_date: "2026-08-01T00:00:00.000Z"
        },
        now
      })
    ).toEqual({ sku: null, source: null });
  });

  it("fail-closes on REVOKED grant", () => {
    expect(
      resolveCommercialEntitlement({
        grant: {
          plan_granted: "mpa_property_manager",
          status: "REVOKED",
          start_date: "2026-08-01T00:00:00.000Z",
          expiration_date: null
        },
        now
      })
    ).toEqual({ sku: null, source: null });
  });
});
