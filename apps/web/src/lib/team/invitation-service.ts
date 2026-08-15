import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isMemberOperatingScope,
  isProductSku,
  primaryRole,
  resolvePostAuthHome,
  toRoleLabel,
  type MemberOperatingScope,
  type ProductSku,
  type UserRole,
  isUserRole
} from "@mpa/shared";
import { sendInvitationEmail } from "@mpa/email";
import { emitTeamEvent, writeTeamAudit } from "./events-audit";
import { recordOperatingScopeEvent } from "../organization/operating-scope-events";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

function appUrl() {
  return process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";
}

export async function resolveInvitationHomeHref(args: {
  supabase: Db;
  organizationId: string;
  roles: readonly UserRole[];
  storedScope?: MemberOperatingScope | null;
}): Promise<string> {
  const [{ data: subscription }, { data: setup }] = await Promise.all([
    args.supabase
      .from("organization_subscriptions")
      .select("sku_code, status")
      .eq("organization_id", args.organizationId)
      .maybeSingle(),
    args.supabase
      .from("organization_setup_state")
      .select("completed_at")
      .eq("organization_id", args.organizationId)
      .maybeSingle()
  ]);

  const sku: ProductSku | null =
    subscription && isProductSku(subscription.sku_code) && subscription.status !== "canceled"
      ? subscription.sku_code
      : null;

  return resolvePostAuthHome({
    roles: args.roles,
    productSku: sku,
    setupComplete: Boolean((setup as { completed_at?: string | null } | null)?.completed_at),
    storedScope: args.storedScope ?? null
  });
}

export function buildAcceptUrl(token: string): string {
  return `${appUrl().replace(/\/$/, "")}/accept-invitation/${token}`;
}

export async function createAndSendInvitation(args: {
  supabase: Db;
  organizationId: string;
  actorId: string;
  email: string;
  roles: UserRole[];
  organizationName: string;
  inviterLabel?: string | undefined;
  operatingScope?: MemberOperatingScope | null;
}) {
  const { data: invitation, error } = await args.supabase
    .from("organization_invitations")
    .insert({
      organization_id: args.organizationId,
      email: args.email,
      roles: args.roles,
      invited_by: args.actorId,
      email_status: "pending",
      operating_scope: args.operatingScope ?? null
    })
    .select(
      "id, email, roles, status, token, expires_at, email_status, email_sent_at, email_provider_id, email_error, operating_scope"
    )
    .single();

  if (error || !invitation) {
    throw new Error(error?.message ?? "Invitation create failed");
  }

  if (args.operatingScope) {
    await recordOperatingScopeEvent({
      supabase: args.supabase,
      organizationId: args.organizationId,
      actorId: args.actorId,
      invitationId: invitation.id as string,
      toScope: args.operatingScope,
      reason: "invitation.created"
    });
  }

  const acceptUrl = buildAcceptUrl(invitation.token as string);
  const role = primaryRole((invitation.roles as string[]).filter(isUserRole)) ?? "property_manager";
  const roleLabel = toRoleLabel(role);

  const createdPayload = {
    email: invitation.email,
    roles: invitation.roles,
    acceptUrl
  };

  await emitTeamEvent({
    supabase: args.supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    eventType: "invitation.created",
    aggregateType: "organization_invitations",
    aggregateId: invitation.id,
    payload: createdPayload
  });
  await writeTeamAudit({
    supabase: args.supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    action: "invitation.created",
    entityType: "organization_invitations",
    entityId: invitation.id,
    payload: createdPayload
  });

  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["RESEND_FROM_EMAIL"] ?? "M.P.A. <onboarding@resend.dev>";

  let emailStatus: "sent" | "failed" | "skipped" = "skipped";
  let emailProviderId: string | null = null;
  let emailError: string | null = null;
  let emailSentAt: string | null = null;

  if (apiKey) {
    const sendResult = await sendInvitationEmail({
      apiKey,
      from,
      to: args.email,
      organizationName: args.organizationName,
      roleLabel,
      acceptUrl,
      ...(args.inviterLabel ? { inviterLabel: args.inviterLabel } : {})
    });
    if (sendResult.ok) {
      emailStatus = "sent";
      emailProviderId = sendResult.providerId;
      emailSentAt = new Date().toISOString();
    } else {
      emailStatus = "failed";
      emailError = sendResult.error;
    }
  } else {
    emailStatus = "skipped";
    emailError = "RESEND_API_KEY not configured — accept link available in app";
  }

  const { data: updated, error: updateError } = await args.supabase
    .from("organization_invitations")
    .update({
      email_status: emailStatus,
      email_provider_id: emailProviderId,
      email_error: emailError,
      email_sent_at: emailSentAt
    })
    .eq("id", invitation.id)
    .select(
      "id, email, roles, status, token, expires_at, email_status, email_sent_at, email_provider_id, email_error, operating_scope"
    )
    .single();

  if (updateError || !updated) {
    throw new Error(updateError?.message ?? "Failed to update invitation email status");
  }

  if (emailStatus === "sent") {
    await emitTeamEvent({
      supabase: args.supabase,
      organizationId: args.organizationId,
      actorId: args.actorId,
      eventType: "invitation.sent",
      aggregateType: "organization_invitations",
      aggregateId: invitation.id,
      payload: { email: invitation.email, providerId: emailProviderId }
    });
    await writeTeamAudit({
      supabase: args.supabase,
      organizationId: args.organizationId,
      actorId: args.actorId,
      action: "invitation.sent",
      entityType: "organization_invitations",
      entityId: invitation.id,
      payload: { email: invitation.email, providerId: emailProviderId }
    });
  }

  return {
    invitation: updated,
    acceptUrl,
    roleLabel,
    homeHref: await resolveInvitationHomeHref({
      supabase: args.supabase,
      organizationId: args.organizationId,
      roles: (invitation.roles as string[]).filter(isUserRole),
      storedScope: isMemberOperatingScope(invitation.operating_scope) ? invitation.operating_scope : null
    }),
    emailStatus
  };
}

