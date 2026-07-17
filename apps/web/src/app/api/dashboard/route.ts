import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { getDashboardSnapshot } from "../../../lib/dashboard/server";
import { apiError, apiInternalError } from "../../../lib/api/http";

export async function GET() {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(401, "UNAUTHENTICATED", "Unauthenticated");
    }

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return NextResponse.json(
        {
          snapshot: {
            propertiesTotal: 0,
            unitsTotal: 0,
            occupiedUnits: 0,
            vacanciesTotal: 0,
            vacantReadyUnits: 0,
            tenantsTotal: 0,
            activeTenants: 0,
            recentMoveIns: 0,
            recentTenantsCreated: 0,
            propertiesWithoutUnits: 0,
            occupancyRate: 0,
            expiringLeasesTotal: 0,
            renewalNeededTotal: 0,
            recentActivity: [],
            operationalTasks: [],
            maintenance: null,
            vendors: null,
            leases: null
          },
          organizationId: null
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "dashboard:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const snapshot = await getDashboardSnapshot(organizationId, supabase, user.id);
    return NextResponse.json({ organizationId, snapshot }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}
