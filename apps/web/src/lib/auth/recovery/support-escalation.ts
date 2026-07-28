/**
 * AUTH-001 Slice E — Support escalation routing for auth/recovery issue classes.
 */
import { recordPrivilegedAudit } from "./privileged-audit";
import { emitRecoveryOpsEvent } from "./ops-events";
import { assertActorIsOrgAdmin, serviceClient } from "./membership-helpers";

export type EscalationLevel = "L0" | "L1" | "L2" | "L3";
export type EscalationStatus = "open" | "escalated" | "resolved" | "closed";

export const AUTH_ISSUE_CLASSES = [
  "login_help",
  "subaccount_password",
  "subaccount_permission",
  "org_admin_lockout",
  "ownership_dispute",
  "account_takeover",
  "cross_org_exposure",
  "invitation_delivery",
  "billing_login"
] as const;

export type AuthIssueClass = (typeof AUTH_ISSUE_CLASSES)[number];

export function firstOwnerLevel(issueClass: AuthIssueClass): EscalationLevel {
  switch (issueClass) {
    case "login_help":
    case "billing_login":
      return "L0";
    case "subaccount_password":
    case "subaccount_permission":
    case "invitation_delivery":
      return "L1";
    case "org_admin_lockout":
      return "L2";
    case "ownership_dispute":
    case "account_takeover":
    case "cross_org_exposure":
      return "L3";
    default:
      return "L1";
  }
}

export function nextEscalationLevel(level: EscalationLevel): EscalationLevel | null {
  if (level === "L0") return "L1";
  if (level === "L1") return "L2";
  if (level === "L2") return "L3";
  return null;
}

/** Org Admin credential re-issue always requires L3 (SUP-02). */
export function requiresMasterAdminForCredentialIssue(issueClass: AuthIssueClass): boolean {
  return (
    issueClass === "org_admin_lockout" ||
    issueClass === "ownership_dispute" ||
    issueClass === "account_takeover" ||
    issueClass === "cross_org_exposure"
  );
}

