/**
 * AUTH-001 Slice E — Subaccount credential reset by Organization Administrator.
 */
import { revokeAllSessions } from "../identity";
import { deliverCredentialReset } from "./credential-reset-delivery";
import {
  assertActorIsOrgAdmin,
  isOrganizationAdminRoles,
  loadContactEmail,
  loadMembership
} from "./membership-helpers";
import { emitRecoveryOpsEvent } from "./ops-events";
import { recordPrivilegedAudit } from "./privileged-audit";

export type SubaccountResetInput = {
  organizationId: string;
  targetUserId: string;
  actorUserId: string;
  actorIsMasterAdmin?: boolean;
  reason?: string | null;
  ipAddress?: string | null;
  device?: string | null;
};

export type SubaccountResetResult = {
  organizationId: string;
  targetUserId: string;
  username: string | null;
  deliveryStatus: "sent" | "failed";
  auditId: string;
};

export async function resetSubaccountCredentials(
  input: SubaccountResetInput
): Promise<SubaccountResetResult> {
  await assertActorIsOrgAdmin(
    input.organizationId,
    input.actorUserId,
    Boolean(input.actorIsMasterAdmin)
  );

  if (input.actorUserId === input.targetUserId && !input.actorIsMasterAdmin) {
    throw new Error(
      "Organization Administrators cannot self-serve password reset. Contact M.P.A. support."
    );
  }

  const membership = await loadMembership(input.organizationId, input.targetUserId);
  if (!membership) {
    throw new Error("Membership not found in this organization.");
  }
  if (membership.status !== "active") {
    throw new Error("Cannot reset credentials for an inactive membership.");
  }

  // Org Admin self-reset is forbidden for commercial policy (R-01 / R-03 split).
  if (
    !input.actorIsMasterAdmin &&
    isOrganizationAdminRoles(membership.roles, membership.is_owner)
  ) {
    throw new Error(
      "Organization Administrator credentials can only be recovered by M.P.A. Master Admin."
    );
  }

  const contactEmail = await loadContactEmail(input.targetUserId);
  if (!contactEmail) {
    throw new Error("Subaccount has no contact email for credential delivery.");
  }

  await revokeAllSessions(input.targetUserId);

  const delivery = await deliverCredentialReset({
    organizationId: input.organizationId,
    userId: input.targetUserId,
    contactEmail,
    deliveryKind: "subaccount_reset",
    reasonCode: "org_admin_subaccount_reset"
  });

  const auditId = await recordPrivilegedAudit({
    actorUserId: input.actorUserId,
    actorType: input.actorIsMasterAdmin ? "master_admin" : "org_admin",
    organizationId: input.organizationId,
    action: "user.password_reset",
    targetType: "user",
    targetId: input.targetUserId,
    reason: input.reason?.trim() || "org_admin_subaccount_reset",
    ipAddress: input.ipAddress,
    device: input.device,
    afterState: {
      passwordState: "temporary_issued",
      sessionsRevoked: true,
      deliveryStatus: delivery.status
    }
  });

  await emitRecoveryOpsEvent({
    eventType: "auth.recovery.subaccount_reset",
    organizationId: input.organizationId,
    subjectType: "user",
    subjectId: input.targetUserId,
    actorUserId: input.actorUserId,
    summary: "Subaccount credentials reset",
    payload: { deliveryStatus: delivery.status, auditId },
    correlationId: auditId
  });

  return {
    organizationId: input.organizationId,
    targetUserId: input.targetUserId,
    username: delivery.username,
    deliveryStatus: delivery.status,
    auditId
  };
}
