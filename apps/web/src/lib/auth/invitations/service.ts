/**
 * AUTH-001 Slice C — invitation create / deliver / accept / activate / resend / revoke.
 */
import { createServiceRoleServerClient } from "../server";
import { provisionInviteePrincipal } from "../identity";
import { deliverInvitationCredentials } from "../credentials/delivery";
import { emitOpsDomainEvent } from "../../ops/emit";
import { assertCanInviteSeat, throwIfDenied } from "../../saas/entitlement-gate";
import type { UserRole } from "@mpa/shared";
import {
  assertOrganizationPropertyIds,
  replaceMembershipPropertyScopes,
  requirePropertyIdsForScopedRoles,
  roleRequiresPropertyScope
} from "../roles/property-scope";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

function serviceClient(): AnyClient {
  const client = createServiceRoleServerClient();
  if (!client) throw new Error("Invitations require SUPABASE_SERVICE_ROLE_KEY");
  return client;
}

export type CreateInvitationInput = {
  organizationId: string;
  email: string;
  roles: UserRole[];
  invitedBy: string;
  propertyIds?: string[];
};

export type InvitationRecord = {
  id: string;
  organizationId: string;
  email: string;
  roles: string[];
  status: string;
  token: string;
  expiresAt: string;
  username: string | null;
  provisionedUserId: string | null;
  deliveryStatus: string | null;
  propertyIds: string[];
};

function mapInvitation(row: Record<string, unknown>): InvitationRecord {
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    email: String(row["email"]),
    roles: Array.isArray(row["roles"]) ? (row["roles"] as string[]) : [],
    status: String(row["status"]),
    token: String(row["token"]),
    expiresAt: String(row["expires_at"]),
    username: row["username"] != null ? String(row["username"]) : null,
    provisionedUserId: row["provisioned_user_id"] != null ? String(row["provisioned_user_id"]) : null,
    deliveryStatus: row["delivery_status"] != null ? String(row["delivery_status"]) : null,
    propertyIds: Array.isArray(row["property_ids"])
      ? (row["property_ids"] as unknown[]).filter((id): id is string => typeof id === "string")
      : []
  };
}

async function resolveScopedPropertyIds(input: {
  organizationId: string;
  roles: readonly string[];
  propertyIds?: string[];
}): Promise<string[]> {
  const required = requirePropertyIdsForScopedRoles({
    roles: input.roles,
    propertyIds: input.propertyIds
  });
  if (required.length === 0) return [];
  return assertOrganizationPropertyIds({
    organizationId: input.organizationId,
    propertyIds: required
  });
}

async function applyInvitationPropertyScopes(input: {
  organizationId: string;
  userId: string;
  roles: readonly string[];
  propertyIds: string[];
}): Promise<void> {
  if (!roleRequiresPropertyScope(input.roles) || input.propertyIds.length === 0) return;

  const { data: membership, error } = await serviceClient()
    .from("organization_memberships")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!membership?.id) return;

  await replaceMembershipPropertyScopes({
    organizationId: input.organizationId,
    membershipId: String(membership.id),
    propertyIds: input.propertyIds
  });
}

async function emitInviteEvent(
  admin: AnyClient,
  input: {
    organizationId: string;
    invitationId: string;
    eventType: "auth.user.invited" | "auth.user.invitation_accepted" | "auth.user.invitation_revoked";
    userId?: string | null;
  }
): Promise<void> {
  try {
    await emitOpsDomainEvent(
      admin,
      {
        eventType: input.eventType,
        organizationId: input.organizationId,
        subject: { type: "invitation", id: input.invitationId },
        actor: { actor_type: "system", label: "AUTH-001 invitations" },
        summary: input.eventType.replace("auth.user.", "").replace(/_/g, " "),
        payload: {
          invitationId: input.invitationId,
          userId: input.userId ?? null
        },
        visibility: "staff_only",
        sensitivity: "normal"
      },
      { dispatchNow: true }
    );
  } catch {
    // Best-effort.
  }
}

/**
 * Create invitee principal + pending invite + inactive membership + credential email.
 * Pending invite for same org+email is resent instead of duplicated.
 */
