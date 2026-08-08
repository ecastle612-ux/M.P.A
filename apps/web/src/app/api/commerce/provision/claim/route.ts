import { NextResponse } from "next/server";
import { COM_002_FLAGS } from "@mpa/shared";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { ACTIVE_ORGANIZATION_COOKIE } from "../../../../../lib/organization/contracts";
import { claimProvisioningOwner } from "../../../../../lib/saas-provisioning/run-provisioning";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!COM_002_FLAGS.sliceD_automaticProvisioning) {
    return NextResponse.json({ error: "slice_disabled" }, { status: 404 });
  }
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    sessionId?: string;
    bindToken?: string;
  };
  if (!body.sessionId) {
    return NextResponse.json({ error: "missing_session_id" }, { status: 400 });
  }

  const result = await claimProvisioningOwner({
    checkoutSessionId: body.sessionId,
    userId: user.id,
    userEmail: user.email,
    ...(body.bindToken ? { bindToken: body.bindToken } : {})
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  const response = NextResponse.json({
    ok: true,
    checkpoint: result.job.checkpoint,
    organizationId: result.job.organizationId,
    nextPath: "/setup"
  });
  if (result.job.organizationId) {
    response.cookies.set(ACTIVE_ORGANIZATION_COOKIE, result.job.organizationId, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      secure: process.env["NODE_ENV"] === "production",
      maxAge: 60 * 60 * 24 * 365
    });
  }
  return response;
}
