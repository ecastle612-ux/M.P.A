/**
 * AUTH-001 Slice E — Secondary Recovery Contact (R-04).
 */
import { createHash, randomBytes } from "crypto";
import { sendWorkflowEmail } from "../../integrations/email/delivery";
import { recordPrivilegedAudit } from "./privileged-audit";
import { emitRecoveryOpsEvent } from "./ops-events";
import { assertActorIsOrgAdmin, serviceClient } from "./membership-helpers";

export type RecoveryContactRecord = {
  id: string;
  organizationId: string;
  fullName: string;
  email: string;
  phone: string | null;
  verifiedAt: string | null;
  orgAdminAcknowledgedAt: string | null;
  isReady: boolean;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function mapRow(row: Record<string, unknown>): RecoveryContactRecord {
  const verifiedAt = row["verified_at"] ? String(row["verified_at"]) : null;
  const orgAdminAcknowledgedAt = row["org_admin_acknowledged_at"]
    ? String(row["org_admin_acknowledged_at"])
    : null;
  return {
    id: String(row["id"]),
    organizationId: String(row["organization_id"]),
    fullName: String(row["full_name"]),
    email: String(row["email"]),
    phone: row["phone"] ? String(row["phone"]) : null,
    verifiedAt,
    orgAdminAcknowledgedAt,
    isReady: Boolean(verifiedAt && orgAdminAcknowledgedAt)
  };
}

export async function getRecoveryContact(
  organizationId: string
): Promise<RecoveryContactRecord | null> {
  const admin = serviceClient();
  const { data, error } = await admin
    .from("organization_recovery_contacts")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function organizationHasReadyRecoveryContact(
  organizationId: string
): Promise<boolean> {
  const contact = await getRecoveryContact(organizationId);
  return Boolean(contact?.isReady);
}

export async function upsertRecoveryContact(input: {
  organizationId: string;
  actorUserId: string;
  actorIsMasterAdmin?: boolean;
  fullName: string;
  email: string;
  phone?: string | null;
  acknowledge?: boolean;
  ipAddress?: string | null;
  device?: string | null;
}): Promise<{ contact: RecoveryContactRecord; verificationToken: string | null }> {
  await assertActorIsOrgAdmin(
    input.organizationId,
    input.actorUserId,
    Boolean(input.actorIsMasterAdmin)
  );

  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  if (fullName.length < 2) throw new Error("Recovery contact name is required.");
  if (!email.includes("@")) throw new Error("Valid recovery contact email is required.");

  const admin = serviceClient();
  const existing = await getRecoveryContact(input.organizationId);
  const verificationToken = randomBytes(24).toString("base64url");
  const tokenHash = hashToken(verificationToken);
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();
  const emailChanged = !existing || existing.email !== email;

  const payload = {
    organization_id: input.organizationId,
    full_name: fullName,
    email,
    phone: input.phone?.trim() || null,
    created_by: input.actorUserId,
    updated_at: now,
    ...(emailChanged
      ? {
          verified_at: null,
          verification_token_hash: tokenHash,
          verification_expires_at: expiresAt
        }
      : {}),
    ...(input.acknowledge ? { org_admin_acknowledged_at: now } : {})
  };

  const { data, error } = await admin
    .from("organization_recovery_contacts")
    .upsert(payload, { onConflict: "organization_id" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save recovery contact.");
  }

  const contact = mapRow(data as Record<string, unknown>);

  await recordPrivilegedAudit({
    actorUserId: input.actorUserId,
    actorType: input.actorIsMasterAdmin ? "master_admin" : "org_admin",
    organizationId: input.organizationId,
    action: "org.recovery_contact_updated",
    targetType: "organization_recovery_contact",
    targetId: contact.id,
    reason: emailChanged ? "recovery_contact_set_or_rotated" : "recovery_contact_updated",
    ipAddress: input.ipAddress,
    device: input.device,
    beforeState: existing
      ? { email: existing.email, verified: Boolean(existing.verifiedAt) }
      : null,
    afterState: { email: contact.email, verified: Boolean(contact.verifiedAt) }
  });

  await emitRecoveryOpsEvent({
    eventType: "auth.recovery.contact_updated",
    organizationId: input.organizationId,
    subjectType: "organization",
    subjectId: input.organizationId,
    actorUserId: input.actorUserId,
    summary: "Recovery contact updated",
    payload: { contactId: contact.id, emailChanged, acknowledged: Boolean(input.acknowledge) }
  });

  if (emailChanged) {
    await sendWorkflowEmail({
      organizationId: input.organizationId,
      templateKey: "general_notification",
      idempotencyKey: `recovery_contact_verify:${contact.id}:${Date.now()}`,
      to: { email: contact.email, name: contact.fullName },
      subject: "Verify your M.P.A. recovery contact",
      title: "Verify recovery contact",
      body: [
        `${contact.fullName},`,
        ``,
        `You were named as the secondary recovery contact for an organization on My Property Assistant.`,
        `Use the verification code below within 72 hours:`,
        ``,
        `Verification code: ${verificationToken}`,
        ``,
        `You are not automatically an Organization Administrator.`
      ].join("\n"),
      href: "/settings/team",
      tags: { auth_slice: "e", delivery_kind: "recovery_contact_verify" }
    });
  }

  if (existing && emailChanged) {
    await sendWorkflowEmail({
      organizationId: input.organizationId,
      templateKey: "general_notification",
      idempotencyKey: `recovery_contact_rotated:${existing.id}:${Date.now()}`,
      to: { email: existing.email, name: existing.fullName },
      subject: "Recovery contact changed",
      title: "Recovery contact changed",
      body: "You are no longer the secondary recovery contact for an M.P.A. organization.",
      href: "/",
      tags: { auth_slice: "e", delivery_kind: "recovery_contact_rotated" }
    }).catch(() => undefined);
  }

  return {
    contact,
    verificationToken: emailChanged ? verificationToken : null
  };
}

export async function verifyRecoveryContact(input: {
  organizationId: string;
  token: string;
  actorUserId?: string | null;
}): Promise<RecoveryContactRecord> {
  const admin = serviceClient();
  const { data, error } = await admin
    .from("organization_recovery_contacts")
    .select("*")
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Recovery contact not found.");

  const tokenHash = hashToken(input.token.trim());
  if (!data.verification_token_hash || data.verification_token_hash !== tokenHash) {
    throw new Error("Invalid verification token.");
  }
  if (
    data.verification_expires_at &&
    new Date(String(data.verification_expires_at)).getTime() < Date.now()
  ) {
    throw new Error("Verification token expired.");
  }

  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await admin
    .from("organization_recovery_contacts")
    .update({
      verified_at: now,
      verification_token_hash: null,
      verification_expires_at: null,
      updated_at: now
    })
    .eq("id", data.id)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new Error(updateError?.message ?? "Failed to verify recovery contact.");
  }

  const contact = mapRow(updated as Record<string, unknown>);

  await recordPrivilegedAudit({
    actorUserId: input.actorUserId ?? null,
    actorType: "system",
    organizationId: input.organizationId,
    action: "org.recovery_contact_verified",
    targetType: "organization_recovery_contact",
    targetId: contact.id,
    reason: "recovery_contact_email_verified",
    afterState: { verified: true }
  });

  await emitRecoveryOpsEvent({
    eventType: "auth.recovery.contact_verified",
    organizationId: input.organizationId,
    subjectType: "organization",
    subjectId: input.organizationId,
    actorUserId: input.actorUserId,
    summary: "Recovery contact verified",
    payload: { contactId: contact.id }
  });

  return contact;
}

export async function acknowledgeRecoveryContact(input: {
  organizationId: string;
  actorUserId: string;
  actorIsMasterAdmin?: boolean;
}): Promise<RecoveryContactRecord> {
  await assertActorIsOrgAdmin(
    input.organizationId,
    input.actorUserId,
    Boolean(input.actorIsMasterAdmin)
  );

  const admin = serviceClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("organization_recovery_contacts")
    .update({ org_admin_acknowledged_at: now, updated_at: now })
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Recovery contact must be saved before acknowledgment.");
  }

  return mapRow(data as Record<string, unknown>);
}
