import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { isPlatformOperatorUser } from "../../../../../lib/commercial/server";

type InvitationRow = {
  id: string;
  email: string;
  roles: string[];
  status: string;
  delivery_status: string | null;
  last_delivered_at: string | null;
  accepted_at: string | null;
  created_at: string;
};

type MembershipRow = {
  id: string;
  user_id: string;
  roles: string[];
  status: string;
};

type EventRow = {
  id: string;
  event_type: string;
  created_at: string;
};

type AuditRow = {
  id: string;
  action: string;
  created_at: string;
};

export async function GET(request: Request) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!(await isPlatformOperatorUser(user))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const organizationId = new URL(request.url).searchParams.get("organizationId");
  if (!organizationId) {
    return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
  }

  const [{ data: invitationsData }, { data: membershipsData }, { data: eventsData }, { data: auditsData }] =
    await Promise.all([
      supabase
        .from("organization_invitations")
        .select("id, email, roles, status, delivery_status, last_delivered_at, accepted_at, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),
      supabase
        .from("organization_memberships")
        .select("id, user_id, roles, status")
        .eq("organization_id", organizationId)
        .eq("status", "active"),
      supabase
        .from("event_domain_events")
        .select("id, event_type, created_at")
        .eq("organization_id", organizationId)
        .in("event_type", ["invitation.created", "invitation.sent", "invitation.accepted"])
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("audit_events")
        .select("id, action, created_at")
        .eq("organization_id", organizationId)
        .in("action", ["invitation.created", "invitation.sent", "invitation.accepted"])
        .order("created_at", { ascending: false })
        .limit(30)
    ]);

  const invitations = (invitationsData ?? []) as InvitationRow[];
  const memberships = (membershipsData ?? []) as MembershipRow[];
  const events = (eventsData ?? []) as EventRow[];
  const audits = (auditsData ?? []) as AuditRow[];

  const accepted = invitations.some((row) => row.status === "accepted");
  const teamReady = memberships.length > 1 || accepted;

  return NextResponse.json({
    organizationId,
    invitations,
    memberships,
    timelineEvents: events,
    auditEvents: audits,
    checks: {
      invitationCreated: invitations.length > 0,
      invitationSent: invitations.some((row) => row.delivery_status === "sent"),
      invitationEmailDelivered: invitations.some((row) => row.delivery_status === "sent"),
      invitationAccepted: accepted,
      roleAssigned: memberships.some((row) => (row.roles?.length ?? 0) > 0),
      workspaceAssignable: true,
      timelineEvent: events.some((event) => event.event_type === "invitation.accepted" || event.event_type === "invitation.created"),
      auditEvent: audits.length > 0,
      teamReady,
      assistantNextIsAddResident: teamReady
    },
    assistantRecommendation: teamReady ? "Add your first resident." : "Invite your team.",
    emailNote:
      "invitationEmailDelivered means the email provider accepted the send, not inbox confirmation. Local/dev without RESEND_API_KEY stays pending and uses the accept link."
  });
}
