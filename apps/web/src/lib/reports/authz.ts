import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReportCapability } from "@mpa/shared";
import { createAuthServerClient } from "../auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../auth/authorization";
import { getActiveOrganizationIdFromCookie } from "../organization/server";

export async function requireReportPermission(
  capability: ReportCapability = "platform.reports:read",
  organizationId?: string
) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
  }

  const orgId = organizationId ?? (await getActiveOrganizationIdFromCookie());
  if (!orgId) {
    return { error: NextResponse.json({ error: "Organization required" }, { status: 400 }) };
  }

  const authorizationContext = await resolveAuthorizationContext(user, orgId);
  if (!evaluatePermission(authorizationContext, capability)) {
    const permissions = authorizationContext.permissions ?? [];
    const roles = authorizationContext.roles ?? [];
    const hasLegacy =
      permissions.includes("platform.documents:read") &&
      (roles.includes("organization_admin") ||
        roles.includes("property_manager") ||
        roles.includes("maintenance_technician") ||
        roles.includes("leasing_agent"));
    if (!hasLegacy) {
      return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- match documents authz Db client typing
    supabase: supabase as SupabaseClient<any>,
    user,
    organizationId: orgId,
    authorizationContext
  };
}
