import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../../lib/commercial/server";
import { writeSupportAudit } from "../../../../../lib/admin/impersonation-service";
import { regenerateClaimLinkForSession } from "../../../../../lib/saas-provisioning/run-provisioning";

export async function POST(request: Request) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user || !(await isPlatformOperatorUser(user))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    sessionId?: string;
    organizationId?: string;
  } | null;
  if (!body?.sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const result = await regenerateClaimLinkForSession(body.sessionId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await writeSupportAudit({
    operatorUserId: user.id,
    organizationId: body.organizationId ?? result.job.organizationId,
    action: "claim_link.regenerated",
    entityType: "provisioning_jobs",
    entityId: body.sessionId,
    payload: {
      ownerEmail: result.job.ownerEmail,
      checkpoint: result.job.checkpoint
    }
  });

  return NextResponse.json({
    ok: true,
    notice:
      result.notice ??
      (result.emailDelivered
        ? `Claim link regenerated and emailed to ${result.job.ownerEmail}.`
        : `Claim link regenerated. Email was not delivered — configure Resend before notifying ${result.job.ownerEmail}.`),
    continueUrl: result.continueUrl,
    emailDelivered: result.emailDelivered
  });
}
