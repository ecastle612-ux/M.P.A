import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { ACTIVE_ORGANIZATION_COOKIE } from "../../../../../lib/organization/contracts";
import {
  acceptInvitation,
  InvitationAcceptanceError
} from "../../../../../lib/team/invitation-service";
import { serverEnv } from "../../../../../lib/env/server-env";

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const supabase = await createAuthServerClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // Body is ignored. Role and operating_scope come only from the persisted invitation.
  await request.json().catch(() => null);

  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Invitation acceptance is not configured." }, { status: 500 });
  }

  const { createServiceRoleClient } = await import("../../../../../lib/supabase/service-role");
  const service = createServiceRoleClient();

  try {
    const result = await acceptInvitation({
      supabase: service,
      token,
      userId: user.id,
      userEmail: user.email
    });

    const response = NextResponse.json({
      ok: true,
      organizationId: result.organizationId,
      roles: result.roles,
      operatingScope: result.operatingScope,
      homeHref: result.homeHref,
      roleLabel: result.roleLabel,
      idempotent: result.idempotent
    });

    response.cookies.set(ACTIVE_ORGANIZATION_COOKIE, result.organizationId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env["NODE_ENV"] === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch (error) {
    if (error instanceof InvitationAcceptanceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Could not accept invitation";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
