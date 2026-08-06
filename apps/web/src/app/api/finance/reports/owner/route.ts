import { NextResponse } from "next/server";
import {
  OWNER_SUMMARY_CSV_COLUMNS,
  ownerSummaryToCsvRows,
  toCsv
} from "@mpa/shared";
import { requireFinancePermission } from "../../../../../lib/finance/authz";
import {
  getOwnerFinancialSummary,
  ownerSummaryWithAssistant,
  recordSummaryGenerated
} from "../../../../../lib/finance/reporting-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authz = await requireFinancePermission("pm.finance:reports.read");
  if ("error" in authz) {
    return authz.error;
  }

  try {
    const summary = ownerSummaryWithAssistant(
      await getOwnerFinancialSummary(authz.supabase, authz.organizationId)
    );
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");

    await recordSummaryGenerated(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      "owner",
      authz.organizationId
    );

    if (format === "csv") {
      const csv = toCsv(ownerSummaryToCsvRows(summary), OWNER_SUMMARY_CSV_COLUMNS);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="owner-financial-summary.csv"`
        }
      });
    }

    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load owner summary" },
      { status: 400 }
    );
  }
}
