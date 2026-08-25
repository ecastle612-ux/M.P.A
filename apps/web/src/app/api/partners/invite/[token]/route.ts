import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { ACTIVE_ORGANIZATION_COOKIE } from "../../../../../lib/organization/contracts";
import {
  acceptPartnerInvitation,
  inspectPartnerInvitationToken,
  lookupInvitationByRawToken
} from "../../../../../lib/partners/invitation-service";
import { loadPartnerInvitationDeps } from "../../../../../lib/partners/invitation-runtime";
import { consumeRateLimit, requestActorKey } from "../../../../../lib/security/durable-rate-limit";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  if (!(await consumeRateLimit({ class: "PUBLIC", key: `partner-invite-inspect:${requestActorKey(request)}` }))) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  const { token } = await context.params;
  const deps = await loadPartnerInvitationDeps();
  const { invitation, partner } = await lookupInvitationByRawToken(token, deps.store);
  return NextResponse.json(inspectPartnerInvitationToken(token, invitation, partner));
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  if (!(await consumeRateLimit({ class: "AUTH", key: `partner-invite-accept:${requestActorKey(request)}` }))) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  const { token } = await context.params;
  const body = await request.json().catch(() => null);
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to accept this invitation.", code: "unauthenticated" }, { status: 401 });
  }
  const deps = await loadPartnerInvitationDeps();
  const result = await acceptPartnerInvitation(
    {
      token,
      userId: user.id,
      userEmail: user.email ?? null,
      clientPayload: body
    },
    deps
  );
  if (!result.ok) {
    const status =
      result.code === "unauthenticated"
        ? 401
        : result.code === "email_mismatch"
          ? 403
          : result.code === "expired"
            ? 410
            : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }
  const response = NextResponse.json({
    ok: true,
    nextPath: "/partner",
    alreadyAccepted: result.alreadyAccepted
  });
  response.cookies.set(ACTIVE_ORGANIZATION_COOKIE, result.organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
  return response;
}
