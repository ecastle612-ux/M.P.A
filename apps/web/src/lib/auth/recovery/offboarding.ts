/**
 * AUTH-001 Slice E — Offboarding hooks (disable / archive without history deletion).
 */
import { revokeAllSessions, setPrincipalStatus } from "../identity";
import { setMembershipStatus } from "../roles/assignment";
import {
  assertActorIsOrgAdmin,
  loadMembership,
  serviceClient
} from "./membership-helpers";
import { emitRecoveryOpsEvent } from "./ops-events";
import { recordPrivilegedAudit } from "./privileged-audit";

export type OffboardMemberInput = {
  organizationId: string;
  targetUserId: string;
  actorUserId: string;
  actorIsMasterAdmin?: boolean;
  reason: string;
  /** When true, principal moves to archived after disable. */
  archive?: boolean;
  /** Optional successor for transfer audit (work transfer may be domain-specific). */
  successorUserId?: string | null;
  ipAddress?: string | null;
  device?: string | null;
};

export type OffboardMemberResult = {
  organizationId: string;
  targetUserId: string;
  membershipStatus: "inactive";
  principalStatus: "disabled" | "archived";
  pendingInvitationsRevoked: number;
  auditId: string;
};

export async function offboardOrganizationMember(
  input: OffboardMemberInput
): Promise<OffboardMemberResult> {
  const reason = input.reason.trim();
  if (reason.length < 4) throw new Error("Offboarding reason is required.");

  await assertActorIsOrgAdmin(
    input.organizationId,
    input.actorUserId,
    Boolean(input.actorIsMasterAdmin)
  );

  if (input.actorUserId === input.targetUserId) {
    throw new Error("Cannot offboard your own membership.");
  }

  const membership = await loadMembership(input.organizationId, input.targetUserId);
  if (!membership) throw new Error("Membership not found.");
  if (membership.is_owner) {
    throw new Error(
      "Cannot offboard the primary Organization Administrator. Use ownership restore first."
    );
  }

  await setMembershipStatus({
    organizationId: input.organizationId,
    targetUserId: input.targetUserId,
    status: "inactive",
    actorUserId: input.actorUserId,
    ...(input.actorIsMasterAdmin ? { actorIsMasterAdmin: true } : {})
  });

  const principalStatus = input.archive ? "archived" : "disabled";
  await setPrincipalStatus(input.targetUserId, principalStatus);
  await revokeAllSessions(input.targetUserId);

  const admin = serviceClient();
  const { data: pendingInvites } = await admin
    .from("organization_invitations")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("status", "pending");

  // Revoke invites that match the offboarded user's contact email when available.
  const { data: profile } = await admin
    .from("user_profiles")
    .select("contact_email")
    .eq("user_id", input.targetUserId)
    .maybeSingle();

  let pendingInvitationsRevoked = 0;
  const contactEmail =
    typeof profile?.contact_email === "string" ? profile.contact_email.trim().toLowerCase() : "";
  if (contactEmail) {
    const { data: revoked } = await admin
      .from("organization_invitations")
      .update({ status: "revoked", updated_at: new Date().toISOString() })
      .eq("organization_id", input.organizationId)
      .eq("email", contactEmail)
      .eq("status", "pending")
      .select("id");
    pendingInvitationsRevoked = revoked?.length ?? 0;
  }
  void pendingInvites;

  const auditId = await recordPrivilegedAudit({
    actorUserId: input.actorUserId,
    actorType: input.actorIsMasterAdmin ? "master_admin" : "org_admin",
    organizationId: input.organizationId,
    action: input.archive ? "user.archived" : "user.disabled",
    targetType: "user",
    targetId: input.targetUserId,
    reason,
    ipAddress: input.ipAddress,
    device: input.device,
    beforeState: {
      membershipStatus: membership.status,
      roles: membership.roles
    },
    afterState: {
      membershipStatus: "inactive",
      principalStatus,
      sessionsRevoked: true,
      pendingInvitationsRevoked
    },
    metadata: {
      successorUserId: input.successorUserId ?? null,
      historyPreserved: true
    }
  });

  if (input.successorUserId) {
    await recordPrivilegedAudit({
      actorUserId: input.actorUserId,
      actorType: input.actorIsMasterAdmin ? "master_admin" : "org_admin",
      organizationId: input.organizationId,
      action: "user.offboard_transfer",
      targetType: "user",
      targetId: input.targetUserId,
      reason: `transfer_to:${input.successorUserId}`,
      afterState: { successorUserId: input.successorUserId },
      correlationId: auditId
    });
  }

  await emitRecoveryOpsEvent({
    eventType: "auth.offboarding.completed",
    organizationId: input.organizationId,
    subjectType: "user",
    subjectId: input.targetUserId,
    actorUserId: input.actorUserId,
    summary: "Member offboarding completed",
    payload: {
      principalStatus,
      pendingInvitationsRevoked,
      successorUserId: input.successorUserId ?? null,
      auditId,
      historyPreserved: true
    },
    correlationId: auditId
  });

  return {
    organizationId: input.organizationId,
    targetUserId: input.targetUserId,
    membershipStatus: "inactive",
    principalStatus,
    pendingInvitationsRevoked,
    auditId
  };
}
