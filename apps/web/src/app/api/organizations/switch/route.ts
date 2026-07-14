import { NextResponse } from "next/server";
import {
  ACTIVE_ORGANIZATION_COOKIE,
  parseSwitchOrganizationInput
} from "../../../../lib/organization/contracts";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../../lib/auth/authorization";

export async function POST(request: Request) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = parseSwitchOrganizationInput(payload);

  if (!parsed) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const authorizationContext = await resolveAuthorizationContext(user, parsed.organizationId);
  if (!evaluatePermission(authorizationContext, "organization:switch")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true, organizationId: parsed.organizationId });
  response.cookies.set(ACTIVE_ORGANIZATION_COOKIE, parsed.organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
  return response;
}
