import { describe, expect, it } from "vitest";
import { buildMpaAssistantViewModel, buildMpaAssistantFromUniversalSections } from "./ux016-assistant";
import type { DashboardSnapshot } from "./server";
import type { UniversalAttentionItem, UniversalMissionItem } from "./ux016-view-model";

function snapshot(overrides: Partial<DashboardSnapshot> = {}): DashboardSnapshot {
  return {
    propertiesTotal: 2,
    unitsTotal: 8,
    occupiedUnits: 7,
    vacanciesTotal: 1,
    vacantReadyUnits: 0,
    tenantsTotal: 7,
    activeTenants: 7,
    recentMoveIns: 0,
    recentTenantsCreated: 0,
    propertiesWithoutUnits: 0,
    occupancyRate: 87,
    expiringLeasesTotal: 0,
    renewalNeededTotal: 2,
    recentActivity: [
      {
        id: "a1",
        type: "lease",
        title: "Lease signed",
        subtitle: "Unit 1",
        timestamp: "2026-08-05T12:00:00.000Z",
        status: "completed",
        action: "updated",
        href: "/leases/1"
      },
      {
        id: "a2",
        type: "communication",
        title: "Session heartbeat",
        subtitle: null,
        timestamp: "2026-08-05T12:01:00.000Z",
        status: "ok",
        action: "event",
        href: "/dashboard"
      }
    ],
    operationalTasks: [
      {
        id: "t1",
        title: "Approve vendor invoice",
        description: "Invoice awaiting your approval",
        priority: "high",
        href: "/financials",
        actionLabel: "Approve"
      }
    ],
    maintenance: {
      openWorkOrders: 8,
      highPriorityWorkOrders: 1,
      overdueWorkOrders: 1,
      recentlyCompleted: 2,
      openWorkOrderSample: [],
      highPrioritySample: [
        {
          id: "wo-e",
          workOrderNumber: "WO-E1",
          title: "Emergency plumbing repair at Oakwood Apartments",
          priority: "emergency",
          status: "open",
          href: "/maintenance/wo-e"
        }
      ],
      overdueSample: [],
      completedSample: []
    },
    vendors: {
      openAssignments: 1,
      awaitingResponse: 3,
      inProgress: 0,
      completedToday: 0,
      preferredVendorCount: 1,
      averageRating: null,
      assignmentSamples: []
    },
    leases: {
      activeLeases: 7,
      upcomingExpirations: 0,
      upcomingRenewals: 2,
      upcomingMoveIns: 0,
      upcomingMoveOuts: 0,
      expiredLeases: 0,
      renewalNeeded: 2,
      expirationSample: [],
      renewalSample: [],
      moveInSample: [],
      moveOutSample: []
    },
    communications: null,
    financial: {
      rentDueToday: 0,
      lateRentCount: 1,
      outstandingBalancesTotal: 450,
      ownerStatementsDraft: 0,
      ownerStatementsGenerated: 0,
      recentPaymentSample: [],
      recentExpenseSample: []
    },
    applicants: {
      pendingApplications: 0,
      screeningQueue: 0,
      awaitingDocuments: 0,
      awaitingSignatures: 1,
      recentlyApproved: 0,
      moveInsThisWeek: 0,
      pendingSample: [],
      screeningSample: [],
      awaitingDocumentsSample: [],
      awaitingSignaturesSample: [],
      recentlyApprovedSample: [],
      moveInSample: [],
      recentEvents: []
    },
    migration: null,
    ...overrides
  };
}

describe("buildMpaAssistantViewModel (UX-016 Slice D)", () => {
  it("builds briefing with Today, Highest Priority, Recommended Next Action", () => {
    const attention: UniversalAttentionItem[] = [
      {
        id: "att-1",
        title: "Emergency plumbing repair at Oakwood Apartments",
        reason: "High-priority maintenance · WO-E1",
        href: "/maintenance/wo-e",
        actionLabel: "Open work order",
        severity: "critical"
      }
    ];
    const mission: UniversalMissionItem[] = [
      { id: "mission-maintenance", label: "work orders", count: 8, href: "/maintenance" },
      { id: "mission-renewals", label: "lease renewals", count: 2, href: "/leases" },
      { id: "mission-overdue", label: "overdue work order", count: 1, href: "/maintenance" },
      { id: "mission-vendors", label: "vendors awaiting response", count: 3, href: "/vendors" }
    ];

    const assistant = buildMpaAssistantViewModel({
      snapshot: snapshot(),
      commandCenterHome: null,
      attention,
      mission,
      recentActivity: [
        {
          id: "act-1",
          summary: "Lease signed",
          meta: "leases · Aug 5",
          href: "/leases/1"
        },
        {
          id: "act-2",
          summary: "Session heartbeat",
          meta: "system · ping",
          href: null
        }
      ],
      insights: [{ id: "i1", label: "Occupancy", value: "87%", href: "/properties" }]
    });

    expect(assistant.headline).toMatch(/operational briefing/i);
    expect(assistant.today.length).toBeGreaterThan(0);
    expect(assistant.highestPriority?.title).toMatch(/Emergency plumbing/i);
    expect(assistant.recommendedNextAction?.label).toMatch(/emergency|Assign|Open/i);
    expect(assistant.waitingOnOthers.some((item) => /vendor/i.test(item.label))).toBe(true);
    expect(assistant.waitingOnMe.length).toBeGreaterThan(0);
    expect(assistant.quickWins.length).toBeGreaterThan(0);
    expect(assistant.operationalTimeline.every((entry) => !/heartbeat/i.test(entry.summary))).toBe(
      true
    );
    expect(assistant.highestPriority?.relatedContext?.length).toBeGreaterThan(0);
    expect(assistant.caughtUp).toBe(false);
  });

  it("celebrates catch-up when nothing urgent remains", () => {
    const assistant = buildMpaAssistantViewModel({
      snapshot: snapshot({
        operationalTasks: [],
        maintenance: null,
        vendors: null,
        financial: null,
        applicants: null,
        renewalNeededTotal: 0,
        leases: null,
        recentActivity: []
      }),
      commandCenterHome: null,
      attention: [],
      mission: [],
      recentActivity: [],
      insights: []
    });

    expect(assistant.caughtUp).toBe(true);
    expect(assistant.caughtUpSuggestions.length).toBeGreaterThan(0);
    expect(assistant.highestPriority).toBeNull();
  });

  it("builds Mission Control assistant from universal sections", () => {
    const assistant = buildMpaAssistantFromUniversalSections({
      attention: [
        {
          id: "mc-1",
          title: "Integration degraded",
          reason: "critical · integration",
          href: "/master-admin/health",
          actionLabel: "Open",
          severity: "critical"
        }
      ],
      mission: [
        { id: "mission-platform", label: "Platform & integrations", count: 2, href: "/master-admin/health" }
      ],
      recentActivity: [
        {
          id: "ra-1",
          summary: "Invoice approved",
          meta: "billing",
          href: "/master-admin"
        }
      ],
      insights: []
    });

    expect(assistant.highestPriority?.title).toMatch(/Integration/i);
    expect(assistant.waitingOnMe.length).toBeGreaterThan(0);
    expect(assistant.operationalTimeline[0]?.summary).toMatch(/Invoice approved/i);
  });
});
