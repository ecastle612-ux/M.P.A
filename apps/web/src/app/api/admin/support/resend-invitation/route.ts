import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../../lib/commercial/server";
import { writeSupportAudit } from "../../../../../lib/admin/impersonation-service";
import { serverEnv } from "../../../../../lib/env/server-env";

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
  const { data: invitation, error } = await client
    .from("organization_invitations")
    .select("id, email, organization_id, status, token")
    .eq("id", body.invitationId)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }
  if (invitation.status !== "pending") {
    return NextResponse.json({ error: "Only pending invitations can be resent" }, { status: 400 });
  }

  // Use generated invitation columns (email_status / email_sent_at) — not inventing schema.
  await client
    .from("organization_invitations")
    .update({
      email_status: "pending",
      email_sent_at: null,
      email_error: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", invitation.id);

  await writeSupportAudit({
    operatorUserId: user.id,
    organizationId: invitation.organization_id as string,
    action: "invitation.resend",
    entityType: "organization_invitations",
    entityId: invitation.id as string,
    payload: { email: invitation.email }
  });

  return NextResponse.json({
    ok: true,
    notice: `Resend queued for ${invitation.email}. Delivery uses the existing invitation engine.`
  });
}
