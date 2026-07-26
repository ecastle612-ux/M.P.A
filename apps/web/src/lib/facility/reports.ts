import { createAuthServerComponentClient } from "../auth/server";
import { listFacilityAssets } from "./asset-server";
import { listFacilityInventory } from "./inventory-server";
import { listInspectionRuns } from "./inspection-server";
import { listPmSchedules } from "./pm-server";
import { getWorkOrdersForOrganization } from "../maintenance/server";
import { getPropertyForOrganization } from "../property/server";
import { getOrganizationsForUser } from "../organization/server";
import {
  facilityReportTitle,
  type FacilityReportLine,
  type FacilityReportModel,
  type FacilityReportRequest
} from "./reports-contracts";

export {
  FACILITY_REPORT_CATALOG,
  FACILITY_REPORT_TYPES,
  facilityReportTitle,
  isFacilityReportType,
  parseFacilityReportRequest,
  type FacilityReportLine,
  type FacilityReportModel,
  type FacilityReportRequest,
  type FacilityReportSection,
  type FacilityReportType
} from "./reports-contracts";

type SupabaseClientType = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

function periodBounds(year: number, month: number): { startDate: string; endDate: string; label: string } {
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(Date.UTC(year, month, 0));
  const endDate = end.toISOString().slice(0, 10);
  const label = new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });
  return { startDate, endDate, label };
}

function inPeriod(day: string, startDate: string, endDate: string): boolean {
  return day >= startDate && day <= endDate;
}

export async function buildFacilityReport(
  organizationId: string,
  userId: string,
  request: FacilityReportRequest,
  client?: SupabaseClientType
): Promise<FacilityReportModel> {
  const supabase = client ?? (await createAuthServerComponentClient());
  const property = await getPropertyForOrganization(organizationId, request.propertyId, supabase);
  if (!property) throw new Error("Property not found");

  const orgs = await getOrganizationsForUser(userId);
  const organizationName = orgs.find((org) => org.id === organizationId)?.name ?? "Organization";
  const period = periodBounds(request.year, request.month);
  const generatedAt = new Date().toISOString();
  const base = {
    reportType: request.reportType,
    title: facilityReportTitle(request.reportType),
    organizationName,
    propertyName: property.name,
    periodLabel: period.label,
    generatedAt
  };

  switch (request.reportType) {
    case "technician_activity":
      return buildTechnicianActivity(organizationId, request.propertyId, period, base, supabase);
    case "inventory_status":
      return buildInventoryStatus(organizationId, request.propertyId, base, supabase);
    case "asset_register":
      return buildAssetRegister(organizationId, request.propertyId, base, supabase);
    case "monthly_building":
      return buildMonthlyBuilding(organizationId, request.propertyId, period, base, supabase);
    default: {
      const _exhaustive: never = request.reportType;
      return _exhaustive;
    }
  }
}

async function buildTechnicianActivity(
  organizationId: string,
  propertyId: string,
  period: { startDate: string; endDate: string; label: string },
  base: Omit<FacilityReportModel, "sections" | "totals" | "notes">,
  client: SupabaseClientType
): Promise<FacilityReportModel> {
  const workOrders = await getWorkOrdersForOrganization(
    organizationId,
    { propertyId, status: "all", limit: 2000 },
    client
  );
  const periodOrders = workOrders.filter((wo) => {
    const created = wo.createdAt.slice(0, 10);
    const completed = wo.completedAt?.slice(0, 10);
    return (
      inPeriod(created, period.startDate, period.endDate) ||
      (completed ? inPeriod(completed, period.startDate, period.endDate) : false)
    );
  });

  const byAssignee = new Map<string, { open: number; completed: number }>();
  for (const wo of periodOrders) {
    const key = wo.assignedToUserId ?? "unassigned";
    const bucket = byAssignee.get(key) ?? { open: 0, completed: 0 };
    if (wo.status === "completed") bucket.completed += 1;
    else bucket.open += 1;
    byAssignee.set(key, bucket);
  }

  const lines: FacilityReportLine[] = [...byAssignee.entries()].map(([assignee, counts]) => ({
    id: assignee,
    label: assignee === "unassigned" ? "Unassigned" : `Assignee ${assignee.slice(0, 8)}…`,
    detail: `${counts.completed} completed · ${counts.open} open`
  }));

  return {
    ...base,
    sections: [{ id: "by_assignee", title: "By assignee", lines }],
    totals: [
      { label: "Work orders in period", value: String(periodOrders.length) },
      {
        label: "Completed",
        value: String(periodOrders.filter((wo) => wo.status === "completed").length)
      },
      {
        label: "Still open",
        value: String(periodOrders.filter((wo) => wo.status !== "completed").length)
      }
    ],
    notes: ["Assignee labels show truncated user ids when display names are unavailable."]
  };
}

