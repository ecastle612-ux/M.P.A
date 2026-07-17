import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";
import { getFinancialDashboardMetrics } from "../../../../lib/financial/server";
import { apiError, apiInternalError } from "../../../../lib/api/http";

export async function GET() {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return NextResponse.json(
        {
          metrics: {
            rentDueToday: 0,
            lateRentCount: 0,
            outstandingBalancesTotal: 0,
            recentPayments: [],
            recentExpenses: [],
            ownerStatementStatusCounts: { draft: 0, generated: 0, sent: 0, archived: 0 }
          }
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "financial:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const metrics = await getFinancialDashboardMetrics(organizationId, supabase);
    return NextResponse.json({ metrics }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}
