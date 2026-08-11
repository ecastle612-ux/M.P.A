import { describe, expect, it } from "vitest";
import {
  additionalUnitBlocks,
  authorizedUnitCapacity,
  isUnitVolumeTrialEligible,
  UNIT_BLOCK_SIZE
} from "@mpa/shared";
import {
  buildSubscriptionDetail,
  filterSubscriptionRows,
  mapEntitlementModules,
  mapSubscriptionRow,
  paginateRows,
  parseSubscriptionFilters,
  reconcileCommercialState,
  scrubStripePayload,
  type Ma4RawSubscription
} from "./ma4-commercial";

function baseRow(over: Partial<Ma4RawSubscription> = {}): Ma4RawSubscription {
  return {
    organization_id: "org_a",
    organization_name: "Alpha",
    sku_code: "mpa_property_manager",
    status: "active",
    billing_cycle: "monthly",
    cancel_at_period_end: false,
    current_period_end: "2026-09-01T00:00:00.000Z",
    trial_ends_at: null,
    managed_unit_count: 500,
    authorized_additional_blocks: 0,
    authorized_unit_capacity: 500,
    declared_unit_count: 500,
    pending_additional_blocks: null,
    pending_authorized_unit_capacity: null,
    last_capacity_authorized_at: "2026-08-01T00:00:00.000Z",
    stripe_customer_id: "cus_1",
    stripe_subscription_id: "sub_1",
    stripe_base_item_id: "si_base",
    stripe_additional_capacity_item_id: null,
    quote_id: "q1",
    plan_tier: null,
    sca_required: false,
    grace_started_at: null,
    updated_at: "2026-08-11T00:00:00.000Z",
    ...over
  };
}

describe("MA-4 capacity math reuse", () => {
  it("matches authoritative block math for key unit thresholds", () => {
    expect(additionalUnitBlocks(500)).toBe(0);
    expect(authorizedUnitCapacity(0)).toBe(UNIT_BLOCK_SIZE);
    expect(additionalUnitBlocks(501)).toBe(1);
    expect(authorizedUnitCapacity(1)).toBe(1000);
    expect(additionalUnitBlocks(1000)).toBe(1);
    expect(additionalUnitBlocks(1001)).toBe(2);
    expect(authorizedUnitCapacity(2)).toBe(1500);
  });

  it("trial eligibility: <=500 eligible, >500 not", () => {
    expect(isUnitVolumeTrialEligible(500)).toBe(true);
    expect(isUnitVolumeTrialEligible(501)).toBe(false);
  });
});

describe("MA-4 reconciliation", () => {
  it("marks healthy when capacity and Stripe linkage agree", () => {
    const { health, anomalies } = reconcileCommercialState(baseRow());
    expect(health).toBe("healthy");
    expect(anomalies.filter((a) => a.severity === "attention")).toHaveLength(0);
  });

  it("flags units exceed capacity", () => {
    const { health, anomalies } = reconcileCommercialState(
      baseRow({ managed_unit_count: 600, authorized_unit_capacity: 500, authorized_additional_blocks: 0 })
    );
    expect(health).toBe("attention");
    expect(anomalies.some((a) => a.code === "units_exceed_capacity")).toBe(true);
  });

  it("flags missing capacity item when blocks > 0", () => {
    const { anomalies } = reconcileCommercialState(
      baseRow({
        managed_unit_count: 800,
        authorized_additional_blocks: 1,
        authorized_unit_capacity: 1000,
        stripe_additional_capacity_item_id: null
      })
    );
    expect(anomalies.some((a) => a.code === "missing_capacity_item")).toBe(true);
  });

  it("flags unexpected capacity item when blocks are zero", () => {
    const { anomalies } = reconcileCommercialState(
      baseRow({
        authorized_additional_blocks: 0,
        authorized_unit_capacity: 500,
        stripe_additional_capacity_item_id: "si_extra"
      })
    );
    expect(anomalies.some((a) => a.code === "unexpected_capacity_item")).toBe(true);
  });

  it("flags capacity blocks mismatch", () => {
    const { anomalies } = reconcileCommercialState(
      baseRow({ authorized_additional_blocks: 1, authorized_unit_capacity: 500 })
    );
    expect(anomalies.some((a) => a.code === "capacity_blocks_mismatch")).toBe(true);
  });

  it("flags next-period capacity mismatch", () => {
    const { anomalies } = reconcileCommercialState(
      baseRow({
        pending_additional_blocks: 1,
        pending_authorized_unit_capacity: 500
      })
    );
    expect(anomalies.some((a) => a.code === "next_period_capacity_mismatch")).toBe(true);
  });

  it("flags missing Stripe linkage for active subscriptions", () => {
    const { anomalies } = reconcileCommercialState(
      baseRow({ stripe_subscription_id: null, stripe_customer_id: null })
    );
    expect(anomalies.some((a) => a.code === "missing_stripe_linkage")).toBe(true);
  });

  it("flags lifecycle trial mismatch", () => {
    const { anomalies } = reconcileCommercialState(
      baseRow({
        status: "trialing",
        trial_ends_at: "2020-01-01T00:00:00.000Z"
      })
    );
    expect(anomalies.some((a) => a.code === "lifecycle_trial_mismatch")).toBe(true);
  });

  it("does not invent anomalies when capacity fields are unavailable", () => {
    const { health, anomalies } = reconcileCommercialState(
      baseRow({
        managed_unit_count: null,
        authorized_unit_capacity: null,
        authorized_additional_blocks: null,
        pending_additional_blocks: null,
        pending_authorized_unit_capacity: null,
        status: "active",
        stripe_subscription_id: "sub_1",
        stripe_customer_id: "cus_1"
      })
    );
    expect(anomalies.some((a) => a.code === "units_exceed_capacity")).toBe(false);
    expect(health).toBe("healthy");
  });

  it("flags stale capacity when billed blocks exceed required", () => {
    const { anomalies } = reconcileCommercialState(
      baseRow({
        managed_unit_count: 100,
        authorized_additional_blocks: 2,
        authorized_unit_capacity: 1500,
        stripe_additional_capacity_item_id: "si_extra"
      })
    );
    expect(anomalies.some((a) => a.code === "stale_capacity_state")).toBe(true);
  });
});

