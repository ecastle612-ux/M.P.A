import type { User } from "@supabase/supabase-js";
import { evaluatePermission, resolveAuthorizationContext } from "../auth/authorization";
import type { createAuthServerComponentClient } from "../auth/server";
import type { StatementStatus } from "../financial/contracts";
import { getOwnerStatementsForOrganization } from "../financial/server";
import type { ReportType } from "../reporting/contracts";
import { ReportingService } from "../reporting/service";
import {
  cappedOwnerPropertyIds,
  isPropertyInOwnerScope,
  resolveOwnerPropertyScope,
  type OwnerPropertyScope
} from "./access";
import type { OwnerFinancialStatementRow } from "./financial-shared";
import {
  formatOwnerReportPeriod,
  ownerReportTypeLabel,
  type OwnerReportListItem
} from "./reports-shared";

export type { OwnerReportListItem } from "./reports-shared";
export { OWNER_SAFE_REPORT_TYPE_LABELS, ownerReportTypeLabel } from "./reports-shared";

type SupabaseClient = Awaited<ReturnType<typeof createAuthServerComponentClient>>;

/** Owner-safe vaulted report types only — excludes rent roll, delinquency, maintenance (PM ops). */
export const OWNER_SAFE_REPORT_TYPES = [
  "owner_statement",
  "monthly_profit_and_loss",
  "cash_flow_summary",
  "expense_report"
] as const satisfies readonly ReportType[];

const OWNER_SAFE_REPORT_TYPE_SET = new Set<string>(OWNER_SAFE_REPORT_TYPES);

export type OwnerReportsExperienceModel = {
  scope: OwnerPropertyScope;
  statements: OwnerFinancialStatementRow[];
  reports: OwnerReportListItem[];
  properties: Array<{ id: string; name: string }>;
  reportTypes: Array<{ id: string; label: string }>;
  periods: Array<{ key: string; label: string }>;
  loadNotes: string[];
};

async function safeLoad<T>(loader: () => Promise<T>): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    return { ok: true, data: await loader() };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to load data."
    };
  }
}

function statementStatusLabel(status: StatementStatus): string {
  const labels: Record<StatementStatus, string> = {
    draft: "Draft",
    generated: "Generated",
    sent: "Sent",
    archived: "Archived"
  };
  return labels[status];
}

function formatDateLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

function periodYearMonth(periodEnd: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})/.exec(periodEnd);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

function isOwnerVisibleStatementStatus(status: StatementStatus): boolean {
  return status === "generated" || status === "sent" || status === "archived";
}

/**
 * OWNER-001 Phase 7 — property-scoped report versions + owner statements (consume only).
 */
