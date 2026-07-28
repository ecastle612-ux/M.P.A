/**
 * AUTH-001 Slice E — Emergency ownership restore / primary Org Admin transfer.
 * Master Admin (L3) only after verification. Fails closed without verification.
 */
import { isUserRole, type UserRole } from "@mpa/shared";
import { revokeAllSessions, setPrincipalStatus } from "../identity";
import { deliverCredentialReset } from "./credential-reset-delivery";
import {
  loadContactEmail,
  loadMembership,
  resolveUserIdByContactOrUsername,
  serviceClient
} from "./membership-helpers";
import { emitRecoveryOpsEvent } from "./ops-events";
import { recordPrivilegedAudit } from "./privileged-audit";
import { getRecoveryContact } from "./recovery-contact";

export type OwnershipRestoreInput = {
  organizationId: string;
  actorUserId: string;
  /** Existing member to promote, or contact email / username to resolve. */
  newOwnerIdentifier: string;
  reason: string;
  identityVerified: boolean;
  secondaryContactConfirmed?: boolean;
  /** When true, previous owner membership is deactivated after transfer. */
  disablePreviousOwner?: boolean;
  issueTemporaryCredentials?: boolean;
  disputeHold?: boolean;
  ipAddress?: string | null;
  device?: string | null;
};

export type OwnershipRestoreResult = {
  organizationId: string;
  previousOwnerUserId: string | null;
  newOwnerUserId: string;
  deliveryStatus: "sent" | "failed" | "skipped";
  auditId: string;
};

export async function restoreOrganizationOwnership(
  input: OwnershipRestoreInput
): Promise<OwnershipRestoreResult> {
  if (input.disputeHold) {
    throw new Error(
      "Ownership changes are suspended while a dispute hold is active. Complete formal business verification first."
    );
  }
  if (!input.identityVerified) {
    throw new Error("Identity verification is required before ownership restore.");
  }
  const reason = input.reason.trim();
  if (reason.length < 8) {
    throw new Error("An ownership restore reason of at least 8 characters is required.");
  }

  const admin = serviceClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("id", input.organizationId)
    .maybeSingle();
  if (!org) throw new Error("Organization not found.");

  const recoveryContact = await getRecoveryContact(input.organizationId);
  if (recoveryContact?.verifiedAt && !input.secondaryContactConfirmed) {
    throw new Error(
      "Secondary recovery contact confirmation is required for ownership restore."
    );
  }

  let newOwnerUserId = await resolveUserIdByContactOrUsername(input.newOwnerIdentifier);
  if (!newOwnerUserId && /^[0-9a-f-]{36}$/i.test(input.newOwnerIdentifier.trim())) {
    newOwnerUserId = input.newOwnerIdentifier.trim();
  }
  if (!newOwnerUserId) {
    throw new Error("New owner principal could not be resolved.");
  }

  const newMembership = await loadMembership(input.organizationId, newOwnerUserId);
  if (!newMembership) {
    throw new Error("New owner must already be a member of this organization.");
  }

  const { data: previousOwner } = await admin
    .from("organization_memberships")
    .select("id, user_id, roles, status")
    .eq("organization_id", input.organizationId)
    .eq("is_owner", true)
    .maybeSingle();

  const previousOwnerUserId = previousOwner?.user_id
    ? String(previousOwner.user_id)
    : null;

  if (previousOwnerUserId === newOwnerUserId) {
    throw new Error("Selected principal is already the primary Organization Administrator.");
  }

  const now = new Date().toISOString();

  if (previousOwner) {
    const prevRoles = (Array.isArray(previousOwner.roles) ? previousOwner.roles : []).filter(
      (role: unknown): role is UserRole => isUserRole(role)
    );
    await admin
      .from("organization_memberships")
      .update({
        is_owner: false,
        status: input.disablePreviousOwner ? "inactive" : previousOwner.status,
        updated_at: now
      })
      .eq("id", previousOwner.id);

    if (input.disablePreviousOwner && previousOwnerUserId) {
      await setPrincipalStatus(previousOwnerUserId, "disabled");
      await revokeAllSessions(previousOwnerUserId);
      void prevRoles;
    }
  }

  const nextRoles = Array.from(
    new Set<UserRole>([...newMembership.roles, "organization_admin"])
  );

  const { error: promoteError } = await admin
    .from("organization_memberships")
    .update({
      is_owner: true,
      roles: nextRoles,
      status: "active",
      updated_at: now
    })
    .eq("id", newMembership.id);

  if (promoteError) {
    throw new Error(promoteError.message);
  }

  await setPrincipalStatus(newOwnerUserId, "active");
  await revokeAllSessions(newOwnerUserId);

  let deliveryStatus: "sent" | "failed" | "skipped" = "skipped";
  if (input.issueTemporaryCredentials !== false) {
    const contactEmail = await loadContactEmail(newOwnerUserId);
    if (!contactEmail) {
      throw new Error("New owner has no contact email for credential delivery.");
    }
    const delivery = await deliverCredentialReset({
      organizationId: input.organizationId,
      userId: newOwnerUserId,
      contactEmail,
      deliveryKind: "org_admin_recovery",
      reasonCode: "ownership_restore"
    });
    deliveryStatus = delivery.status;
  }

  const auditId = await recordPrivilegedAudit({
    actorUserId: input.actorUserId,
    actorType: "master_admin",
    organizationId: input.organizationId,
    action: "org.owner_changed",
    targetType: "organization",
    targetId: input.organizationId,
    reason,
    ipAddress: input.ipAddress,
    device: input.device,
    beforeState: { ownerUserId: previousOwnerUserId },
    afterState: {
      ownerUserId: newOwnerUserId,
      previousOwnerDisabled: Boolean(input.disablePreviousOwner),
      deliveryStatus
    },
    metadata: {
      identityVerified: true,
      secondaryContactConfirmed: Boolean(input.secondaryContactConfirmed)
    }
  });

  await emitRecoveryOpsEvent({
    eventType: "auth.recovery.ownership_restored",
    organizationId: input.organizationId,
    subjectType: "organization",
    subjectId: input.organizationId,
    actorUserId: input.actorUserId,
    summary: "Organization ownership restored",
    payload: {
      previousOwnerUserId,
      newOwnerUserId,
      deliveryStatus,
      auditId
    },
    correlationId: auditId
  });

  return {
    organizationId: input.organizationId,
    previousOwnerUserId,
    newOwnerUserId,
    deliveryStatus,
    auditId
  };
}
