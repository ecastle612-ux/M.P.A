import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isMemberOperatingScope,
  isProductSku,
  isUserRole,
  primaryRole,
  resolvePostAuthHome,
  toRoleLabel,
  wouldLeaveCompleteWithoutBothAdmin,
  type MemberOperatingScope,
  type ProductSku,
  type UserRole
} from "@mpa/shared";
import { sendInvitationEmail } from "@mpa/email";
import { emitTeamEvent, writeTeamAudit } from "./events-audit";
import { recordOperatingScopeEvent } from "../organization/operating-scope-events";
import { acceptTenantBinding } from "../tenant-lifecycle/accept-tenant-binding";
import { TenantLifecycleError } from "../tenant-lifecycle/occupancy-core";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export type InvitationDeliveryStatus = "pending" | "sent" | "failed";
export type InvitationEmailNotice = "sent" | "failed" | "skipped";

export const INVITATION_ROW_COLUMNS =
  "id, email, roles, status, token, expires_at, created_at, delivery_status, last_delivered_at, operating_scope, accepted_by, accepted_at, organization_id, invited_by";

function appUrl() {
  return process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";
}

export class InvitationCreateError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "InvitationCreateError";
  }
}

export class InvitationAcceptanceError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "InvitationAcceptanceError";
  }
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

export function invitationEmailNotice(
  deliveryStatus: InvitationDeliveryStatus | null | undefined,
  skipped: boolean
): InvitationEmailNotice {
  if (skipped) {
    return "skipped";
  }
  if (deliveryStatus === "sent") {
    return "sent";
  }
  if (deliveryStatus === "failed") {
    return "failed";
  }
  return "skipped";
}

export function invitationNoticeCopy(notice: InvitationEmailNotice): string {
  if (notice === "sent") {
    return "Invitation email sent.";
  }
  if (notice === "failed") {
    return "Invitation created but email failed — copy the accept link.";
  }
  return "Invitation created. Copy the accept link (email provider not configured).";
}

function isPendingEmailConflict(error: { code?: string; message?: string } | null): boolean {
  if (!error) {
    return false;
  }
  return (
    error.code === "23505" ||
    (error.message ?? "").includes("organization_invitations_pending_email_org_uidx")
  );
}

function sameRoles(left: readonly string[], right: readonly string[]): boolean {
  const a = [...left].sort();
  const b = [...right].sort();
  return a.length === b.length && a.every((role, index) => role === b[index]);
}

function sameScope(
  left: MemberOperatingScope | null,
  right: MemberOperatingScope | null
): boolean {
  return left === right;
}

export async function resolveOrganizationSku(supabase: Db, organizationId: string): Promise<ProductSku | null> {
  const { data: subscription } = await supabase
    .from("organization_subscriptions")
    .select("sku_code, status")
    .eq("organization_id", organizationId)
    .maybeSingle();
  return subscription && isProductSku(subscription.sku_code) && subscription.status !== "canceled"
    ? subscription.sku_code
    : null;
}

export type SendInvitationEmailFn = typeof sendInvitationEmail;

