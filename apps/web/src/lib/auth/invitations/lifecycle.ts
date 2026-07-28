/**
 * AUTH-001 Slice C — client-side invitation lifecycle helpers for Team Settings.
 */

export type InvitationLifecycleAction = "resend" | "revoke" | "edit-email";

export function invitationActionPath(
  organizationId: string,
  invitationId: string,
  action: InvitationLifecycleAction
): string {
  return `/api/organizations/${organizationId}/invitations/${invitationId}/${action}`;
}

export function isPendingInvitation(status: string): boolean {
  return status === "pending";
}

export function isInvitationExpired(expiresAt: string, now = Date.now()): boolean {
  return new Date(expiresAt).getTime() < now;
}

/** Resend / edit-email require an unexpired pending invite. */
export function canResendOrEditInvitation(
  status: string,
  expiresAt: string,
  now = Date.now()
): boolean {
  return isPendingInvitation(status) && !isInvitationExpired(expiresAt, now);
}

/** Revoke remains available for any pending invite, including expired. */
export function canRevokeInvitation(status: string): boolean {
  return isPendingInvitation(status);
}

export function normalizeInvitationEmail(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  return normalized.includes("@") ? normalized : null;
}
