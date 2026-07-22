import { NextResponse } from "next/server";
import { extractRolesFromMetadata } from "@mpa/shared";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { userHasMasterAdminCapability } from "../../../../lib/master-admin/access";
import { resolveActiveOrganizationIdForUser } from "../../../../lib/organization/server";

export async function GET() {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { authenticated: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  // Match shell resolution: cookie → else first active membership (never empty when user has orgs).
  const activeOrganizationId = await resolveActiveOrganizationIdForUser(user.id);
  const { data: memberships } = await supabase
    .from("organization_memberships")
    .select("organization_id, roles, status")
    .eq("user_id", user.id)
    .eq("status", "active");
  const authorizationContext = await resolveAuthorizationContext(user, activeOrganizationId);
  const permissions = [...authorizationContext.permissions];
  if (!permissions.includes("master_admin") && (await userHasMasterAdminCapability(user))) {
    permissions.push("master_admin");
  }

  return NextResponse.json(
    {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        roles: extractRolesFromMetadata(user.app_metadata)
      },
      identity: {
        activeOrganizationId,
        memberships: memberships ?? [],
        permissions
      }
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
