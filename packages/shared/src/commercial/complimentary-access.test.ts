import { describe, expect, it } from "vitest";
import {
  isActiveComplimentaryGrant,
  isComplimentaryGrantPastExpiration,
  resolveCommercialEntitlement
} from "./complimentary-access";

describe("complimentary grant window", () => {
  const now = new Date("2026-08-13T12:00:00.000Z");

  it("treats active unexpired grants as active", () => {
    expect(
      isActiveComplimentaryGrant(
        {
          grant_status: "active",
          start_date: "2026-08-01T00:00:00.000Z",
          expiration_date: "2026-09-01T00:00:00.000Z"
        },
        now
      )
    ).toBe(true);
  });

  it("treats null expiration as no expiration", () => {
    expect(
      isActiveComplimentaryGrant(
        {
          grant_status: "active",
          start_date: "2026-08-01T00:00:00.000Z",
          expiration_date: null
        },
        now
      )
    ).toBe(true);
  });

  it("rejects expired and revoked grants", () => {
    expect(
      isActiveComplimentaryGrant(
        {
          grant_status: "active",
          start_date: "2026-07-01T00:00:00.000Z",
          expiration_date: "2026-08-01T00:00:00.000Z"
        },
        now
      )
    ).toBe(false);
    expect(
      isActiveComplimentaryGrant(
        {
          grant_status: "revoked",
          start_date: "2026-08-01T00:00:00.000Z",
          expiration_date: null
        },
        now
      )
    ).toBe(false);
    expect(
      isComplimentaryGrantPastExpiration(
        {
          grant_status: "active",
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

  it("prefers active Stripe subscription over grant", () => {
    const resolved = resolveCommercialEntitlement({
      subscription: {
        sku_code: "mpa_property_manager",
        status: "active",
        stripe_subscription_id: "sub_live"
      },
      grant: {
        plan_granted: "mpa_complete_platform",
        grant_status: "active",
        start_date: "2026-08-01T00:00:00.000Z",
        expiration_date: null
      },
      now
    });
    expect(resolved).toEqual({
      sku: "mpa_property_manager",
      source: "STRIPE_SUBSCRIPTION"
    });
  });

  it("uses active grant when no Stripe subscription", () => {
    const resolved = resolveCommercialEntitlement({
      subscription: null,
      grant: {
        plan_granted: "mpa_facility_operations",
        grant_status: "active",
        start_date: "2026-08-01T00:00:00.000Z",
        expiration_date: "2026-09-01T00:00:00.000Z"
      },
      now
    });
    expect(resolved).toEqual({
      sku: "mpa_facility_operations",
      source: "MASTER_ADMIN_GRANT"
    });
  });

  it("fail-closes on expired grant", () => {
    const resolved = resolveCommercialEntitlement({
      subscription: null,
      grant: {
        plan_granted: "mpa_facility_operations",
        grant_status: "active",
        start_date: "2026-07-01T00:00:00.000Z",
        expiration_date: "2026-08-01T00:00:00.000Z"
      },
      now
    });
    expect(resolved).toEqual({ sku: null, source: null });
  });

  it("fail-closes on revoked grant", () => {
    const resolved = resolveCommercialEntitlement({
      grant: {
        plan_granted: "mpa_property_manager",
        grant_status: "revoked",
        start_date: "2026-08-01T00:00:00.000Z",
        expiration_date: null
      },
      now
    });
    expect(resolved).toEqual({ sku: null, source: null });
  });

  it("keeps legacy non-Stripe admin assign after grant miss", () => {
    const resolved = resolveCommercialEntitlement({
      subscription: {
        sku_code: "mpa_property_manager",
        status: "active",
        stripe_subscription_id: null
      },
      grant: null,
      now
    });
    expect(resolved).toEqual({
      sku: "mpa_property_manager",
      source: "LEGACY_ADMIN_ASSIGN"
    });
  });
});
