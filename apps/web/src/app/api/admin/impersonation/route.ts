import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../lib/commercial/server";
import {
  endImpersonationSession,
  startImpersonationSession
} from "../../../../lib/admin/impersonation-service";

export async function POST(request: Request) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user || !(await isPlatformOperatorUser(user))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    action?: "start" | "end";
    organizationId?: string;
    targetRole?: string;
    reason?: string;
  } | null;

  try {
    if (body?.action === "end") {
      await endImpersonationSession(user.id);
      return NextResponse.json({ ok: true, homeHref: "/admin" });
    }

    if (body?.action !== "start" || !body.organizationId || !body.targetRole) {
      return NextResponse.json(
        { error: "action=start requires organizationId and targetRole" },
        { status: 400 }
      );
    }

    const result = await startImpersonationSession({
      operatorUserId: user.id,
      organizationId: body.organizationId,
      targetRole: body.targetRole,
      ...(body.reason ? { reason: body.reason } : {}),
      mode: "read_only"
    });
    return NextResponse.json({
      ok: true,
      session: result.session,
      homeHref: result.homeHref
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Impersonation failed" },
      { status: 400 }
    );
  }
}