export async function acceptInvitation(args: {
  supabase: Db;
  token: string;
  userId: string;
  userEmail: string;
}) {
  const { data: invitation, error: invitationError } = await args.supabase
    .from("organization_invitations")
    .select("id, organization_id, email, roles, status, expires_at, operating_scope")
    .eq("token", args.token)
    .eq("status", "pending")
    .maybeSingle();

  if (invitationError) {
    throw new Error(invitationError.message);
  }
  if (!invitation) {
    throw new Error("Invitation not found");
  }
  if (invitation.email.toLowerCase() !== args.userEmail.toLowerCase()) {
    throw new Error("Sign in with the invited email address to accept.");
  }
  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    throw new Error("Invitation expired");
  }

  const roles = (invitation.roles as string[]).filter(isUserRole);
  const operatingScope = isMemberOperatingScope(invitation.operating_scope) ? invitation.operating_scope : null;
  const { error: membershipError } = await args.supabase.from("organization_memberships").upsert(
    {
      organization_id: invitation.organization_id,
      user_id: args.userId,
      roles,
      status: "active",
      invited_by: null,
      operating_scope: operatingScope
    },
    { onConflict: "organization_id,user_id" }
  );
  if (membershipError) {
    throw new Error(membershipError.message);
  }

  if (operatingScope) {
    const { data: membership } = await args.supabase
      .from("organization_memberships")
      .select("id")
      .eq("organization_id", invitation.organization_id)
      .eq("user_id", args.userId)
      .maybeSingle();
    try {
      await recordOperatingScopeEvent({
        supabase: args.supabase,
        organizationId: invitation.organization_id as string,
        actorId: args.userId,
        membershipId: membership?.id ?? null,
        invitationId: invitation.id as string,
        toScope: operatingScope,
        reason: "invitation.accepted"
      });
    } catch {
      // Accept must not fail if the invitee cannot write the audit row.
    }
  }

  const { error: invitationUpdateError } = await args.supabase
    .from("organization_invitations")
    .update({
      status: "accepted",
      accepted_by: args.userId,
      accepted_at: new Date().toISOString()
    })
    .eq("id", invitation.id);
  if (invitationUpdateError) {
    throw new Error(invitationUpdateError.message);
  }

  const role = primaryRole(roles);
  const payload = {
    email: invitation.email,
    roles,
    organizationId: invitation.organization_id
  };

  await emitTeamEvent({
    supabase: args.supabase,
    organizationId: invitation.organization_id,
    actorId: args.userId,
    eventType: "invitation.accepted",
    aggregateType: "organization_invitations",
    aggregateId: invitation.id,
    payload
  });
  await writeTeamAudit({
    supabase: args.supabase,
    organizationId: invitation.organization_id,
    actorId: args.userId,
    action: "invitation.accepted",
    entityType: "organization_invitations",
    entityId: invitation.id,
    payload
  });

  return {
    organizationId: invitation.organization_id as string,
    roles,
    homeHref: await resolveInvitationHomeHref({
      supabase: args.supabase,
      organizationId: invitation.organization_id as string,
      roles,
      storedScope: operatingScope
    }),
    roleLabel: role ? toRoleLabel(role) : "Member"
  };
}

export async function getTeamReadiness(supabase: Db, organizationId: string) {
  const [{ data: memberships }, { data: acceptedInvites }, { data: pendingInvites }] =
    await Promise.all([
      supabase
        .from("organization_memberships")
        .select("id, user_id, roles, status, operating_scope")
        .eq("organization_id", organizationId)
        .eq("status", "active"),
      supabase
        .from("organization_invitations")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("status", "accepted"),
      supabase
        .from("organization_invitations")
        .select("id, email, roles, status, token, email_status, expires_at, created_at, operating_scope")
        .eq("organization_id", organizationId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
    ]);

  const activeMemberCount = memberships?.length ?? 0;
  const acceptedInviteCount = acceptedInvites?.length ?? 0;
  const teamReady = activeMemberCount > 1 || acceptedInviteCount > 0;

  return {
    teamReady,
    activeMemberCount,
    acceptedInviteCount,
    pendingInviteCount: pendingInvites?.length ?? 0,
    memberships: memberships ?? [],
    pendingInvitations: pendingInvites ?? []
  };
}