export type SupportEscalationRecord = {
  id: string;
  organizationId: string | null;
  issueClass: string;
  level: EscalationLevel;
  status: EscalationStatus;
  subjectUserId: string | null;
  openedBy: string | null;
  reason: string;
  resolutionNotes: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

function mapRow(row: Record<string, unknown>): SupportEscalationRecord {
  return {
    id: String(row["id"]),
    organizationId: row["organization_id"] ? String(row["organization_id"]) : null,
    issueClass: String(row["issue_class"]),
    level: row["level"] as EscalationLevel,
    status: row["status"] as EscalationStatus,
    subjectUserId: row["subject_user_id"] ? String(row["subject_user_id"]) : null,
    openedBy: row["opened_by"] ? String(row["opened_by"]) : null,
    reason: String(row["reason"]),
    resolutionNotes: row["resolution_notes"] ? String(row["resolution_notes"]) : null,
    createdAt: String(row["created_at"]),
    resolvedAt: row["resolved_at"] ? String(row["resolved_at"]) : null
  };
}

export async function openSupportEscalation(input: {
  organizationId?: string | null;
  issueClass: AuthIssueClass;
  reason: string;
  openedBy: string;
  subjectUserId?: string | null;
  actorIsMasterAdmin?: boolean;
  /** Force starting level (defaults from issue class). */
  level?: EscalationLevel;
  ipAddress?: string | null;
  device?: string | null;
}): Promise<SupportEscalationRecord> {
  const reason = input.reason.trim();
  if (reason.length < 4) throw new Error("Escalation reason is required.");

  if (input.organizationId && !input.actorIsMasterAdmin) {
    await assertActorIsOrgAdmin(input.organizationId, input.openedBy, false);
  }

  const level = input.level ?? firstOwnerLevel(input.issueClass);
  const admin = serviceClient();
  const { data, error } = await admin
    .from("auth_support_escalations")
    .insert({
      organization_id: input.organizationId ?? null,
      issue_class: input.issueClass,
      level,
      status: "open",
      subject_user_id: input.subjectUserId ?? null,
      opened_by: input.openedBy,
      reason
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to open support escalation.");
  }

  const record = mapRow(data as Record<string, unknown>);

  await recordPrivilegedAudit({
    actorUserId: input.openedBy,
    actorType: input.actorIsMasterAdmin ? "master_admin" : "org_admin",
    organizationId: input.organizationId,
    action: "support.escalation_opened",
    targetType: "auth_support_escalation",
    targetId: record.id,
    reason,
    ipAddress: input.ipAddress,
    device: input.device,
    afterState: { level: record.level, issueClass: record.issueClass }
  });

  if (input.organizationId) {
    await emitRecoveryOpsEvent({
      eventType: "auth.escalation.opened",
      organizationId: input.organizationId,
      subjectType: "auth_support_escalation",
      subjectId: record.id,
      actorUserId: input.openedBy,
      summary: "Support escalation opened",
      payload: { level: record.level, issueClass: record.issueClass }
    });
  }

  return record;
}

export async function escalateSupportCase(input: {
  escalationId: string;
  actorUserId: string;
  actorIsMasterAdmin?: boolean | undefined;
  reason?: string | null | undefined;
  /** Master Admin / support may escalate to L3 for Org Admin recovery. */
  forceLevel?: EscalationLevel | undefined;
}): Promise<SupportEscalationRecord> {
  const admin = serviceClient();
  const { data: existing, error } = await admin
    .from("auth_support_escalations")
    .select("*")
    .eq("id", input.escalationId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!existing) throw new Error("Escalation not found.");

  const current = mapRow(existing as Record<string, unknown>);
  if (current.status === "resolved" || current.status === "closed") {
    throw new Error("Cannot escalate a closed case.");
  }

  const issueClass = current.issueClass as AuthIssueClass;
  let nextLevel = input.forceLevel ?? nextEscalationLevel(current.level);
  if (!nextLevel) {
    throw new Error("Escalation is already at L3.");
  }

  // Org Admin credential paths cannot stop below L3.
  if (requiresMasterAdminForCredentialIssue(issueClass) && nextLevel !== "L3") {
    nextLevel = "L3";
  }

  if (current.organizationId && !input.actorIsMasterAdmin && nextLevel === "L3") {
    throw new Error("Only Master Admin / support can escalate to L3.");
  }

  const now = new Date().toISOString();
  const { data, error: updateError } = await admin
    .from("auth_support_escalations")
    .update({
      level: nextLevel,
      status: "escalated",
      reason: input.reason?.trim() || current.reason,
      updated_at: now
    })
    .eq("id", input.escalationId)
    .select("*")
    .single();

  if (updateError || !data) {
    throw new Error(updateError?.message ?? "Failed to escalate case.");
  }

  const record = mapRow(data as Record<string, unknown>);

  await recordPrivilegedAudit({
    actorUserId: input.actorUserId,
    actorType: input.actorIsMasterAdmin ? "master_admin" : "support",
    organizationId: record.organizationId,
    action: "support.escalation_elevated",
    targetType: "auth_support_escalation",
    targetId: record.id,
    reason: input.reason?.trim() || "escalated",
    beforeState: { level: current.level },
    afterState: { level: record.level }
  });

  if (record.organizationId) {
    await emitRecoveryOpsEvent({
      eventType: "auth.escalation.escalated",
      organizationId: record.organizationId,
      subjectType: "auth_support_escalation",
      subjectId: record.id,
      actorUserId: input.actorUserId,
      summary: "Support escalation elevated",
      payload: { fromLevel: current.level, toLevel: record.level, issueClass: record.issueClass }
    });
  }

  return record;
}

export async function resolveSupportEscalation(input: {
  escalationId: string;
  actorUserId: string;
  actorIsMasterAdmin?: boolean;
  resolutionNotes: string;
}): Promise<SupportEscalationRecord> {
  const notes = input.resolutionNotes.trim();
  if (notes.length < 4) throw new Error("Resolution notes are required.");

  const admin = serviceClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("auth_support_escalations")
    .update({
      status: "resolved",
      resolution_notes: notes,
      resolved_at: now,
      updated_at: now
    })
    .eq("id", input.escalationId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to resolve escalation.");
  }

  const record = mapRow(data as Record<string, unknown>);

  await recordPrivilegedAudit({
    actorUserId: input.actorUserId,
    actorType: input.actorIsMasterAdmin ? "master_admin" : "support",
    organizationId: record.organizationId,
    action: "support.escalation_resolved",
    targetType: "auth_support_escalation",
    targetId: record.id,
    reason: notes
  });

  if (record.organizationId) {
    await emitRecoveryOpsEvent({
      eventType: "auth.escalation.resolved",
      organizationId: record.organizationId,
      subjectType: "auth_support_escalation",
      subjectId: record.id,
      actorUserId: input.actorUserId,
      summary: "Support escalation resolved",
      payload: { level: record.level, issueClass: record.issueClass }
    });
  }

  return record;
}

export async function listSupportEscalations(organizationId: string, limit = 50) {
  const admin = serviceClient();
  const { data, error } = await admin
    .from("auth_support_escalations")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: Record<string, unknown>) => mapRow(row));
}
