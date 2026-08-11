import { describe, expect, it } from "vitest";
import {
  buildCommandCenterSnapshot,
  classifyOrganizationBucket,
  countRoles,
  formatUsdFromCents,
  monthlyRecurringCents
} from "./command-center-metrics";

describe("command-center-metrics", () => {
  it("classifies org buckets from subscription and provisioning signals", () => {
    expect(
      classifyOrganizationBucket({
        subscriptionStatus: "active",
        setupComplete: true,
        provisioningStatuses: []
      })
    ).toBe("active");
    expect(
      classifyOrganizationBucket({
        subscriptionStatus: "trialing",
        setupComplete: true,
        provisioningStatuses: []
      })
    ).toBe("trial");
    expect(
      classifyOrganizationBucket({
        subscriptionStatus: "unpaid",
        setupComplete: true,
        provisioningStatuses: []
      })
    ).toBe("suspended");
    expect(
      classifyOrganizationBucket({
        subscriptionStatus: "pending",
        setupComplete: false,
        provisioningStatuses: []
      })
    ).toBe("pending_provisioning");
    expect(
      classifyOrganizationBucket({
        subscriptionStatus: "active",
        setupComplete: false,
        provisioningStatuses: []
      })
    ).toBe("pending_provisioning");
  });

  it("computes MRR contribution from monthly and annual amounts", () => {
    expect(monthlyRecurringCents({ billingCycle: "monthly", unitAmountCents: 9900 })).toBe(9900);
    expect(monthlyRecurringCents({ billingCycle: "annual", unitAmountCents: 99000 })).toBe(8250);
    expect(formatUsdFromCents(9900)).toBe("$99");
  });

  it("counts membership roles without double-counting inactive users", () => {
    const counts = countRoles([
      { roles: ["property_manager"], status: "active" },
      { roles: ["tenant"], status: "active" },
      { roles: ["maintenance_technician"], status: "active" },
      { roles: ["property_manager"], status: "inactive" }
    ]);
    expect(counts.total).toBe(3);
    expect(counts.propertyManagers).toBe(1);
    expect(counts.facilityUsers).toBe(1);
    expect(counts.residents).toBe(1);
  });

  it("builds a read-only snapshot with org and commercial totals", () => {
    const snapshot = buildCommandCenterSnapshot({
      organizations: [
        {
          id: "o1",
          name: "Alpha",
          slug: "alpha",
          createdAt: "2026-08-01T00:00:00.000Z",
          subscriptionStatus: "active",
          setupComplete: true,
          productSku: "mpa_property_manager",
          planTier: "professional",
          billingCycle: "monthly"
        },
        {
          id: "o2",
          name: "Beta",
          slug: "beta",
          createdAt: "2026-08-02T00:00:00.000Z",
          subscriptionStatus: "trialing",
          setupComplete: true,
          productSku: "mpa_facility_operations",
          planTier: "professional",
          billingCycle: "annual"
        }
      ],
      memberships: [{ roles: ["property_manager"], status: "active" }],
      operatorCount: 2,
      provisioningJobs: [],
      purchases: [],
      webhookEvents: [],
      lifecycle: [],
      priceLookup: {
        unitAmountByOfferKey: {
          mpa_property_manager__professional__monthly: 9900,
          mpa_facility_operations__professional__annual: 99000
        }
      },
      system: {
        stripeConfigured: true,
        stripeCheckoutReady: true,
        supabaseOk: true,
        supabaseDetail: "ok",
        emailConfigured: true,
        demoSessions: 1,
        demoOk: true
      },
      generatedAt: "2026-08-09T00:00:00.000Z"
    });

    expect(snapshot.organizations.total).toBe(2);
    expect(snapshot.organizations.active).toBe(1);
    expect(snapshot.organizations.trial).toBe(1);
    expect(snapshot.commercial.activeSubscriptions).toBe(2);
    expect(snapshot.commercial.mrrCents).toBe(9900 + 8250);
    expect(snapshot.commercial.arrCents).toBe((9900 + 8250) * 12);
    expect(snapshot.users.platformOperators).toBe(2);
    expect(snapshot.system).toHaveLength(5);
    expect(snapshot.activity.latestCriticalErrors).toEqual([]);
    expect(snapshot.observability.criticalErrorCount).toBe(0);
  });

  it("surfaces durable critical errors into alerts", () => {
    const snapshot = buildCommandCenterSnapshot({
      organizations: [],
      memberships: [],
      operatorCount: 0,
      provisioningJobs: [],
      purchases: [],
      webhookEvents: [],
      lifecycle: [],
      priceLookup: { unitAmountByOfferKey: {} },
      criticalErrors: [
        {
          id: "err-1",
          at: "2026-08-11T00:00:00.000Z",
          title: "[critical] boom",
          detail: "POST /api/x · req r1",
          href: "/admin/errors"
        }
      ],
      sentryConfigured: true,
      system: {
        stripeConfigured: true,
        stripeCheckoutReady: true,
        supabaseOk: true,
        supabaseDetail: "ok",
        emailConfigured: true,
        demoSessions: 0,
        demoOk: true
      }
    });
    expect(snapshot.observability.criticalErrorCount).toBe(1);
    expect(snapshot.observability.sentryConfigured).toBe(true);
    expect(snapshot.alerts.some((alert) => alert.id === "alert-critical-errors")).toBe(true);
  });
});
