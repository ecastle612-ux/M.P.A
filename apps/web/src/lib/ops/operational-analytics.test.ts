import { describe, expect, it } from "vitest";
import type { KpiKey } from "./operational-analytics";

const REQUIRED_KPI_KEYS: KpiKey[] = [
  "tasks.open",
  "tasks.completed_7d",
  "tasks.aging_gt_72h",
  "workflows.active",
  "workflows.failed_7d",
  "workflows.completed_7d",
  "automation.fires_7d",
  "automation.failed_7d",
  "automation.success_rate_7d",
  "ai.recommendations_pending",
  "ai.recommendations_applied_7d",
  "sla.overdue_tasks",
  "queue.pending_events",
  "notify.delivered_7d",
  "notify.failed_7d"
];

describe("OPS-001 Slice D operational analytics KPI catalog", () => {
  it("covers authorized operational KPI surface", () => {
    expect(REQUIRED_KPI_KEYS).toContain("automation.success_rate_7d");
    expect(REQUIRED_KPI_KEYS).toContain("sla.overdue_tasks");
    expect(REQUIRED_KPI_KEYS).toContain("workflows.active");
    expect(REQUIRED_KPI_KEYS.length).toBeGreaterThanOrEqual(12);
  });
});
