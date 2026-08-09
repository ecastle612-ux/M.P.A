export const REPORT_CAPABILITIES = ["platform.reports:read"] as const;

export type ReportCapability = (typeof REPORT_CAPABILITIES)[number];

export function hasReportCapability(
  granted: readonly string[],
  required: ReportCapability
): boolean {
  return granted.includes(required);
}
