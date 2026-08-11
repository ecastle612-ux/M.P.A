/**
 * MA-7 pure helpers — confirmation, last-admin, idempotency classification.
 * No invented org suspend model; no capacity mutation.
 */

export const MA7_ADMIN_ROLES = ["organization_admin", "property_manager"] as const;

export type Ma7MembershipStatus = "active" | "inactive";

export type Ma7MutationErrorCode =
  | "unauthorized"
  | "forbidden"
  | "invalid_state"
  | "confirmation_required"
  | "reason_required"
  | "last_admin_protection"
  | "already_active"
  | "already_inactive"
  | "already_cancelled"
  | "already_suspended"
  | "not_cancellable"
  | "lifecycle_unavailable"
  | "audit_failed"
  | "not_found"
  | "cross_org_rejected"
  | "invalid_payload"
  | "capacity_mutation_unavailable";

export const MIN_REASON_LENGTH = 8;

export function isOrganizationAdminRole(roles: readonly string[]): boolean {
  return roles.some((r) => (MA7_ADMIN_ROLES as readonly string[]).includes(r));
}

export function countActiveAdmins(
  memberships: Array<{ status: string; roles: readonly string[] }>
): number {
  return memberships.filter((m) => m.status === "active" && isOrganizationAdminRole(m.roles)).length;
}

/** Reject deactivation when this membership is the sole active admin. */
export function wouldRemoveLastAdmin(input: {
  target: { status: string; roles: readonly string[] };
  requestedStatus: Ma7MembershipStatus;
  activeAdminCount: number;
}): boolean {
  if (input.requestedStatus !== "inactive") return false;
  if (input.target.status !== "active") return false;
  if (!isOrganizationAdminRole(input.target.roles)) return false;
  return input.activeAdminCount <= 1;
}

export function validateReason(reason: unknown): { ok: true; reason: string } | { ok: false; code: "reason_required" } {
  if (typeof reason !== "string") return { ok: false, code: "reason_required" };
  const trimmed = reason.trim();
  if (trimmed.length < MIN_REASON_LENGTH) return { ok: false, code: "reason_required" };
  return { ok: true, reason: trimmed };
}

export type Ma7ConfirmAction =
  | "deactivate_membership"
  | "reactivate_membership"
  | "cancel_subscription"
  | "reactivate_subscription"
  | "suspend_organization"
  | "reactivate_organization";

const CONFIRM_TOKENS: Record<Ma7ConfirmAction, string> = {
  deactivate_membership: "DEACTIVATE",
  reactivate_membership: "REACTIVATE",
  cancel_subscription: "CANCEL",
  reactivate_subscription: "REACTIVATE",
  suspend_organization: "SUSPEND",
  reactivate_organization: "REACTIVATE"
};

/**
 * Server must validate confirmation intent — a bare boolean is insufficient.
 * For org suspend (when supported), confirmationPhrase must match organization name/slug.
 */
export function validateConfirmation(input: {
  action: Ma7ConfirmAction;
  confirm: unknown;
  confirmationToken: unknown;
  confirmationPhrase?: unknown;
  expectedPhrase?: string | null;
}): { ok: true } | { ok: false; code: "confirmation_required" } {
  if (input.confirm !== true) return { ok: false, code: "confirmation_required" };
  const token = typeof input.confirmationToken === "string" ? input.confirmationToken.trim() : "";
  if (token !== CONFIRM_TOKENS[input.action]) {
    return { ok: false, code: "confirmation_required" };
  }
  if (input.action === "suspend_organization" || input.action === "reactivate_organization") {
    const phrase = typeof input.confirmationPhrase === "string" ? input.confirmationPhrase.trim() : "";
    const expected = (input.expectedPhrase ?? "").trim();
    if (!expected || phrase !== expected) {
      return { ok: false, code: "confirmation_required" };
    }
  }
  return { ok: true };
}

export function classifyMembershipTransition(input: {
  current: Ma7MembershipStatus;
  requested: Ma7MembershipStatus;
}): "apply" | "already_active" | "already_inactive" | "invalid_state" {
  if (input.requested !== "active" && input.requested !== "inactive") return "invalid_state";
  if (input.current === input.requested) {
    return input.requested === "active" ? "already_active" : "already_inactive";
  }
  return "apply";
}

export function classifySubscriptionCancel(input: {
  status: string | null;
  cancelAtPeriodEnd: boolean;
}): "apply" | "already_cancelled" | "not_cancellable" {
  if (input.cancelAtPeriodEnd) return "already_cancelled";
  if (input.status === "canceled" || input.status === "expired") return "not_cancellable";
  if (!input.status) return "not_cancellable";
  return "apply";
}

export function classifySubscriptionReactivate(input: {
  status: string | null;
  cancelAtPeriodEnd: boolean;
}): "apply" | "already_active" | "invalid_state" {
  if (!input.status) return "invalid_state";
  if (input.status === "active" && !input.cancelAtPeriodEnd) return "already_active";
  // Existing lifecycle service handles cancel-at-period-end clear + transition to active.
  return "apply";
}

export function newCorrelationId(): string {
  return `ma7_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export const ORG_LIFECYCLE_BLOCKER =
  "Organization suspend/reactivate is unavailable: organizations table has no lifecycle status field, and Product Owner has not approved suspend side effects (login block / entitlement freeze / Stripe). Do not invent incompatible semantics.";

export const CAPACITY_MUTATION_BLOCKER =
  "Capacity mutation remains read-only; no governed administrative mutation exists. Unit-volume capacity remains Stripe/webhook-authoritative (MA-4).";