export async function createAndDeliverInvitation(
  input: CreateInvitationInput
): Promise<{ invitation: InvitationRecord; resent: boolean }> {
  const admin = serviceClient();
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) throw new Error("Valid contact email is required.");
  if (!input.roles.length) throw new Error("At least one role is required.");

  const propertyIds = await resolveScopedPropertyIds({
    organizationId: input.organizationId,
    roles: input.roles,
    ...(input.propertyIds !== undefined ? { propertyIds: input.propertyIds } : {})
  });

  const invitationSelect =
    "id, organization_id, email, roles, status, token, expires_at, username, provisioned_user_id, delivery_status, property_ids";

  const { data: pending } = await admin
    .from("organization_invitations")
    .select(invitationSelect)
    .eq("organization_id", input.organizationId)
    .eq("status", "pending")
    .ilike("email", email)
    .maybeSingle();

  if (pending) {
    const invitation = mapInvitation(pending as Record<string, unknown>);
    if (invitation.provisionedUserId) {
      await deliverInvitationCredentials({
        organizationId: input.organizationId,
        invitationId: invitation.id,
        userId: invitation.provisionedUserId,
        contactEmail: email,
        token: invitation.token,
        roles: invitation.roles,
        forceResend: true
      });
    }
    return { invitation, resent: true };
  }

  throwIfDenied(await assertCanInviteSeat(input.organizationId, { client: admin }));

  const seed = email.split("@")[0] || "member";
  const provisioned = await provisionInviteePrincipal({
    contactEmail: email,
    displayName: seed,
    usernameSeed: seed
  });

  const { data: inserted, error: insertError } = await admin
    .from("organization_invitations")
    .insert({
      organization_id: input.organizationId,
      email,
      roles: input.roles,
      property_ids: propertyIds,
      invited_by: input.invitedBy,
      status: "pending",
      provisioned_user_id: provisioned.authUserId,
      username: provisioned.principal.username,
      delivery_status: "pending"
    })
    .select(invitationSelect)
    .single();

  if (insertError || !inserted) {
    throw new Error(insertError?.message ?? "Failed to create invitation.");
  }

  const invitation = mapInvitation(inserted as Record<string, unknown>);

  const { error: membershipError } = await admin.from("organization_memberships").upsert(
    {
      organization_id: input.organizationId,
      user_id: provisioned.authUserId,
      roles: input.roles,
      status: "inactive",
      invited_by: input.invitedBy
    },
    { onConflict: "organization_id,user_id" }
  );

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  await applyInvitationPropertyScopes({
    organizationId: input.organizationId,
    userId: provisioned.authUserId,
    roles: input.roles,
    propertyIds
  });

  await deliverInvitationCredentials({
    organizationId: input.organizationId,
    invitationId: invitation.id,
    userId: provisioned.authUserId,
    contactEmail: email,
    token: invitation.token,
    roles: invitation.roles
  });

  await emitInviteEvent(admin, {
    organizationId: input.organizationId,
    invitationId: invitation.id,
    eventType: "auth.user.invited",
    userId: provisioned.authUserId
  });

  const { data: refreshed } = await admin
    .from("organization_invitations")
    .select(invitationSelect)
    .eq("id", invitation.id)
    .single();

  return {
    invitation: mapInvitation((refreshed ?? inserted) as Record<string, unknown>),
    resent: false
  };
}