describe("MA-4 entitlements + legacy", () => {
  it("maps PM / FO / Complete entitlement modules", () => {
    const pm = mapEntitlementModules("mpa_property_manager", "active");
    expect(pm.find((m) => m.sku === "mpa_property_manager")?.state).toBe("active");
    expect(pm.find((m) => m.sku === "mpa_facility_operations")?.entitled).toBe(false);

    const complete = mapEntitlementModules("mpa_complete_platform", "active");
    expect(complete.find((m) => m.sku === "mpa_property_manager")?.entitled).toBe(true);
    expect(complete.find((m) => m.sku === "mpa_facility_operations")?.entitled).toBe(true);
    expect(complete.find((m) => m.sku === "mpa_complete_platform")?.state).toBe("active");

    const fo = mapEntitlementModules("mpa_facility_operations", "canceled");
    expect(fo.find((m) => m.sku === "mpa_facility_operations")?.state).toBe("inactive");
  });

  it("labels legacy plan_tier without promoting SaaS tiers as products", () => {
    const detail = buildSubscriptionDetail(mapSubscriptionRow(baseRow({ plan_tier: "business" })));
    expect(detail.entitlements.legacyPlanTier).toMatch(/Legacy plan_tier/);
    expect(detail.entitlements.modules.every((m) => m.label !== "Business")).toBe(true);
  });
});

describe("MA-4 filters, search, pagination", () => {
  it("parses filters including pagination bounds", () => {
    const parsed = parseSubscriptionFilters(
      new URLSearchParams(
        "q=Alpha&sku=mpa_property_manager&billingCycle=annual&status=trialing&trial=active&cancelAtPeriodEnd=yes&page=2&pageSize=200"
      )
    );
    expect(parsed.q).toBe("Alpha");
    expect(parsed.sku).toBe("mpa_property_manager");
    expect(parsed.billingCycle).toBe("annual");
    expect(parsed.status).toBe("trialing");
    expect(parsed.trial).toBe("active");
    expect(parsed.cancelAtPeriodEnd).toBe("yes");
    expect(parsed.page).toBe(2);
    expect(parsed.pageSize).toBe(100);
  });

  it("filters and paginates subscription rows", () => {
    const rows = [
      mapSubscriptionRow(baseRow({ organization_id: "org_a", organization_name: "Alpha" })),
      mapSubscriptionRow(
        baseRow({
          organization_id: "org_b",
          organization_name: "Beta",
          sku_code: "mpa_facility_operations",
          status: "trialing",
          managed_unit_count: 100,
          authorized_unit_capacity: 500,
          authorized_additional_blocks: 0
        })
      ),
      mapSubscriptionRow(
        baseRow({
          organization_id: "org_c",
          organization_name: "Gamma",
          billing_cycle: "annual",
          cancel_at_period_end: true
        })
      )
    ];
    expect(filterSubscriptionRows(rows, { page: 1, pageSize: 50, sku: "mpa_facility_operations" })).toHaveLength(
      1
    );
    expect(filterSubscriptionRows(rows, { page: 1, pageSize: 50, q: "gamma" })).toHaveLength(1);
    expect(filterSubscriptionRows(rows, { page: 1, pageSize: 50, billingCycle: "annual" })).toHaveLength(1);
    expect(filterSubscriptionRows(rows, { page: 1, pageSize: 50, cancelAtPeriodEnd: "yes" })).toHaveLength(1);
    expect(paginateRows(rows, 2, 2)).toHaveLength(1);
  });
});

describe("MA-4 subscription detail + capacity change", () => {
  it("builds detail with increase/decrease and trial notes", () => {
    const increase = buildSubscriptionDetail(
      mapSubscriptionRow(
        baseRow({
          authorized_additional_blocks: 0,
          authorized_unit_capacity: 500,
          pending_additional_blocks: 1,
          pending_authorized_unit_capacity: 1000,
          stripe_additional_capacity_item_id: null
        })
      )
    );
    expect(increase.capacity.capacityChange).toBe("increase");
    expect(increase.capacity.includedCapacity).toBe(500);
    expect(increase.trial.eligible).toBe(true);

    const over = buildSubscriptionDetail(
      mapSubscriptionRow(
        baseRow({
          managed_unit_count: 1001,
          authorized_additional_blocks: 2,
          authorized_unit_capacity: 1500,
          stripe_additional_capacity_item_id: "si_x"
        })
      )
    );
    expect(over.trial.eligible).toBe(false);
    expect(over.capacity.requiredBlocks).toBe(2);
    expect(over.stripe.priceIdsNote).toMatch(/Price IDs are not stored/);
  });

  it("scrubs secrets from payloads", () => {
    const scrubbed = scrubStripePayload({
      stripe_secret: "sk_live",
      webhook_secret: "whsec",
      customerId: "cus_1"
    });
    expect(scrubbed["stripe_secret"]).toBe("[redacted]");
    expect(scrubbed["webhook_secret"]).toBe("[redacted]");
    expect(scrubbed["customerId"]).toBe("cus_1");
  });
});
