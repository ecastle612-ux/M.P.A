import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { resolveAuthorizationContext, evaluatePermission } from "../../../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../../../lib/organization/resolve-active-organization";
import { getDailyOpsReadiness } from "../../../../../lib/property/daily-ops-service";
import { buildOwnerPortfolioHome } from "../../../../../lib/property/owner-portfolio-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const organizationId = await resolveActiveOrganizationIdForUser(supabase, user.id, {
    allowResidentFallback: false
  });
  if (!organizationId) {
    return NextResponse.json({ error: "Organization required" }, { status: 400 });
  }

  const authorizationContext = await resolveAuthorizationContext(user, organizationId);
  const canReadReports = evaluatePermission(authorizationContext, "pm.finance:reports.read");
  const canReadProperties = evaluatePermission(authorizationContext, "pm.properties:read");
  if (!canReadReports && !canReadProperties) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const dailyOps = await getDailyOpsReadiness(supabase, organizationId);
    const portfolio = await buildOwnerPortfolioHome(
      supabase,
      organizationId,
      {
        userId: user.id,
        displayName:
          (typeof user.user_metadata?.["full_name"] === "string"
            ? user.user_metadata["full_name"]
            : null) ??
          user.email ??
          null
      },
      {
        markReviewed: true,
        dailyOpsReady: dailyOps.dailyOpsReady
      }
    );
    return NextResponse.json(portfolio);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load owner portfolio" },
      { status: 400 }
    );
  }
}
