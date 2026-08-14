import {
  WORK_ORDER_REPORT_CSV_HEADERS,
  type WorkOrderReportExportRow,
  type WorkOrderReportSnapshot
} from "./schemas";

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function rowValues(row: WorkOrderReportExportRow): string[] {
  return [
    row.workOrderId,
    row.createdDate,
    row.requestedBy,
    row.location,
    row.category,
    row.priority,
    row.description,
    row.assignedVendor,
    row.assignedUser,
    row.status,
    row.completedDate,
    row.completionNotes,
    row.mediaAttached
  ];
}

export function buildWorkOrderReportCsv(snapshot: WorkOrderReportSnapshot): string {
  const lines: string[] = [];
  lines.push(`# organization,${csvEscape(snapshot.organizationName)}`);
  lines.push(`# surface,${csvEscape(snapshot.surface)}`);
  lines.push(`# date_mode,${csvEscape(snapshot.filters.dateMode)}`);
  lines.push(
    `# period,${csvEscape(snapshot.filters.dateFrom)}..${csvEscape(snapshot.filters.dateTo)}`
  );
  lines.push(`# generated_at,${csvEscape(snapshot.generatedAt)}`);
  lines.push(WORK_ORDER_REPORT_CSV_HEADERS.map((header) => csvEscape(header)).join(","));

  for (const row of snapshot.rows) {
    lines.push(rowValues(row).map((value) => csvEscape(value)).join(","));
  }

  if (snapshot.truncated) {
    lines.push(
      csvEscape(
        `TRUNCATED: showing ${snapshot.rows.length} of ${snapshot.totalMatched} matching rows. Download filters more narrowly or contact support for a larger extract.`
      )
    );
  }

  return `${lines.join("\n")}\n`;
}

export function workOrderReportCsvFileName(snapshot: WorkOrderReportSnapshot): string {
  const slug = (snapshot.organizationSlug || "organization")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${slug || "organization"}_work-orders_${snapshot.surface}_${snapshot.filters.dateFrom}_${snapshot.filters.dateTo}.csv`;
}
