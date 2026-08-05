import { describe, expect, it } from "vitest";
import type { MigrationJobRecord } from "./contracts";
import type { MigrationDashboardMetrics } from "./server";
import { buildMigrationUniversalDashboardViewModel } from "./ux016-view-model";

function job(overrides: Partial<MigrationJobRecord>): MigrationJobRecord {
  return {
    id: "job-1",
    organizationId: "org-1",
    name: "AppFolio import",
    jobNumber: "MIG-001",
    status: "importing",
    sourceSoftware: "appfolio",
    currentStep: "import",
    progressTotal: 100,
    progressImported: 40,
    progressErrors: 0,
    progressWarnings: 0,
    completionPct: 40,
    checkpointId: null,
    summary: {},
    metadata: {},
    startedAt: "2026-08-05T10:00:00.000Z",
    completedAt: null,
    rolledBackAt: null,
    createdAt: "2026-08-05T09:00:00.000Z",
    updatedAt: "2026-08-05T10:00:00.000Z",
    deletedAt: null,
    ...overrides
  };
}

const metrics: MigrationDashboardMetrics = {
  activeJobs: 1,
  completedJobs: 2,
  pendingReview: 3,
  recentErrors: 2,
  averageCompletionPct: 55,
  recentImports: [
    {
      id: "job-1",
      jobNumber: "MIG-001",
      name: "AppFolio import",
      status: "importing",
      completionPct: 40,
      href: "/migration/job-1"
    }
  ],
  pendingReviewSample: [
    {
      id: "rev-1",
      jobId: "job-1",
      title: "Map unit numbers",
      itemType: "unit",
      href: "/migration/job-1"
    }
  ],
  recentActivity: [
    {
      id: "act-1",
      jobId: "job-1",
      jobNumber: "MIG-001",
      summary: "Import batch completed with warnings",
      eventType: "import_batch",
      createdAt: "2026-08-05T11:00:00.000Z",
      href: "/migration/job-1"
    }
  ]
};

describe("buildMigrationUniversalDashboardViewModel (STD-001)", () => {
  it("mounts Migration Operations surface with UDF sections", () => {
    const model = buildMigrationUniversalDashboardViewModel({
      jobs: [job({})],
      metrics,
      canCreate: true,
      userName: "Erick",
      organizationName: "Canopy HQ",
      timeGreeting: "Good morning",
      dateLabel: "Wednesday, August 5, 2026"
    });

    expect(model.greeting.surfaceLabel).toBe("Migration Operations");
    expect(model.assistant.headline).toMatch(/operational briefing/i);
    expect(model.mission.some((row) => /migrating|mapping|failed/i.test(row.label))).toBe(true);
    expect(model.insights.some((row) => /health/i.test(row.label))).toBe(true);
    expect(model.quickActions[0]?.id).toBe("qa-start");
    expect(model.recentActivity[0]?.summary).toMatch(/import/i);
  });

  it("prioritizes blockers first in Immediate Attention", () => {
    const model = buildMigrationUniversalDashboardViewModel({
      jobs: [
        job({ id: "ok", name: "Healthy", status: "importing", progressErrors: 0 }),
        job({ id: "bad", name: "Broken lease file", status: "failed", progressErrors: 12 })
      ],
      metrics,
      canCreate: false,
      timeGreeting: "Good afternoon",
      dateLabel: "Wednesday, August 5, 2026"
    });

    expect(model.attention[0]?.id).toBe("mig-block-bad");
    expect(model.attention[0]?.severity).toBe("critical");
    expect(model.attention[0]?.title).toMatch(/blocker/i);
    expect(model.greeting.placeLabel.toLowerCase()).toContain("blocker");
  });
});
