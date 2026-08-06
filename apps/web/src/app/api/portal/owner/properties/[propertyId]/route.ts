import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../../lib/auth/server";
import { resolveAuthorizationContext, evaluatePermission } from "../../../../../../lib/auth/authorization";
import { getActiveOrganizationIdFromCookie } from "../../../../../../lib/organization/server";
import { buildOwnerPropertyDrillDown } from "../../../../../../lib/property/owner-portfolio-service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ propertyId: string }> };

export async function GET(_request: Request, context: Params) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const organizationId = await getActiveOrganizationIdFromCookie();
  if (!organizationId) {
    return NextResponse.json({ error: "Organization required" }, { status: 400 });
  }

  const authorizationContext = await resolveAuthorizationContext(user, organizationId);
  const canRead =
    evaluatePermission(authorizationContext, "pm.properties:read") ||
    evaluatePermission(authorizationContext, "pm.finance:reports.read");
  if (!canRead) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { propertyId } = await context.params;

  try {
    const drillDown = await buildOwnerPropertyDrillDown(supabase, organizationId, propertyId);
    if (!drillDown) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    return NextResponse.json(drillDown);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load property" },
      { status: 400 }
    );
  }
}
