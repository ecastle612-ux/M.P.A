import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { extractRolesFromMetadata } from "@mpa/shared";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { resolveAuthorizationContext } from "../../../../lib/auth/authorization";
import { ACTIVE_ORGANIZATION_COOKIE } from "../../../../lib/organization/contracts";
import { rateLimitGuard } from "../../../../lib/security/api-guards";
import { getRequestId, captureException } from "../../../../lib/observability";

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request.headers);

  const limited = rateLimitGuard(request, "auth:session", { limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const supabase = await createAuthServerClient();
    const cookieStore = await cookies();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { authenticated: false },
        { headers: { "Cache-Control": "no-store", "x-request-id": requestId } }
      );
    }

    const activeOrganizationId = cookieStore.get(ACTIVE_ORGANIZATION_COOKIE)?.value ?? null;
    const { data: memberships } = await supabase
      .from("organization_memberships")
      .select("organization_id, roles, status")
      .eq("user_id", user.id)
      .eq("status", "active");
    const authorizationContext = await resolveAuthorizationContext(user, activeOrganizationId);

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
          permissions: authorizationContext.permissions
        }
      },
      { headers: { "Cache-Control": "no-store", "x-request-id": requestId } }
    );
  } catch (error) {
    captureException(error, { module: "api.auth.session", requestId });
    return NextResponse.json(
      { authenticated: false },
      { status: 500, headers: { "Cache-Control": "no-store", "x-request-id": requestId } }
    );
  }
}
