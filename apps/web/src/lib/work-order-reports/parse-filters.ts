import type { WorkOrderReportFilters, WorkOrderReportDateMode } from "@mpa/shared";
import {
  WORK_ORDER_CATEGORIES,
  WORK_ORDER_PRIORITIES,
  WORK_ORDER_STATUSES,
  WORK_ORDER_REPORT_DATE_MODES
} from "@mpa/shared";

function splitCsv(value: string | null): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function defaultDateRange(): { dateFrom: string; dateTo: string } {
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  return {
    dateFrom: start.toISOString().slice(0, 10),
    dateTo: end.toISOString().slice(0, 10)
  };
}

function asDateMode(value: string | null): WorkOrderReportDateMode {
  if (value && (WORK_ORDER_REPORT_DATE_MODES as readonly string[]).includes(value)) {
    return value as WorkOrderReportDateMode;
  }
  return "created";
}

export function parseWorkOrderReportFilters(
  searchParams: URLSearchParams
): WorkOrderReportFilters {
  const defaults = defaultDateRange();
  const dateFrom = searchParams.get("dateFrom")?.trim() || defaults.dateFrom;
  const dateTo = searchParams.get("dateTo")?.trim() || defaults.dateTo;
  const statuses = splitCsv(searchParams.get("status")).filter((value) =>
    (WORK_ORDER_STATUSES as readonly string[]).includes(value)
  );
  const priorities = splitCsv(searchParams.get("priority")).filter((value) =>
    (WORK_ORDER_PRIORITIES as readonly string[]).includes(value)
  );
  const categories = splitCsv(searchParams.get("category")).filter((value) =>
    (WORK_ORDER_CATEGORIES as readonly string[]).includes(value)
  );

  return {
    dateFrom,
    dateTo,
    dateMode: asDateMode(searchParams.get("dateMode")),
    propertyIds: splitCsv(searchParams.get("propertyId")),
    location: searchParams.get("location")?.trim() || undefined,
    statuses: statuses as WorkOrderReportFilters["statuses"],
    priorities: priorities as WorkOrderReportFilters["priorities"],
    categories: categories as WorkOrderReportFilters["categories"],
    vendorIds: splitCsv(searchParams.get("vendorId")),
    userIds: splitCsv(searchParams.get("userId")),
    includeUnassignedVendor: searchParams.get("unassignedVendor") === "1"
  };
}

export function toIsoDayStart(date: string): string {
  return `${date}T00:00:00.000Z`;
}

export function toIsoDayEnd(date: string): string {
  return `${date}T23:59:59.999Z`;
}
