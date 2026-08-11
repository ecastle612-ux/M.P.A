import { describe, expect, it } from "vitest";
import {
  buildMa1OverviewExtras,
  buildSignWellWebhookHealth,
  buildStripeWebhookHealth,
  deriveOverallHealth,
  isAuthRelatedError,
  utilizationPercent
} from "./ma1-overview";
import type { StoredSaasPurchase, StoredSaasWebhookEvent } from "../saas-stripe/purchase-store";

const now = "2026-08-11T18:00:00.000Z";

describe("MA-1 overview metrics", () => {
  it("computes utilization only when capacity is authoritative", () => {
    expect(utilizationPercent(50, 100).value).toBe(50);
    expect(utilizationPercent(50, null).availability).toBe("unavailable");
    expect(utilizationPercent(50, 0).availability).toBe("unavailable");
  });

  it("treats stripe unprocessed events as unresolved, not proven failures", () => {
    const events: StoredSaasWebhookEvent[] = [
      {
        stripeEventId: "evt_1",
        eventType: "checkout.session.completed",
        payload: {},
        processedAt: "2026-08-11T17:00:00.000Z",
        checkoutSessionId: "cs_1",
        createdAt: "2026-08-11T17:00:00.000Z"
      },
      {
        stripeEventId: "evt_2",
        eventType: "invoice.paid",
        payload: {},
        processedAt: null,
        checkoutSessionId: null,
        createdAt: "2026-08-11T17:30:00.000Z"
      }
    ];
    const health = buildStripeWebhookHealth(events, now);
    expect(health.recentCount).toBe(2);
    expect(health.unresolvedCount).toBe(1);
    expect(health.failureCount).toBeNull();
    expect(health.lastSuccessfulAt).toBe("2026-08-11T17:00:00.000Z");
  });

  it("labels SignWell failure count unavailable (signature rejects not persisted)", () => {
    const health = buildSignWellWebhookHealth(
      [
        {
          id: "1",
          eventType: "document_completed",
          processedAt: "2026-08-11T17:00:00.000Z",
          organizationId: "org_1"
        }
      ],
      now
    );
    expect(health.recentCount).toBe(1);
    expect(health.failureCount).toBeNull();
    expect(health.availability).toBe("partial");
  });

  it("derives overall health from critical signals", () => {
    expect(
      deriveOverallHealth({
        supabaseOk: false,
        criticalErrorCount: 0,
        failedProvisioning: 0,
        stripeUnresolved: 0,
        notificationFailures: 0,
        problemSubscriptions: 0
      }).tone
    ).toBe("down");
    expect(
      deriveOverallHealth({
        supabaseOk: true,
        criticalErrorCount: 2,
        failedProvisioning: 0,
        stripeUnresolved: 0,
        notificationFailures: 0,
        problemSubscriptions: 0
      }).tone
    ).toBe("warn");
    expect(
      deriveOverallHealth({
        supabaseOk: true,
        criticalErrorCount: 0,
        failedProvisioning: 0,
        stripeUnresolved: 0,
        notificationFailures: 0,
        problemSubscriptions: 0
      }).tone
    ).toBe("ok");
  });

  it("aggregates org, commercial, capacity, and checkout health without inventing data", () => {
    const purchases: StoredSaasPurchase[] = [
      {
        id: "p1",
        stripeCheckoutSessionId: "cs_ok",
        stripeCustomerId: "cus_1",
        stripeSubscriptionId: "sub_1",
        catalogOfferId: "offer",
        productSku: "mpa_property_manager",
        planTier: "professional",
        billingCycle: "monthly",
        status: "checkout_completed",
        customerEmail: "a@example.com",
        idempotencyKey: null,
        demoSessionId: null,
        metadata: {},
        provisioned: true,
        organizationId: "o1",
        userId: null,
        createdAt: "2026-08-11T12:00:00.000Z",
        updatedAt: "2026-08-11T12:00:00.000Z"
      },
      {
        id: "p2",
        stripeCheckoutSessionId: "cs_fail",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        catalogOfferId: "offer",
        productSku: "mpa_property_manager",
        planTier: "professional",
        billingCycle: "monthly",
        status: "payment_failed",
        customerEmail: null,
        idempotencyKey: null,
        demoSessionId: null,
        metadata: {},
        provisioned: false,
        organizationId: null,
        userId: null,
        createdAt: "2026-08-11T13:00:00.000Z",
        updatedAt: "2026-08-11T13:00:00.000Z"
      }
    ];

    const extras = buildMa1OverviewExtras({
      organizations: [
        {
          id: "o1",
          name: "Alpha",
          slug: "alpha",
          createdAt: "2026-08-11T10:00:00.000Z",
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
          createdAt: "2026-08-01T00:00:00.000Z",
          subscriptionStatus: "past_due",
          setupComplete: false,
          productSku: "mpa_facility_operations",
          planTier: "professional",
          billingCycle: "monthly"
        }
      ],
      capacityRows: [
        {
          organizationId: "o1",
          managedUnitCount: 40,
          authorizedUnitCapacity: 50,
          pendingAuthorizedUnitCapacity: null,
          declaredUnitCount: 40,
          lastCapacityAuthorizedAt: "2026-08-11T11:00:00.000Z",
          subscriptionStatus: "active"
        },
        {
          organizationId: "o2",
          managedUnitCount: 60,
          authorizedUnitCapacity: 50,
          pendingAuthorizedUnitCapacity: 75,
          declaredUnitCount: 60,
          lastCapacityAuthorizedAt: null,
          subscriptionStatus: "past_due"
        }
      ],
      provisioningJobs: [],
      purchases,
      stripeWebhooks: [],
      signwellWebhooks: [],
      notifications: [
        {
          id: "n1",
          emailDeliveryStatus: "failed",
          createdAt: "2026-08-11T14:00:00.000Z"
        },
        {
          id: "n2",
          emailDeliveryStatus: "sent",
          createdAt: "2026-08-11T15:00:00.000Z"
        }
      ],
      criticalErrorCount: 3,
      criticalSeverityCount: 1,
      errorSeverityCount: 2,
      authRelatedErrorCount: 0,
      supabaseOk: true,
      generatedAt: now
    });

    expect(extras.organizations.total).toBe(2);
    expect(extras.organizations.active).toBe(1);
    expect(extras.organizations.setupIncomplete).toBe(1);
    expect(extras.commercial.problemSubscriptions).toBe(1);
    expect(extras.capacity.totalManagedUnits).toBe(100);
    expect(extras.capacity.orgsOverCapacity).toBe(1);
    expect(extras.capacity.orgsWithPendingCapacity).toBe(1);
    expect(extras.checkout.successful).toBe(1);
    expect(extras.checkout.failed).toBe(1);
    expect(extras.notifications.recentFailed).toBe(1);
    expect(extras.notifications.recentSent).toBe(1);
    expect(extras.authSecurity.availability).toBe("unavailable");
    expect(extras.overallHealth).toBe("warn");
  });

  it("detects auth-related durable errors without a dedicated denial table", () => {
    expect(
      isAuthRelatedError({
        message: "Forbidden",
        route: "/api/admin/organizations",
        metadata: {}
      })
    ).toBe(true);
    expect(
      isAuthRelatedError({
        message: "timeout",
        route: "/api/health",
        metadata: {}
      })
    ).toBe(false);
  });
});
