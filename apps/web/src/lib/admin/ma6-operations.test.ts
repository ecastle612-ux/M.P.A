import { describe, expect, it } from "vitest";
import {
  ageInDays,
  buildOrgOpsRows,
  detectOperationalAnomalies,
  filterWorkOrders,
  isWorkOrderOverdue,
  isWorkOrderUnassigned,
  mapNotificationRow,
  mapWorkOrderRow,
  paginateRows,
  parseOpsFilters,
  scrubMa6Payload,
  summarizeOperationsOverview
} from "./ma6-operations";

const now = Date.parse("2026-08-11T12:00:00.000Z");

describe("MA-6 work order health (factual, no invented SLA)", () => {
  it("marks overdue only when due_at is past and status is open", () => {
    expect(isWorkOrderOverdue("in_progress", "2026-08-01T00:00:00.000Z", now)).toBe(true);
    expect(isWorkOrderOverdue("completed", "2026-08-01T00:00:00.000Z", now)).toBe(false);
    expect(isWorkOrderOverdue("submitted", null, now)).toBe(false);
    expect(isWorkOrderOverdue("submitted", "2026-08-20T00:00:00.000Z", now)).toBe(false);
  });

  it("detects unassigned open work orders", () => {
    expect(isWorkOrderUnassigned("submitted", "unassigned")).toBe(true);
    expect(isWorkOrderUnassigned("assigned", "vendor")).toBe(false);
    expect(isWorkOrderUnassigned("closed", "unassigned")).toBe(false);
  });

  it("exposes factual age without inventing threshold anomalies", () => {
    expect(ageInDays("2026-08-01T12:00:00.000Z", now)).toBe(10);
    const row = mapWorkOrderRow({
      id: "wo1",
      organization_id: "org_a",
      title: "Leak",
      status: "in_progress",
      priority: "high",
      assignee_type: "technician",
      created_at: "2026-08-01T12:00:00.000Z",
      updated_at: "2026-08-10T12:00:00.000Z",
      due_at: null,
      nowMs: now
    });
    expect(row.ageDays).toBe(10);
    expect(row.overdue).toBe(false);
    expect(row.health).toBe("healthy");
  });
});

describe("MA-6 filters / pagination / anomalies", () => {
  it("parses filters and paginates", () => {
    const parsed = parseOpsFilters(
      new URLSearchParams(
        "q=leak&organizationId=org_a&status=submitted&overdue=yes&assigned=unassigned&page=2&pageSize=200&range=24h"
      )
    );
    expect(parsed.q).toBe("leak");
    expect(parsed.overdue).toBe("yes");
    expect(parsed.assigned).toBe("unassigned");
    expect(parsed.pageSize).toBe(100);
    expect(parsed.since).toBeTruthy();
    expect(paginateRows([1, 2, 3], 2, 2)).toEqual([3]);
  });

  it("filters work orders and detects overdue/unassigned/failed notification anomalies", () => {
    const rows = [
      mapWorkOrderRow({
        id: "wo1",
        organization_id: "org_a",
        organization_name: "Alpha",
        title: "Leak",
        status: "submitted",
        priority: "high",
        assignee_type: "unassigned",
        created_at: "2026-08-10T00:00:00.000Z",
        updated_at: "2026-08-10T00:00:00.000Z",
        due_at: "2026-08-01T00:00:00.000Z",
        nowMs: now
      }),
      mapWorkOrderRow({
        id: "wo2",
        organization_id: "org_b",
        title: "Paint",
        status: "completed",
        priority: "low",
        assignee_type: "vendor",
        created_at: "2026-08-10T00:00:00.000Z",
        updated_at: "2026-08-10T00:00:00.000Z",
        nowMs: now
      })
    ];
    expect(filterWorkOrders(rows, { page: 1, pageSize: 50, overdue: "yes" })).toHaveLength(1);
    expect(filterWorkOrders(rows, { page: 1, pageSize: 50, assigned: "unassigned" })).toHaveLength(1);
    expect(filterWorkOrders(rows, { page: 1, pageSize: 50, q: "paint" })).toHaveLength(1);

    const notif = mapNotificationRow({
      id: "n1",
      organization_id: "org_a",
      title: "WO update",
      email_delivery_status: "failed",
      email_delivery_error: "smtp boom",
      work_order_id: "wo1",
      created_at: "2026-08-11T00:00:00.000Z"
    });
    const anomalies = detectOperationalAnomalies({ workOrders: rows, notifications: [notif] });
    expect(anomalies.some((a) => a.code === "overdue_work_order")).toBe(true);
    expect(anomalies.some((a) => a.code === "unassigned_work_order")).toBe(true);
    expect(anomalies.some((a) => a.code === "failed_notification")).toBe(true);
    expect(anomalies.some((a) => a.code === "organization_operational_backlog")).toBe(true);
  });
});

describe("MA-6 overview / org health / privacy", () => {
  it("summarizes overview and org rows", () => {
    const wo = mapWorkOrderRow({
      id: "wo1",
      organization_id: "org_a",
      title: "Leak",
      status: "submitted",
      priority: "normal",
      assignee_type: "unassigned",
      created_at: "2026-08-10T00:00:00.000Z",
      updated_at: "2026-08-10T00:00:00.000Z",
      due_at: "2026-08-01T00:00:00.000Z",
      nowMs: now
    });
    const anomalies = detectOperationalAnomalies({ workOrders: [wo], notifications: [] });
    const orgRows = buildOrgOpsRows({
      organizations: [{ id: "org_a", name: "Alpha" }],
      propertyCountByOrg: new Map([["org_a", 2]]),
      unitCountByOrg: new Map([["org_a", 10]]),
      workOrders: [wo],
      vendorCountByOrg: new Map([["org_a", 1]]),
      notificationFailuresByOrg: new Map([["org_a", 0]]),
      anomalies
    });
    expect(orgRows[0]?.health).toBe("attention");
    expect(orgRows[0]?.overdueWorkOrders).toBe(1);

    const overview = summarizeOperationsOverview({
      propertyCount: 2,
      unitCount: 10,
      workOrders: [wo],
      vendors: [
        {
          id: "v1",
          organizationId: "org_a",
          organizationName: "Alpha",
          name: "Vendor",
          status: "active",
          email: null,
          phone: null,
          outstandingWorkOrders: 1,
          health: "healthy"
        }
      ],
      notifications: [],
      orgRows,
      degraded: false
    });
    expect(overview.openWorkOrders).toBe(1);
    expect(overview.overdueWorkOrders).toBe(1);
    expect(overview.health).toBe("attention");
  });

  it("scrubs secrets from payloads", () => {
    const scrubbed = scrubMa6Payload({ password: "x", ok: 1 });
    expect(scrubbed["password"]).toBe("[redacted]");
    expect(scrubbed["ok"]).toBe(1);
  });

  it("maps notification health from authoritative delivery status only", () => {
    expect(mapNotificationRow({
      id: "n1",
      organization_id: "org_a",
      title: "t",
      email_delivery_status: "sent",
      created_at: "2026-08-11T00:00:00.000Z"
    }).health).toBe("healthy");
    expect(mapNotificationRow({
      id: "n2",
      organization_id: "org_a",
      title: "t",
      email_delivery_status: null,
      created_at: "2026-08-11T00:00:00.000Z"
    }).health).toBe("unknown");
  });
});
