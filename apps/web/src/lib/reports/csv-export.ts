import type { ReportingSnapshot } from "@mpa/shared";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildReportingCsv(snapshot: ReportingSnapshot): string {
  const lines: string[] = [];
  lines.push(["section", "area", "label", "value", "detail"].map(csvEscape).join(","));

  for (const insight of snapshot.insights) {
    lines.push(
      ["insight", insight.area, insight.headline, insight.metricValue ?? "", insight.decision]
        .map((v) => csvEscape(String(v)))
        .join(",")
    );
  }

  for (const area of snapshot.areas) {
    for (const metric of area.metrics) {
      lines.push(
        ["metric", area.area, metric.label, metric.value, metric.hint ?? ""]
          .map((v) => csvEscape(String(v)))
          .join(",")
      );
    }
    for (const row of area.rows) {
      lines.push(
        ["row", area.area, row.label, row.value ?? "", row.status ?? row.secondary ?? ""]
          .map((v) => csvEscape(String(v)))
          .join(",")
      );
    }
  }

  return `${lines.join("\n")}\n`;
}