async function buildInventoryStatus(
  organizationId: string,
  propertyId: string,
  base: Omit<FacilityReportModel, "sections" | "totals" | "notes">,
  client: SupabaseClientType
): Promise<FacilityReportModel> {
  const items = await listFacilityInventory(organizationId, { propertyId, limit: 500 }, client);
  const byStatus = new Map<string, number>();
  for (const item of items) {
    byStatus.set(item.status, (byStatus.get(item.status) ?? 0) + 1);
  }
  const lines = [...byStatus.entries()].map(([status, count]) => ({
    id: status,
    label: status.replaceAll("_", " "),
    detail: `${count} item${count === 1 ? "" : "s"}`
  }));
  const sample = items.slice(0, 40).map((item) => ({
    id: item.id,
    label: item.name,
    detail: `${item.status.replaceAll("_", " ")}${item.serialNumber ? ` · ${item.serialNumber}` : ""}`
  }));

  return {
    ...base,
    sections: [
      { id: "counts", title: "Counts by status", lines },
      { id: "sample", title: "Inventory list (first 40)", lines: sample }
    ],
    totals: [{ label: "Total items", value: String(items.length) }],
    notes: ["Scoped to the selected building/site when inventory items are property-linked."]
  };
}

async function buildAssetRegister(
  organizationId: string,
  propertyId: string,
  base: Omit<FacilityReportModel, "sections" | "totals" | "notes">,
  client: SupabaseClientType
): Promise<FacilityReportModel> {
  const assets = await listFacilityAssets(organizationId, { propertyId, limit: 500 }, client);
  const today = new Date().toISOString().slice(0, 10);
  const lines = assets.map((asset) => {
    const flags: string[] = [];
    if (asset.warrantyEndsOn && asset.warrantyEndsOn < today) flags.push("warranty expired");
    else if (asset.warrantyEndsOn) flags.push(`warranty ends ${asset.warrantyEndsOn}`);
    if (asset.replacementPlanned) {
      flags.push(
        asset.replacementTargetYear
          ? `replacement ${asset.replacementTargetYear}`
          : "replacement planned"
      );
    }
    if (asset.expectedLifeYears != null) flags.push(`${asset.expectedLifeYears} yr life`);
    return {
      id: asset.id,
      label: `${asset.assetCode} · ${asset.name}`,
      detail: flags.join(" · ") || asset.status
    };
  });

  return {
    ...base,
    sections: [{ id: "assets", title: "Assets", lines }],
    totals: [
      { label: "Assets", value: String(assets.length) },
      {
        label: "Replacement planned",
        value: String(assets.filter((asset) => asset.replacementPlanned).length)
      }
    ],
    notes: ["Warranty and life fields come from Facility Assets V1."]
  };
}

async function buildMonthlyBuilding(
  organizationId: string,
  propertyId: string,
  period: { startDate: string; endDate: string; label: string },
  base: Omit<FacilityReportModel, "sections" | "totals" | "notes">,
  client: SupabaseClientType
): Promise<FacilityReportModel> {
  const [workOrders, schedules, inspections] = await Promise.all([
    getWorkOrdersForOrganization(organizationId, { propertyId, status: "all", limit: 2000 }, client),
    listPmSchedules(organizationId, {}, client),
    listInspectionRuns(organizationId, { propertyId, limit: 200 }, client)
  ]);

  const periodOrders = workOrders.filter((wo) => {
    const created = wo.createdAt.slice(0, 10);
    const completed = wo.completedAt?.slice(0, 10);
    return (
      inPeriod(created, period.startDate, period.endDate) ||
      (completed ? inPeriod(completed, period.startDate, period.endDate) : false)
    );
  });
  const propertySchedules = schedules.filter((schedule) => schedule.propertyId === propertyId);
  const pmDue = propertySchedules.filter(
    (schedule) =>
      schedule.active && inPeriod(schedule.nextDue, period.startDate, period.endDate)
  );
  const periodInspections = inspections.filter((run) => {
    const day = (run.completedAt ?? run.createdAt).slice(0, 10);
    return inPeriod(day, period.startDate, period.endDate);
  });

  return {
    ...base,
    sections: [
      {
        id: "work_orders",
        title: "Work orders",
        lines: periodOrders.slice(0, 50).map((wo) => ({
          id: wo.id,
          label: `${wo.workOrderNumber} · ${wo.title}`,
          detail: `${wo.status} · ${wo.priority}`
        }))
      },
      {
        id: "pm",
        title: "PM due in period",
        lines: pmDue.map((schedule) => ({
          id: schedule.id,
          label: schedule.title,
          detail: `Next due ${schedule.nextDue}${schedule.overdue ? " · overdue" : ""}`
        }))
      },
      {
        id: "inspections",
        title: "Inspections",
        lines: periodInspections.map((run) => ({
          id: run.id,
          label: run.title,
          detail: `${run.status}${run.failCount > 0 ? ` · ${run.failCount} fail` : ""}`
        }))
      }
    ],
    totals: [
      { label: "Work orders", value: String(periodOrders.length) },
      { label: "PM due", value: String(pmDue.length) },
      { label: "Inspections", value: String(periodInspections.length) },
      {
        label: "Completed WOs",
        value: String(periodOrders.filter((wo) => wo.status === "completed").length)
      }
    ],
    notes: [
      "Notable expenses remain in Financial reports when Property Operations accounting is enabled."
    ]
  };
}