export async function loadOwnerReportsExperience(input: {
  user: User;
  organizationId: string;
  supabase: SupabaseClient;
}): Promise<OwnerReportsExperienceModel> {
  const { user, organizationId, supabase } = input;
  const authorization = await resolveAuthorizationContext(user, organizationId);
  if (!evaluatePermission(authorization, "financial:read")) {
    throw new Error("Financial access is not enabled for this account.");
  }

  const scope = await resolveOwnerPropertyScope({ organizationId, user, supabase });
  const loadNotes: string[] = [];

  if (scope.propertyIds.length === 0) {
    return {
      scope,
      statements: [],
      reports: [],
      properties: [],
      reportTypes: [],
      periods: [],
      loadNotes: []
    };
  }

  const cappedIds = cappedOwnerPropertyIds(scope, 40);
  if (scope.propertyIds.length > cappedIds.length) {
    loadNotes.push(
      `Showing reports for the first ${cappedIds.length} of ${scope.propertyIds.length} properties.`
    );
  }

  const propertyNameById = new Map(scope.properties.map((property) => [property.id, property.name]));

  const [statementBundles, versionBundles] = await Promise.all([
    Promise.all(
      cappedIds.map(async (propertyId) => {
        const result = await safeLoad(() =>
          getOwnerStatementsForOrganization(organizationId, { propertyId, limit: 20 }, supabase)
        );
        return { propertyId, result };
      })
    ),
    Promise.all(
      cappedIds.map(async (propertyId) => {
        const result = await safeLoad(() =>
          ReportingService.listVersions({ organizationId, propertyId })
        );
        return { propertyId, result };
      })
    )
  ]);

  const downloadByStatementKey = new Map<string, string>();
  const reports: OwnerReportListItem[] = [];

  for (const { propertyId, result } of versionBundles) {
    if (!isPropertyInOwnerScope(propertyId, scope)) continue;
    if (!result.ok) {
      loadNotes.push(`Report versions could not be loaded for ${propertyNameById.get(propertyId) ?? "a property"}.`);
      continue;
    }

    const propertyName = propertyNameById.get(propertyId) ?? "Property";
    for (const version of result.data) {
      if (version.propertyId !== propertyId) continue;
      if (!OWNER_SAFE_REPORT_TYPE_SET.has(version.reportType)) continue;

      const period = formatOwnerReportPeriod(version.year, version.month);
      const downloadHref = version.downloadPath?.trim() || null;
      const pdfAvailable = Boolean(downloadHref);

      if (version.reportType === "owner_statement" && downloadHref) {
        downloadByStatementKey.set(`${propertyId}:${period.key}`, downloadHref);
      }

      reports.push({
        id: version.id,
        title: version.title || `${ownerReportTypeLabel(version.reportType)} — ${period.label}`,
        reportType: version.reportType,
        reportTypeLabel: ownerReportTypeLabel(version.reportType),
        propertyId,
        propertyName,
        periodLabel: period.label,
        periodKey: period.key,
        generatedAt: version.generatedAt,
        generatedAtLabel: formatDateLabel(version.generatedAt) ?? version.generatedAt,
        statusLabel: pdfAvailable ? "Available" : "Unavailable",
        pdfAvailable,
        downloadHref
      });
    }
  }

  reports.sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : a.generatedAt > b.generatedAt ? -1 : 0));

  const statements: OwnerFinancialStatementRow[] = [];
  for (const { propertyId, result } of statementBundles) {
    if (!isPropertyInOwnerScope(propertyId, scope)) continue;
    if (!result.ok) {
      loadNotes.push(`Statements could not be loaded for ${propertyNameById.get(propertyId) ?? "a property"}.`);
      continue;
    }
    for (const statement of result.data) {
      if (!isOwnerVisibleStatementStatus(statement.status)) continue;
      const ym = periodYearMonth(statement.statementPeriodEnd);
      const downloadHref =
        ym != null
          ? (downloadByStatementKey.get(
              `${propertyId}:${ym.year}-${String(ym.month).padStart(2, "0")}`
            ) ?? null)
          : null;
      statements.push({
        id: statement.id,
        propertyId,
        propertyName: propertyNameById.get(propertyId) ?? statement.propertyName ?? "Property",
        statementNumber: statement.statementNumber,
        statementDateLabel:
          formatDateLabel(statement.generatedAt) ??
          formatDateLabel(statement.createdAt) ??
          formatDateLabel(statement.statementPeriodEnd) ??
          "—",
        periodLabel: `${statement.statementPeriodStart} → ${statement.statementPeriodEnd}`,
        status: statement.status,
        statusLabel: statementStatusLabel(statement.status),
        generatedAtLabel: formatDateLabel(statement.generatedAt),
        downloadHref
      });
    }
  }
  statements.sort((a, b) => (a.periodLabel < b.periodLabel ? 1 : a.periodLabel > b.periodLabel ? -1 : 0));

  const reportTypeIds = [...new Set(reports.map((report) => report.reportType))].sort((a, b) =>
    a.localeCompare(b)
  );
  const periodMap = new Map<string, string>();
  for (const report of reports) {
    if (!periodMap.has(report.periodKey)) {
      periodMap.set(report.periodKey, report.periodLabel);
    }
  }

  return {
    scope,
    statements,
    reports,
    properties: cappedIds.map((id) => ({
      id,
      name: propertyNameById.get(id) ?? "Property"
    })),
    reportTypes: reportTypeIds.map((id) => ({ id, label: ownerReportTypeLabel(id) })),
    periods: [...periodMap.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0))
      .map(([key, label]) => ({ key, label })),
    loadNotes: [...new Set(loadNotes)]
  };
}
