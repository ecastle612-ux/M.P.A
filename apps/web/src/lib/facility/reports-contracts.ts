export const FACILITY_REPORT_TYPES = [
  "technician_activity",
  "inventory_status",
  "asset_register",
  "monthly_building"
] as const;

export type FacilityReportType = (typeof FACILITY_REPORT_TYPES)[number];

export type FacilityReportLine = {
  id: string;
  label: string;
  detail: string;
};

export type FacilityReportSection = {
  id: string;
  title: string;
  lines: FacilityReportLine[];
};

export type FacilityReportModel = {
  reportType: FacilityReportType;
  title: string;
  organizationName: string;
  propertyName: string;
  periodLabel: string;
  generatedAt: string;
  sections: FacilityReportSection[];
  totals: Array<{ label: string; value: string }>;
  notes: string[];
};

export type FacilityReportRequest = {
  reportType: FacilityReportType;
  propertyId: string;
  year: number;
  month: number;
};

export function isFacilityReportType(value: string): value is FacilityReportType {
  return (FACILITY_REPORT_TYPES as readonly string[]).includes(value);
}

export function facilityReportTitle(type: FacilityReportType): string {
  switch (type) {
    case "technician_activity":
      return "Technician activity";
    case "inventory_status":
      return "Inventory status";
    case "asset_register":
      return "Asset register";
    case "monthly_building":
      return "Monthly building report";
    default:
      return type;
  }
}

export const FACILITY_REPORT_CATALOG: Array<{
  type: FacilityReportType;
  title: string;
  description: string;
}> = [
  {
    type: "technician_activity",
    title: "Technician activity",
    description: "Completed and open work orders by assignee for the selected period."
  },
  {
    type: "inventory_status",
    title: "Inventory status",
    description: "Inventory counts by status, optionally scoped to a building/site."
  },
  {
    type: "asset_register",
    title: "Asset register",
    description: "Building assets with warranty and expected-life flags."
  },
  {
    type: "monthly_building",
    title: "Monthly building",
    description: "Period work orders, PM due, inspections, and notable expenses."
  }
];

export function parseFacilityReportRequest(payload: unknown): FacilityReportRequest | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  const reportType = record["reportType"];
  const propertyId = typeof record["propertyId"] === "string" ? record["propertyId"].trim() : "";
  const year = typeof record["year"] === "number" ? record["year"] : Number(record["year"]);
  const month = typeof record["month"] === "number" ? record["month"] : Number(record["month"]);
  if (typeof reportType !== "string" || !isFacilityReportType(reportType)) return null;
  if (!propertyId || !Number.isInteger(year) || year < 2000 || year > 2100) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  return { reportType, propertyId, year, month };
}
