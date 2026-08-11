import { describe, expect, it } from "vitest";
import {
  buildModuleStatesForOrg,
  capacityUtilizationPercent,
  countAuthRelatedErrors,
  deriveOrgHealth,
  mapLifecycleLabel,
  scrubAuditContext,
  summarizeVendors,
  summarizeWorkOrders
} from "./ma2-org-detail";

describe("MA-2 organization detail aggregations", () => {
  it("maps lifecycle labels from existing subscription/setup/provisioning signals", () => {
    expect(
      mapLifecycleLabel({
        subscriptionStatus: "active",
        setupComplete: true,
        provisioningStatuses: []
      })
    ).toBe("active");
    expect(
      mapLifecycleLabel({
        subscriptionStatus: "trialing",
        setupComplete: true,
        provisioningStatuses: []
      })
    ).toBe("trial");
    expect(
      mapLifecycleLabel({
        subscriptionStatus: "active",
        setupComplete: false,
        provisioningStatuses: []
      })
    ).toBe("provisioning");
    expect(
      mapLifecycleLabel({
        subscriptionStatus: "canceled",
        setupComplete: true,
        provisioningStatuses: [],
        cancelAtPeriodEnd: false
      })
    ).toBe("cancellation");
  });

  it("builds module states without Coming Soon / gate language", () => {
    const complete = buildModuleStatesForOrg("mpa_complete_platform");
    expect(complete.find((m) => m.sku === "mpa_property_manager")?.enabled).toBe(true);
    expect(complete.find((m) => m.sku === "mpa_facility_operations")?.enabled).toBe(true);
    expect(complete.find((m) => m.sku === "mpa_complete_platform")?.commercialState).toBe(
      "current_product"
    );

    const fo = buildModuleStatesForOrg("mpa_facility_operations");
    expect(fo.find((m) => m.sku === "mpa_facility_operations")?.enabled).toBe(true);
    expect(fo.find((m) => m.sku === "mpa_property_manager")?.enabled).toBe(false);
  });

  it("computes capacity utilization only when authoritative", () => {
    expect(capacityUtilizationPercent(25, 50).value).toBe(50);
    expect(capacityUtilizationPercent(25, null).availability).toBe("unavailable");
  });

  it("summarizes work-order and vendor metrics", () => {
    const wo = summarizeWorkOrders([
      { status: "submitted", priority: "emergency" },
      { status: "in_progress", priority: "normal" },
      { status: "completed", priority: "high" },
      { status: "cancelled", priority: "low" }
    ]);
    expect(wo.open).toBe(1);
    expect(wo.inProgress).toBe(1);
    expect(wo.completed).toBe(1);
    expect(wo.cancelled).toBe(1);
    expect(wo.urgent).toBe(1);

    const vendors = summarizeVendors(
      [{ status: "active" }, { status: "inactive" }, { status: "active" }],
      2
    );
    expect(vendors.total).toBe(3);
    expect(vendors.active).toBe(2);
    expect(vendors.outstandingWorkOrders).toBe(2);
  });

  it("derives health issues from authoritative signals", () => {
    const { tone, issues } = deriveOrgHealth({
      lifecycle: "active",
      failedProvisioning: 1,
      problemSubscription: true,
      overCapacity: true,
      criticalErrors: 2,
      notificationFailures: 1,
      unresolvedStripeWebhooks: 1,
      authRelatedErrors: 1
    });
    expect(tone).toBe("down");
    expect(issues.some((i) => i.id === "critical-errors")).toBe(true);
    expect(issues.some((i) => i.id === "capacity")).toBe(true);
  });

  it("scrubs secrets from audit context", () => {
    const scrubbed = scrubAuditContext({
      password: "secret",
      stripe_secret: "whsec_abc",
      detail: "ok"
    });
    expect(scrubbed["password"]).toBe("[redacted]");
    expect(scrubbed["stripe_secret"]).toBe("[redacted]");
    expect(scrubbed["detail"]).toBe("ok");
  });

  it("counts auth-related errors heuristically", () => {
    expect(
      countAuthRelatedErrors([
        { message: "Forbidden", route: "/api/x", metadata: {} },
        { message: "timeout", route: "/api/y", metadata: {} }
      ])
    ).toBe(1);
  });

  it("returns unavailable work-order summary on failure", () => {
    const wo = summarizeWorkOrders(null, "query failed");
    expect(wo.availability).toBe("unavailable");
    expect(wo.note).toContain("query failed");
  });
});
