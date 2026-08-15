import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../../lib/commercial/server";
import { writeSupportAudit } from "../../../../../lib/admin/impersonation-service";
import { serverEnv } from "../../../../../lib/env/server-env";
import {
  InvitationCreateError,
  invitationNoticeCopy,
  resendInvitationEmail
} from "../../../../../lib/team/invitation-service";

async function tryServiceRole() {
  try {
    if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) return null;
    const { createServiceRoleClient } = await import("../../../../../lib/supabase/service-role");
    return createServiceRoleClient();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user || !(await isPlatformOperatorUser(user))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    invitationId?: string;
    organizationId?: string;
  } | null;
  if (!body?.invitationId) {
    return NextResponse.json({ error: "invitationId required" }, { status: 400 });
  }

  const service = await tryServiceRole();
  const client = service ?? supabase;

  try {
    const result = await resendInvitationEmail({
      supabase: client,
      invitationId: body.invitationId,
      actorId: user.id
    });

    await writeSupportAudit({
      operatorUserId: user.id,
      organizationId: result.organizationId,
      action: "invitation.resend",
      entityType: "organization_invitations",
      entityId: result.invitationId,
      payload: { email: result.email, deliveryStatus: result.deliveryStatus }
    });

    return NextResponse.json({
      ok: true,
      emailStatus: result.emailStatus,
      deliveryStatus: result.deliveryStatus,
      acceptUrl: result.acceptUrl,
      notice:
        result.emailStatus === "sent"
          ? `Invitation email sent to ${result.email}.`
          : result.emailStatus === "failed"
            ? `Invitation email failed for ${result.email}. Copy the accept link.`
            : invitationNoticeCopy("skipped")
    });
  } catch (error) {
    if (error instanceof InvitationCreateError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Resend failed" },
      { status: 400 }
    );
  }
}
