/**
 * AUTH-001 Slice E — Pending Setup / Trial → Active gated by R-04 recovery contact.
 */
import { refreshImplementationProgress } from "../../commercial/progress";
import { assertActorIsOrgAdmin, serviceClient } from "./membership-helpers";
import { emitRecoveryOpsEvent } from "./ops-events";
import { recordPrivilegedAudit } from "./privileged-audit";
import { organizationHasReadyRecoveryContact } from "./recovery-contact";

export async function activateOrganizationCommercialStatus(input: {
  organizationId: string;
  actorUserId: string;
  actorIsMasterAdmin?: boolean;
  ipAddress?: string | null;
  device?: string | null;
}): Promise<{ organizationId: string; commercialStatus: "active"; auditId: string }> {
  await assertActorIsOrgAdmin(
    input.organizationId,
    input.actorUserId,
    Boolean(input.actorIsMasterAdmin)
  );

  const ready = await organizationHasReadyRecoveryContact(input.organizationId);
  if (!ready) {
    throw new Error(
      "Secondary recovery contact must be verified and acknowledged before the organization can become active."
    );
  }

  const admin = serviceClient();
  const { data: org, error } = await admin
    .from("organizations")
    .select("id, commercial_status")
    .eq("id", input.organizationId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!org) throw new Error("Organization not found.");

  const previous = org.commercial_status ? String(org.commercial_status) : null;
  if (previous === "active") {
    const auditId = await recordPrivilegedAudit({
      actorUserId: input.actorUserId,
      actorType: input.actorIsMasterAdmin ? "master_admin" : "org_admin",
      organizationId: input.organizationId,
      action: "org.status_changed",
      targetType: "organization",
      targetId: input.organizationId,
      reason: "already_active",
      beforeState: { commercialStatus: previous },
      afterState: { commercialStatus: "active" }
    });
    return { organizationId: input.organizationId, commercialStatus: "active", auditId };
  }

  const { error: updateError } = await admin
    .from("organizations")
    .update({
      commercial_status: "active",
      updated_at: new Date().toISOString()
    })
    .eq("id", input.organizationId);

  if (updateError) throw new Error(updateError.message);

  const auditId = await recordPrivilegedAudit({
    actorUserId: input.actorUserId,
    actorType: input.actorIsMasterAdmin ? "master_admin" : "org_admin",
    organizationId: input.organizationId,
    action: "org.status_changed",
    targetType: "organization",
    targetId: input.organizationId,
    reason: "finish_setup_active",
    ipAddress: input.ipAddress,
    device: input.device,
    beforeState: { commercialStatus: previous },
    afterState: { commercialStatus: "active" }
  });

  await emitRecoveryOpsEvent({
    eventType: "auth.organization.activated",
    organizationId: input.organizationId,
    subjectType: "organization",
    subjectId: input.organizationId,
    actorUserId: input.actorUserId,
    summary: "Organization commercial status activated",
    payload: { previousStatus: previous, auditId },
    correlationId: auditId
  });

  try {
    await refreshImplementationProgress(input.organizationId, {
      actorUserId: input.actorUserId
    });
  } catch {
    // Best-effort COM-001 Slice B score refresh after Finish Setup.
  }

  try {
    const { scheduleCsMotions } = await import("../../commercial/cs-motions");
    await scheduleCsMotions({
      organizationId: input.organizationId,
      activeAt: new Date().toISOString(),
      actorUserId: input.actorUserId
    });
  } catch {
    // Best-effort COM-001 Slice D CS 30/90 schedule after Active.
  }

  return { organizationId: input.organizationId, commercialStatus: "active", auditId };
}