export async function deliverInvitationEmail(args: {
  supabase: Db;
  invitation: {
    id: string;
    email: string;
    roles: string[];
    token: string;
    organization_id?: string;
  };
  organizationName: string;
  inviterLabel?: string | undefined;
  actorId?: string | null;
  sendEmail?: SendInvitationEmailFn;
}): Promise<{
  deliveryStatus: InvitationDeliveryStatus;
  emailNotice: InvitationEmailNotice;
  lastDeliveredAt: string | null;
  providerId: string | null;
  error: string | null;
}> {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["RESEND_FROM_EMAIL"] ?? "M.P.A. <onboarding@resend.dev>";
  const acceptUrl = buildAcceptUrl(args.invitation.token);
  const role = primaryRole((args.invitation.roles as string[]).filter(isUserRole)) ?? "property_manager";
  const roleLabel = toRoleLabel(role);
  const sendEmail = args.sendEmail ?? sendInvitationEmail;

  let deliveryStatus: InvitationDeliveryStatus = "pending";
  let emailNotice: InvitationEmailNotice = "skipped";
  let providerId: string | null = null;
  let emailError: string | null = null;
  let lastDeliveredAt: string | null = null;

  if (apiKey) {
    const sendResult = await sendEmail({
      apiKey,
      from,
      to: args.invitation.email,
      organizationName: args.organizationName,
      roleLabel,
      acceptUrl,
      ...(args.inviterLabel ? { inviterLabel: args.inviterLabel } : {})
    });
    if (sendResult.ok) {
      deliveryStatus = "sent";
      emailNotice = "sent";
      providerId = sendResult.providerId;
      lastDeliveredAt = new Date().toISOString();
    } else {
      deliveryStatus = "failed";
      emailNotice = "failed";
      emailError = sendResult.error;
    }
  } else {
    deliveryStatus = "pending";
    emailNotice = "skipped";
    emailError = "RESEND_API_KEY not configured — accept link available in app";
  }

  const { error: updateError } = await args.supabase
    .from("organization_invitations")
    .update({
      delivery_status: deliveryStatus,
      last_delivered_at: lastDeliveredAt
    })
    .eq("id", args.invitation.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (emailNotice === "sent" && args.invitation.organization_id) {
    await emitTeamEvent({
      supabase: args.supabase,
      organizationId: args.invitation.organization_id,
      actorId: args.actorId ?? null,
      eventType: "invitation.sent",
      aggregateType: "organization_invitations",
      aggregateId: args.invitation.id,
      payload: { email: args.invitation.email, providerId }
    });
    await writeTeamAudit({
      supabase: args.supabase,
      organizationId: args.invitation.organization_id,
      actorId: args.actorId ?? null,
      action: "invitation.sent",
      entityType: "organization_invitations",
      entityId: args.invitation.id,
      payload: { email: args.invitation.email, providerId, error: emailError }
    });
  }

  return { deliveryStatus, emailNotice, lastDeliveredAt, providerId, error: emailError };
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
  sendEmail?: SendInvitationEmailFn;
}) {
  const { data: invitation, error } = await args.supabase
    .from("organization_invitations")
    .insert({
      organization_id: args.organizationId,
      email: args.email,
      roles: args.roles,
      invited_by: args.actorId,
      delivery_status: "pending",
      operating_scope: args.operatingScope ?? null
    })
    .select(INVITATION_ROW_COLUMNS)
    .single();

  if (error || !invitation) {
    if (isPendingEmailConflict(error)) {
      throw new InvitationCreateError(
        "A pending invitation already exists for this email. Resend or copy the accept link.",
        409
      );
    }
    throw new InvitationCreateError(error?.message ?? "Invitation create failed", 400);
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

  const delivery = await deliverInvitationEmail({
    supabase: args.supabase,
    invitation: {
      id: invitation.id as string,
      email: invitation.email as string,
      roles: invitation.roles as string[],
      token: invitation.token as string,
      organization_id: args.organizationId
    },
    organizationName: args.organizationName,
    actorId: args.actorId,
    ...(args.inviterLabel ? { inviterLabel: args.inviterLabel } : {}),
    ...(args.sendEmail ? { sendEmail: args.sendEmail } : {})
  });

  const { data: updated, error: reloadError } = await args.supabase
    .from("organization_invitations")
    .select(INVITATION_ROW_COLUMNS)
    .eq("id", invitation.id)
    .single();

  if (reloadError || !updated) {
    throw new InvitationCreateError(reloadError?.message ?? "Failed to load invitation after send", 400);
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
    emailStatus: delivery.emailNotice,
    deliveryStatus: delivery.deliveryStatus
  };
}

export async function resendInvitationEmail(args: {
  supabase: Db;
  invitationId: string;
  actorId: string | null;
  sendEmail?: SendInvitationEmailFn;
}) {
  const { data: invitation, error } = await args.supabase
    .from("organization_invitations")
    .select(INVITATION_ROW_COLUMNS)
    .eq("id", args.invitationId)
    .maybeSingle();

  if (error) {
    throw new InvitationCreateError(error.message, 400);
  }
  if (!invitation) {
    throw new InvitationCreateError("Invitation not found", 404);
  }
  if (invitation.status !== "pending") {
    throw new InvitationCreateError("Only pending invitations can be resent", 400);
  }

  const { data: organization } = await args.supabase
    .from("organizations")
    .select("name")
    .eq("id", invitation.organization_id)
    .maybeSingle();

  const delivery = await deliverInvitationEmail({
    supabase: args.supabase,
    invitation: {
      id: invitation.id as string,
      email: invitation.email as string,
      roles: invitation.roles as string[],
      token: invitation.token as string,
      organization_id: invitation.organization_id as string
    },
    organizationName: (organization?.name as string | undefined) ?? "your organization",
    actorId: args.actorId,
    ...(args.sendEmail ? { sendEmail: args.sendEmail } : {})
  });

  return {
    invitationId: invitation.id as string,
    organizationId: invitation.organization_id as string,
    email: invitation.email as string,
    emailStatus: delivery.emailNotice,
    deliveryStatus: delivery.deliveryStatus,
    acceptUrl: buildAcceptUrl(invitation.token as string)
  };
}

type MembershipRow = {
  id: string;
  user_id: string;
  roles: string[];
  status: string;
  operating_scope: string | null;
};

async function loadMemberships(supabase: Db, organizationId: string): Promise<MembershipRow[]> {
  const { data, error } = await supabase
    .from("organization_memberships")
    .select("id, user_id, roles, status, operating_scope")
    .eq("organization_id", organizationId);
  if (error) {
    throw new InvitationAcceptanceError(error.message, 400);
  }
  return (data ?? []) as MembershipRow[];
}

function lastBothWouldBreak(args: {
  sku: ProductSku | null;
  memberships: MembershipRow[];
  targetMembershipId: string;
  nextRoles: readonly string[];
  nextScope: MemberOperatingScope | null;
  nextStatus?: "active" | "inactive";
}): boolean {
  return wouldLeaveCompleteWithoutBothAdmin({
    sku: args.sku,
    admins: args.memberships.map((row) => ({
      id: row.id,
      roles: row.roles,
      storedScope: isMemberOperatingScope(row.operating_scope) ? row.operating_scope : null,
      status: row.status
    })),
    targetMembershipId: args.targetMembershipId,
    nextScope: args.nextScope,
    nextStatus: args.nextStatus ?? "active",
    nextRoles: args.nextRoles
  });
}

async function recordAcceptedScopeEvent(args: {
  supabase: Db;
  organizationId: string;
  actorId: string;
  membershipId: string | null;
  invitationId: string;
  toScope: MemberOperatingScope | null;
}): Promise<boolean> {
  const { data: existing } = await args.supabase
    .from("organization_operating_scope_events")
    .select("id")
    .eq("invitation_id", args.invitationId)
    .eq("reason", "invitation.accepted")
    .maybeSingle();
  if (existing) {
    return false;
  }
  if (!args.toScope) {
    return false;
  }
  await recordOperatingScopeEvent({
    supabase: args.supabase,
    organizationId: args.organizationId,
    actorId: args.actorId,
    membershipId: args.membershipId,
    invitationId: args.invitationId,
    toScope: args.toScope,
    reason: "invitation.accepted"
  });
  return true;
}

async function finishAcceptedInvitation(args: {
  supabase: Db;
  invitation: {
    id: string;
    organization_id: string;
    email: string;
    roles: string[];
    operating_scope: string | null;
  };
  userId: string;
  roles: UserRole[];
  operatingScope: MemberOperatingScope | null;
  recordEvents: boolean;
}) {
  if (args.recordEvents) {
    const payload = {
      email: args.invitation.email,
      roles: args.roles,
      organizationId: args.invitation.organization_id
    };
    await emitTeamEvent({
      supabase: args.supabase,
      organizationId: args.invitation.organization_id,
      actorId: args.userId,
      eventType: "invitation.accepted",
      aggregateType: "organization_invitations",
      aggregateId: args.invitation.id,
      payload
    });
    await writeTeamAudit({
      supabase: args.supabase,
      organizationId: args.invitation.organization_id,
      actorId: args.userId,
      action: "invitation.accepted",
      entityType: "organization_invitations",
      entityId: args.invitation.id,
      payload
    });
  }

  const role = primaryRole(args.roles);
  return {
    organizationId: args.invitation.organization_id,
    roles: args.roles,
    operatingScope: args.operatingScope,
    homeHref: await resolveInvitationHomeHref({
      supabase: args.supabase,
      organizationId: args.invitation.organization_id,
      roles: args.roles,
      storedScope: args.operatingScope
    }),
    roleLabel: role ? toRoleLabel(role) : "Member",
    idempotent: !args.recordEvents
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
    .select(INVITATION_ROW_COLUMNS)
    .eq("token", args.token)
    .maybeSingle();

  if (invitationError) {
    throw new InvitationAcceptanceError(invitationError.message, 400);
  }
  if (!invitation) {
    throw new InvitationAcceptanceError("Invitation not found", 404);
  }

  const roles = (invitation.roles as string[]).filter(isUserRole);
  const operatingScope = isMemberOperatingScope(invitation.operating_scope)
    ? invitation.operating_scope
    : null;
  const organizationId = invitation.organization_id as string;

  if (invitation.status === "revoked") {
    throw new InvitationAcceptanceError("Invitation revoked", 409);
  }
  if (invitation.status === "expired" || new Date(invitation.expires_at as string).getTime() < Date.now()) {
    throw new InvitationAcceptanceError("Invitation expired", 410);
  }

  if (invitation.status === "accepted") {
    if ((invitation.accepted_by as string | null) !== args.userId) {
      throw new InvitationAcceptanceError("Invitation already accepted", 409);
    }
    return finishAcceptedInvitation({
      supabase: args.supabase,
      invitation: {
        id: invitation.id as string,
        organization_id: organizationId,
        email: invitation.email as string,
        roles: invitation.roles as string[],
        operating_scope: invitation.operating_scope as string | null
      },
      userId: args.userId,
      roles,
      operatingScope,
      recordEvents: false
    });
  }

  if ((invitation.email as string).toLowerCase() !== args.userEmail.toLowerCase()) {
    throw new InvitationAcceptanceError("Sign in with the invited email address to accept.", 403);
  }

  const tenantOnly = roles.length === 1 && roles[0] === "tenant";
  if (roles.includes("tenant") && !tenantOnly) {
    throw new InvitationAcceptanceError("Tenant invitations cannot grant staff roles.", 403);
  }
  if (tenantOnly) {
    try {
      await acceptTenantBinding({
        supabase: args.supabase,
        userId: args.userId,
        userEmail: args.userEmail,
        organizationId,
        invitationId: invitation.id as string,
        invitationEmail: invitation.email as string,
        browserOverrides: null
      });
    } catch (error) {
      if (error instanceof TenantLifecycleError) {
        throw new InvitationAcceptanceError(error.message, error.status);
      }
      throw error;
    }
  }

  const sku = await resolveOrganizationSku(args.supabase, organizationId);
  const memberships = await loadMemberships(args.supabase, organizationId);
  const existing = memberships.find((row) => row.user_id === args.userId) ?? null;
  const existingScope = existing && isMemberOperatingScope(existing.operating_scope)
    ? existing.operating_scope
    : null;
  const sameGrant = Boolean(
    existing && sameRoles(existing.roles, roles) && sameScope(existingScope, operatingScope)
  );

  if (existing && !sameGrant) {
    if (
      lastBothWouldBreak({
        sku,
        memberships,
        targetMembershipId: existing.id,
        nextRoles: roles,
        nextScope: operatingScope,
        nextStatus: "active"
      })
    ) {
      throw new InvitationAcceptanceError(
        "Complete must keep at least one Organization Admin with Both operational responsibility.",
        409
      );
    }
  }

  let membershipId = existing?.id ?? null;
  if (!existing) {
    const { data: inserted, error: insertError } = await args.supabase
      .from("organization_memberships")
      .insert({
        organization_id: organizationId,
        user_id: args.userId,
        roles,
        status: "active",
        invited_by: invitation.invited_by ?? null,
        operating_scope: operatingScope
      })
      .select("id")
      .single();
    if (insertError || !inserted) {
      if (insertError && (insertError.code === "23505" || (insertError.message ?? "").includes("organization_id_user_id"))) {
        const { data: raced } = await args.supabase
          .from("organization_memberships")
          .select("id")
          .eq("organization_id", organizationId)
          .eq("user_id", args.userId)
          .maybeSingle();
        membershipId = (raced?.id as string | undefined) ?? null;
      } else {
        throw new InvitationAcceptanceError(insertError?.message ?? "Could not create membership", 400);
      }
    } else {
      membershipId = inserted.id as string;
    }
  } else if (!sameGrant || existing.status !== "active") {
    const { error: updateError } = await args.supabase
      .from("organization_memberships")
      .update({
        roles,
        status: "active",
        operating_scope: operatingScope
      })
      .eq("id", existing.id);
    if (updateError) {
      throw new InvitationAcceptanceError(updateError.message, 400);
    }
  }

  const acceptedAt = new Date().toISOString();
  const { data: accepted, error: acceptError } = await args.supabase
    .from("organization_invitations")
    .update({
      status: "accepted",
      accepted_by: args.userId,
      accepted_at: acceptedAt
    })
    .eq("id", invitation.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (acceptError) {
    throw new InvitationAcceptanceError(acceptError.message, 400);
  }

  if (!accepted) {
    return finishAcceptedInvitation({
      supabase: args.supabase,
      invitation: {
        id: invitation.id as string,
        organization_id: organizationId,
        email: invitation.email as string,
        roles: invitation.roles as string[],
        operating_scope: invitation.operating_scope as string | null
      },
      userId: args.userId,
      roles,
      operatingScope,
      recordEvents: false
    });
  }

  await recordAcceptedScopeEvent({
    supabase: args.supabase,
    organizationId,
    actorId: args.userId,
    membershipId,
    invitationId: invitation.id as string,
    toScope: operatingScope
  });

  return finishAcceptedInvitation({
    supabase: args.supabase,
    invitation: {
      id: invitation.id as string,
      organization_id: organizationId,
      email: invitation.email as string,
      roles: invitation.roles as string[],
      operating_scope: invitation.operating_scope as string | null
    },
    userId: args.userId,
    roles,
    operatingScope,
    recordEvents: true
  });
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
        .select(INVITATION_ROW_COLUMNS)
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