export async function resendInvitation(invitationId: string): Promise<InvitationRecord> {
  const admin = serviceClient();
  const { data, error } = await admin
    .from("organization_invitations")
    .select(
      "id, organization_id, email, roles, status, token, expires_at, username, provisioned_user_id, delivery_status"
    )
    .eq("id", invitationId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Invitation not found.");
  const invitation = mapInvitation(data as Record<string, unknown>);
  if (invitation.status !== "pending") throw new Error("Only pending invitations can be resent.");
  if (new Date(invitation.expiresAt).getTime() < Date.now()) {
    await admin
      .from("organization_invitations")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", invitationId);
    throw new Error("Invitation expired.");
  }
  if (!invitation.provisionedUserId) {
    throw new Error("Invitation has no provisioned principal.");
  }

  // Extend expiry on resend (7 days from now).
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await admin
    .from("organization_invitations")
    .update({ expires_at: expiresAt, updated_at: new Date().toISOString() })
    .eq("id", invitationId);

  await deliverInvitationCredentials({
    organizationId: invitation.organizationId,
    invitationId: invitation.id,
    userId: invitation.provisionedUserId,
    contactEmail: invitation.email,
    token: invitation.token,
    roles: invitation.roles,
    forceResend: true
  });

  return { ...invitation, expiresAt };
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  const admin = serviceClient();
  const { data, error } = await admin
    .from("organization_invitations")
    .select("id, organization_id, status, provisioned_user_id")
    .eq("id", invitationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Invitation not found.");
  if (data.status !== "pending") throw new Error("Only pending invitations can be revoked.");

  const { error: updateError } = await admin
    .from("organization_invitations")
    .update({ status: "revoked", updated_at: new Date().toISOString() })
    .eq("id", invitationId);
  if (updateError) throw new Error(updateError.message);

  await emitInviteEvent(admin, {
    organizationId: String(data.organization_id),
    invitationId: String(data.id),
    eventType: "auth.user.invitation_revoked",
    userId: data.provisioned_user_id ? String(data.provisioned_user_id) : null
  });
}

export async function editInvitationEmail(invitationId: string, newEmail: string): Promise<InvitationRecord> {
  const admin = serviceClient();
  const email = newEmail.trim().toLowerCase();
  if (!email.includes("@")) throw new Error("Valid contact email is required.");

  const { data, error } = await admin
    .from("organization_invitations")
    .select(
      "id, organization_id, email, roles, status, token, expires_at, username, provisioned_user_id, delivery_status"
    )
    .eq("id", invitationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Invitation not found.");
  if (data.status !== "pending") throw new Error("Only pending invitations can be edited.");

  const { error: updateError } = await admin
    .from("organization_invitations")
    .update({ email, updated_at: new Date().toISOString() })
    .eq("id", invitationId);
  if (updateError) throw new Error(updateError.message);

  if (data.provisioned_user_id) {
    await admin.from("user_profiles").upsert(
      {
        user_id: data.provisioned_user_id,
        contact_email: email,
        contact_email_verified_at: null,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id" }
    );
    await admin.auth.admin.updateUserById(String(data.provisioned_user_id), {
      user_metadata: { contact_email: email },
      app_metadata: { mpa_contact_email: email }
    });
  }

  return resendInvitation(invitationId);
}

/**
 * Activate membership for the authenticated provisioned invitee (accept).
 */
export async function acceptAndActivateInvitation(input: {
  token: string;
  authUserId: string;
}): Promise<{ organizationId: string }> {
  const admin = serviceClient();
  const trimmed = input.token.trim();

  const { data: invitation, error } = await admin
    .from("organization_invitations")
    .select(
      "id, organization_id, email, roles, status, expires_at, provisioned_user_id, username, property_ids"
    )
    .eq("token", trimmed)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!invitation) throw new Error("Invitation not found.");
  if (invitation.status === "revoked") throw new Error("Invitation revoked.");
  if (invitation.status === "expired" || new Date(String(invitation.expires_at)).getTime() < Date.now()) {
    await admin
      .from("organization_invitations")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", invitation.id);
    throw new Error("Invitation expired.");
  }
  if (invitation.status === "accepted") {
    return { organizationId: String(invitation.organization_id) };
  }
  if (invitation.status !== "pending") throw new Error("Invitation is not pending.");

  const provisionedUserId = invitation.provisioned_user_id
    ? String(invitation.provisioned_user_id)
    : null;

  // Slice C: accept must be the provisioned principal (username identity).
  if (provisionedUserId && provisionedUserId !== input.authUserId) {
    throw new Error("Sign in with the invited username from your invitation email.");
  }

  // Legacy Phase-3 invites without provisioned_user_id: contact email match via profile.
  if (!provisionedUserId) {
    const { data: profile } = await admin
      .from("user_profiles")
      .select("contact_email")
      .eq("user_id", input.authUserId)
      .maybeSingle();
    const contact = String(profile?.contact_email ?? "").toLowerCase();
    if (!contact || contact !== String(invitation.email).toLowerCase()) {
      throw new Error("Forbidden");
    }
  }

  const roles = Array.isArray(invitation.roles) ? (invitation.roles as string[]) : [];
  const propertyIds = Array.isArray(invitation.property_ids)
    ? (invitation.property_ids as unknown[]).filter((id): id is string => typeof id === "string")
    : [];
  const now = new Date().toISOString();

  const { error: membershipError } = await admin.from("organization_memberships").upsert(
    {
      organization_id: invitation.organization_id,
      user_id: input.authUserId,
      roles,
      status: "active"
    },
    { onConflict: "organization_id,user_id" }
  );
  if (membershipError) throw new Error(membershipError.message);

  await applyInvitationPropertyScopes({
    organizationId: String(invitation.organization_id),
    userId: input.authUserId,
    roles,
    propertyIds
  });

  const { error: inviteUpdateError } = await admin
    .from("organization_invitations")
    .update({
      status: "accepted",
      accepted_by: input.authUserId,
      accepted_at: now,
      activated_at: now,
      updated_at: now
    })
    .eq("id", invitation.id);
  if (inviteUpdateError) throw new Error(inviteUpdateError.message);

  if (roles.includes("tenant")) {
    await admin
      .from("tenants")
      .update({ user_id: input.authUserId, updated_by: input.authUserId })
      .eq("organization_id", invitation.organization_id)
      .ilike("email", String(invitation.email))
      .is("deleted_at", null)
      .is("user_id", null);
  }

  await emitInviteEvent(admin, {
    organizationId: String(invitation.organization_id),
    invitationId: String(invitation.id),
    eventType: "auth.user.invitation_accepted",
    userId: input.authUserId
  });

  return { organizationId: String(invitation.organization_id) };
}

export async function getInvitationPublicPreview(token: string): Promise<{
  organizationName: string;
  username: string | null;
  email: string;
  status: string;
  expired: boolean;
} | null> {
  const admin = serviceClient();
  const { data } = await admin
    .from("organization_invitations")
    .select("email, status, expires_at, username, organization_id")
    .eq("token", token.trim())
    .maybeSingle();
  if (!data) return null;

  let organizationName = "Organization";
  if (data.organization_id) {
    const { data: org } = await admin
      .from("organizations")
      .select("name")
      .eq("id", data.organization_id)
      .maybeSingle();
    if (org?.name) organizationName = String(org.name);
  }

  return {
    organizationName,
    username: data.username ? String(data.username) : null,
    email: String(data.email),
    status: String(data.status),
    expired:
      String(data.status) === "expired" ||
      new Date(String(data.expires_at)).getTime() < Date.now()
  };
}
