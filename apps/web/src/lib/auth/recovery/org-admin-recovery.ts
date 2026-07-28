/**
 * AUTH-001 Slice E — Organization Admin Level-3 recovery (Master Admin only).
 */
import { revokeAllSessions, setPrincipalStatus } from "../identity";
import { deliverCredentialReset } from "./credential-reset-delivery";
import {
  isOrganizationAdminRoles,
  loadContactEmail,
  loadMembership,
  resolveUserIdByContactOrUsername,
  serviceClient
} from "./membership-helpers";
import { emitRecoveryOpsEvent } from "./ops-events";
import { recordPrivilegedAudit } from "./privileged-audit";
import { getRecoveryContact } from "./recovery-contact";

export type OrgAdminRecoveryInput = {
  organizationId: string;
  actorUserId: string;
  /** Username or contact email of the Org Admin to recover. */
  targetIdentifier: string;
  reason: string;
  /** Master Admin attests identity verification completed. */
  identityVerified: boolean;
  /** Required when org has a verified secondary recovery contact. */
  secondaryContactConfirmed?: boolean;
  verificationNotes?: string | null;
  ipAddress?: string | null;
  device?: string | null;
};

export type OrgAdminRecoveryResult = {
  organizationId: string;
  targetUserId: string;
  username: string | null;
  deliveryStatus: "sent" | "failed";
  auditId: string;
};

export async function recoverOrganizationAdmin(
  input: OrgAdminRecoveryInput
): Promise<OrgAdminRecoveryResult> {
  if (!input.identityVerified) {
    throw new Error("Identity verification is required before Org Admin recovery.");
  }
  const reason = input.reason.trim();
  if (reason.length < 8) {
    throw new Error("A recovery reason of at least 8 characters is required.");
  }

  const admin = serviceClient();
  const { data: org, error: orgError } = await admin
    .from("organizations")
    .select("id, name")
    .eq("id", input.organizationId)
    .maybeSingle();
  if (orgError) throw new Error(orgError.message);
  if (!org) throw new Error("Organization not found.");

  const identifier = input.targetIdentifier.trim();
  let targetUserId = await resolveUserIdByContactOrUsername(identifier);
  if (!targetUserId && /^[0-9a-f-]{36}$/i.test(identifier)) {
    const byId = await loadMembership(input.organizationId, identifier);
    targetUserId = byId?.user_id ?? identifier;
  }

  if (!targetUserId) {
    throw new Error("Target Organization Administrator not found.");
  }

  const membership = await loadMembership(input.organizationId, targetUserId);
  if (!membership || membership.status !== "active") {
    throw new Error("Target is not an active member of this organization.");
  }
  if (!isOrganizationAdminRoles(membership.roles, membership.is_owner)) {
    throw new Error("Target is not an Organization Administrator for this organization.");
  }

  const recoveryContact = await getRecoveryContact(input.organizationId);
  if (recoveryContact?.verifiedAt && !input.secondaryContactConfirmed) {
    throw new Error(
      "Secondary recovery contact confirmation is required for this organization."
    );
  }

  const contactEmail = await loadContactEmail(targetUserId);
  if (!contactEmail) {
    throw new Error("Target Organization Administrator has no contact email for delivery.");
  }

  await setPrincipalStatus(targetUserId, "active");
  await revokeAllSessions(targetUserId);

  const delivery = await deliverCredentialReset({
    organizationId: input.organizationId,
    userId: targetUserId,
    contactEmail,
    deliveryKind: "org_admin_recovery",
    reasonCode: "l3_org_admin_recovery"
  });

  const auditId = await recordPrivilegedAudit({
    actorUserId: input.actorUserId,
    actorType: "master_admin",
    organizationId: input.organizationId,
    action: "org.admin_recovery_completed",
    targetType: "user",
    targetId: targetUserId,
    reason,
    ipAddress: input.ipAddress,
    device: input.device,
    beforeState: { membershipStatus: membership.status },
    afterState: {
      passwordState: "temporary_issued",
      sessionsRevoked: true,
      deliveryStatus: delivery.status
    },
    metadata: {
      identityVerified: true,
      secondaryContactConfirmed: Boolean(input.secondaryContactConfirmed),
      verificationNotesPresent: Boolean(input.verificationNotes?.trim()),
      organizationName: org.name
    }
  });

  await emitRecoveryOpsEvent({
    eventType: "auth.recovery.org_admin_completed",
    organizationId: input.organizationId,
    subjectType: "user",
    subjectId: targetUserId,
    actorUserId: input.actorUserId,
    summary: "Organization Admin recovery completed",
    payload: {
      deliveryStatus: delivery.status,
      secondaryContactConfirmed: Boolean(input.secondaryContactConfirmed),
      auditId
    },
    correlationId: auditId
  });

  return {
    organizationId: input.organizationId,
    targetUserId,
    username: delivery.username,
    deliveryStatus: delivery.status,
    auditId
  };
}
