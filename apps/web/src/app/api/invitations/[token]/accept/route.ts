import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { ACTIVE_ORGANIZATION_COOKIE } from "../../../../../lib/organization/contracts";
import { acceptInvitation } from "../../../../../lib/team/invitation-service";

export async function POST(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const supabase = await createAuthServerClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  try {
    const result = await acceptInvitation({
      supabase,
      token,
      userId: user.id,
      userEmail: user.email
    });

    const response = NextResponse.json({
      ok: true,
      organizationId: result.organizationId,
      roles: result.roles,
      homeHref: result.homeHref,
      roleLabel: result.roleLabel
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
    const message = error instanceof Error ? error.message : "Could not accept invitation";
    const status =
      message.includes("not found")
        ? 404
        : message.includes("expired")
          ? 410
          : message.includes("invited email")
            ? 403
            : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
