import { describe, expect, it } from "vitest";
import {
  buildUniversalDashboardViewModel,
  permissionQuickActionsFromFlags
} from "./ux016-view-model";
import type { DashboardSnapshot } from "./server";
import type { CommandCenterHomeComposition } from "../ops/command-center-home";

function baseSnapshot(overrides: Partial<DashboardSnapshot> = {}): DashboardSnapshot {
  return {
    propertiesTotal: 3,
    unitsTotal: 12,
    occupiedUnits: 10,
    vacanciesTotal: 2,
    vacantReadyUnits: 1,
    tenantsTotal: 10,
    activeTenants: 10,
    recentMoveIns: 1,
    recentTenantsCreated: 0,
    propertiesWithoutUnits: 0,
    occupancyRate: 83,
    expiringLeasesTotal: 1,
    renewalNeededTotal: 2,
    recentActivity: [
      {
        id: "act-1",
        type: "maintenance",
        title: "Work order completed",
        subtitle: "Unit 2A",
        timestamp: "2026-08-05T12:00:00.000Z",
        status: "completed",
        action: "updated",
        href: "/maintenance/wo-1"
      }
    ],
    operationalTasks: [
      {
        id: "task-high",
        title: "Vendor awaiting approval",
        description: "Approve assigned vendor for WO-100",
        priority: "high",
        href: "/vendors",
        actionLabel: "Review vendor"
      }
    ],
    maintenance: {
      openWorkOrders: 14,
      highPriorityWorkOrders: 1,
      overdueWorkOrders: 3,
      recentlyCompleted: 2,
      openWorkOrderSample: [],
      highPrioritySample: [
        {
          id: "wo-e",
          workOrderNumber: "WO-E1",
          title: "Emergency leak",
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
      awaitingResponse: 2,
      inProgress: 0,
      completedToday: 0,
      preferredVendorCount: 1,
      averageRating: null,
      assignmentSamples: []
    },
    leases: {
      activeLeases: 8,
      upcomingExpirations: 1,
      upcomingRenewals: 2,
      upcomingMoveIns: 0,
      upcomingMoveOuts: 0,
      expiredLeases: 0,
      renewalNeeded: 2,
      expirationSample: [
        {
          id: "lease-1",
          leaseNumber: "L-1",
          tenantName: "Alex",
          propertyName: "Oak",
          endDate: "2026-08-05",
          href: "/leases/lease-1"
        }
      ],
      renewalSample: [],
      moveInSample: [],
      moveOutSample: []
    },
    communications: null,
    financial: {
      rentDueToday: 0,
      lateRentCount: 4,
      outstandingBalancesTotal: 1200,
      ownerStatementsDraft: 0,
      ownerStatementsGenerated: 0,
      recentPaymentSample: [],
      recentExpenseSample: []
    },
    applicants: {
      pendingApplications: 3,
      screeningQueue: 1,
      awaitingDocuments: 0,
      awaitingSignatures: 2,
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

describe("buildUniversalDashboardViewModel", () => {
  it("orders hierarchy fields and caps attention at 5", () => {
    const home: CommandCenterHomeComposition = {
      organizationId: "org",
      principalId: "user",
      rolePlane: "manager",
      composedAt: "2026-08-05T12:00:00.000Z",
      priorityTasks: [
        {
          taskId: "t1",
          organizationId: "org",
          title: "Ops task",
          description: "Follow up",
          priority: "high",
          status: "open",
          dueAt: null,
          ownerPrincipalId: null,
          followers: [],
          dependencyTaskIds: [],
          subjectType: "org",
          subjectId: "org",
          deepLink: "/inbox",
          sourceEventId: null,
          workflowInstanceId: null,
          workflowStepId: null,
          idempotencyKey: "k1",
          createdBy: "user",
          attemptCount: 0,
          createdAt: "2026-08-05T12:00:00.000Z",
          updatedAt: "2026-08-05T12:00:00.000Z",
          completedAt: null
        }
      ],
      inboxUnreadCount: 5,
      inboxPreview: [
        {
          itemId: "i1",
          organizationId: "org",
          kind: "message",
          title: "Resident escalation",
          body: null,
          priority: "high",
          unread: true,
          assignmentState: null,
          deepLink: "/inbox",
          createdAt: "2026-08-05T12:00:00.000Z"
        } as never
      ],
      aiRecommendations: [],
      recentActivity: [],
      quickActions: [
        {
          actionId: "create_work_order",
          label: "Create work order",
          description: "Open maintenance create flow",
          href: "/maintenance?create=1",
          requiredPermissions: ["maintenance:create"],
          contexts: ["command_center"]
        }
      ],
      kpis: { signatures_pending: 2 },
      monitoring: {
        executionStatus: "healthy",
        queuePending: 0,
        workflowsActive: 1,
        automationFailed7d: 0,
        lagSeconds: null
      },
      alerts: [
        {
          title: "Ops execution critical",
          priority: "emergency",
          href: "/dashboard#ops-health"
        }
      ]
    };

    const model = buildUniversalDashboardViewModel({
      timeGreeting: "Good morning",
      userGreetingName: "Erick",
      organizationName: "Acme Properties",
      dateLabel: "Wednesday, August 5, 2026",
      snapshot: baseSnapshot(),
      commandCenterHome: home,
      permissionQuickActions: permissionQuickActionsFromFlags({
        canCreateMaintenance: true,
        canCreateProperty: true,
        canCreateTenant: true,
        canCreateLease: false,
        canCreateVendor: false,
        canCreateCommunication: false,
        canCreateFinancial: false,
        canCreateApplicant: false
      })
    });

    expect(model.surface).toBe("property_manager");
    expect(model.copy.eyebrow).toBe("Property Manager");
    expect(model.greeting.userName).toBe("Erick");
    expect(model.greeting.placeLabel).toContain("3 properties");
    expect(model.attention.length).toBeLessThanOrEqual(5);
    expect(model.attention[0]?.severity).toBe("critical");
    expect(model.mission.some((row) => row.id === "mission-maintenance" && row.count === 14)).toBe(true);
    expect(model.quickActions.length).toBeGreaterThan(0);
    expect(model.quickActions.length).toBeLessThanOrEqual(6);
    expect(model.insights.length).toBeGreaterThan(0);
    expect(model.greeting.statusSummary.toLowerCase()).toMatch(/work order|attention|resident/);
  });

  it("specializes organization admin content", () => {
    const model = buildUniversalDashboardViewModel({
      timeGreeting: "Good morning",
      userGreetingName: "Erick",
      organizationName: "Acme Properties",
      dateLabel: "Wednesday, August 5, 2026",
      snapshot: baseSnapshot({ propertiesTotal: 0 }),
      commandCenterHome: null,
      surface: "organization_admin"
    });

    expect(model.surface).toBe("organization_admin");
    expect(model.copy.eyebrow).toBe("Organization Admin");
    expect(model.attention.some((item) => item.id === "admin-setup-org")).toBe(true);
    expect(model.quickActions.some((action) => action.label === "Billing")).toBe(true);
  });

  it("shows calm clear status when nothing needs attention", () => {
    const model = buildUniversalDashboardViewModel({
      timeGreeting: "Good afternoon",
      userGreetingName: "Erick",
      organizationName: "Acme",
      dateLabel: "Wednesday, August 5, 2026",
      snapshot: baseSnapshot({
        propertiesTotal: 1,
        vacanciesTotal: 0,
        expiringLeasesTotal: 0,
        renewalNeededTotal: 0,
        operationalTasks: [],
        maintenance: null,
        vendors: null,
        leases: null,
        financial: null,
        applicants: null,
        recentActivity: []
      }),
      commandCenterHome: null
    });

    expect(model.attention).toHaveLength(0);
    expect(model.greeting.statusSummary).toMatch(/clear|mission/i);
    expect(model.greeting.placeLabel).toBe("1 property");
  });
});
